from typing import Dict, List, Tuple, Any, Optional
import json
import datetime
from flask import Blueprint, request, g
from sqlalchemy import or_, and_
from sqlalchemy.sql import func

from . import auth, eft2dna, tdf
from .data import messager, skills, esi, evedb, implants
from .data.database import (
    Waitlist,
    WaitlistEntry,
    WaitlistEntryFit,
    Character,
    Fitting,
    Fleet,
    FleetSquad,
    FitHistory,
    ImplantSet,
    Ban,
    FleetActivity,
)
from .webutil import ViewReturn

bp = Blueprint("waitlist", __name__)


def notify_waitlist_update(waitlist_id: int) -> None:
    messager.MESSAGER.send_json(
        ["waitlist"], "waitlist_update", {"waitlist_id": waitlist_id}
    )


def _add_ids(fit_analysis: Dict[str, Any]) -> Dict[str, Any]:
    new_analysis = {**fit_analysis}
    if "_ids" in fit_analysis:
        new_analysis["_ids"] = evedb.type_names(fit_analysis["_ids"])
    return new_analysis


@bp.route("/api/waitlist")
@auth.login_required
def get_waitlist() -> ViewReturn:
    if not "waitlist_id" in request.args:
        return "No waitlist_id in request", 400
    waitlist_id = int(request.args["waitlist_id"])

    waitlist = g.db.query(Waitlist).filter(Waitlist.id == waitlist_id).one()
    if not waitlist.is_open:
        return {"open": False}

    waitlist_entries = []
    wl_by_entry: Dict[
        int, List[Tuple[WaitlistEntryFit, Character, Fitting, ImplantSet]]
    ] = {}
    for fit in (
        g.db.query(WaitlistEntryFit, Character, Fitting, ImplantSet)
        .join(WaitlistEntryFit.character)
        .join(WaitlistEntryFit.fit)
        .join(WaitlistEntryFit.implant_set)
    ):
        wl_by_entry.setdefault(fit[0].entry_id, []).append(fit)

    for entry, account in (
        g.db.query(WaitlistEntry, Character)
        .join(WaitlistEntry.account)
        .order_by(WaitlistEntry.id.asc())
    ):
        x_is_ours = account.id == g.account_id

        fits_raw = wl_by_entry.get(entry.id, [])
        fits = []
        for fitentry, character, fitting, implant_set in fits_raw:
            fit = {
                "id": fitentry.id,
                "approved": bool(fitentry.approved),
                "category": tdf.CATEGORIES[fitentry.category],
            }

            tags = list(filter(lambda tag: len(tag) > 0, fitentry.tags.split(",")))

            if x_is_ours or auth.has_access("waitlist-view") or fitentry.approved:
                fit["hull"] = {"id": fitting.hull, "name": evedb.name_of(fitting.hull)}

            if x_is_ours or auth.has_access("waitlist-view"):
                fit["character"] = {"name": character.name, "id": character.id}
                fit["tags"] = tags
                fit["hours_in_fleet"] = round(fitentry.cached_time_in_fleet / 3600)
                if fitentry.reject_reason:
                    fit["reject_reason"] = fitentry.reject_reason
            else:
                fit["tags"] = list(filter(lambda tag: tag in tdf.PUBLIC_TAGS, tags))

            if x_is_ours or (
                auth.has_access("waitlist-view") and auth.has_access("fit-view")
            ):
                fit["dna"] = fitting.dna
                fit["implants"] = list(
                    map(int, filter(lambda x: x, implant_set.implants.split(":")))
                )
                if fitentry.fit_analysis:
                    fit["fit_analysis"] = _add_ids(json.loads(fitentry.fit_analysis))

            fits.append(fit)

        waitlist_entries.append(
            dict(
                id=entry.id,
                fits=fits,
                character=(
                    {"name": account.name, "id": account.id}
                    if (x_is_ours or auth.has_access("waitlist-view"))
                    else None
                ),
                joined_at=entry.joined_at,
                can_remove=auth.has_access("waitlist-manage") or x_is_ours,
            )
        )

    return {
        "waitlist": waitlist_entries,
        "open": True,
        "categories": list(tdf.CATEGORIES.values()),
    }


def _am_i_banned() -> bool:
    esi_info = esi.get("/v4/characters/%d/" % g.character_id, g.character_id).json()
    corporation_id: Optional[int] = esi_info.get("corporation_id", None)
    alliance_id: Optional[int] = esi_info.get("alliance_id", None)

    conditions = [and_(Ban.kind == "character", Ban.id == g.character_id)]
    if corporation_id:
        conditions.append(and_(Ban.kind == "corporation", Ban.id == corporation_id))
    if alliance_id:
        conditions.append(and_(Ban.kind == "alliance", Ban.id == alliance_id))

    for ban_record in g.db.query(Ban).filter(or_(*conditions)):
        if (
            not ban_record.expires_at
            or ban_record.expires_at > datetime.datetime.utcnow()
        ):
            return True

    return False


def _get_time_in_fleet(character_id: int) -> int:
    # Lazy SQL: sum(end-start) is equal to sum(end)-sum(start)
    total_start, total_end = (
        g.db.query(
            func.sum(FleetActivity.first_seen), func.sum(FleetActivity.last_seen)
        )
        .filter(FleetActivity.character_id == character_id)
        .one()
    )

    if total_end is None:
        # Some databases can return NULL when summing no rows
        return 0

    return total_end - total_start  # type: ignore


@bp.route("/api/waitlist/xup", methods=["POST"])
@auth.login_required
@auth.select_character()
def xup() -> ViewReturn:
    dnas = list(map(eft2dna.eft2dna, eft2dna.split_eft(request.json["eft"])))
    if len(dnas) > 10:
        return "Too many fits", 400

    # Load external resources before doing database writes
    skilldata = skills.load_character_skills(g.character_id)
    implantdata = implants.load_character_implants(g.character_id)

    waitlist = (
        g.db.query(Waitlist)
        .filter(Waitlist.id == request.json["waitlist_id"])
        .one_or_none()
    )

    if not (waitlist and waitlist.is_open):
        return "Waitlist not found", 404

    if _am_i_banned():
        return "Action not permitted (banned)", 400

    waitlist_entry = (
        g.db.query(WaitlistEntry)
        .filter(
            WaitlistEntry.account_id == g.account_id,
            WaitlistEntry.waitlist_id == waitlist.id,
        )
        .one_or_none()
    )

    if waitlist_entry:
        # Existing x: check we don't have a bazillion fits already
        if (
            g.db.query(WaitlistEntryFit)
            .filter(WaitlistEntryFit.entry_id == waitlist_entry.id)
            .count()
            > 10
        ):
            return "Too many fits", 400

    else:
        waitlist_entry = WaitlistEntry(waitlist_id=waitlist.id, account_id=g.account_id)
        g.db.add(waitlist_entry)

    implant_set = (
        g.db.query(ImplantSet)
        .filter(ImplantSet.implants == ":".join(map(str, sorted(implantdata))))
        .one_or_none()
    )
    if not implant_set:
        implant_set = ImplantSet(implants=":".join(map(str, sorted(implantdata))))
        g.db.add(implant_set)

    time_in_fleet = _get_time_in_fleet(g.character_id)

    for dna in dnas:
        # Store the fit DNA if it's not already stored
        fitting = g.db.query(Fitting).filter(Fitting.dna == dna).one_or_none()
        if not fitting:
            hull = int(dna.split(":")[0])
            fitting = Fitting(dna=dna, hull=hull)
            g.db.add(fitting)

        # Check fit to tag/approve/categorize/etc
        fit_check = tdf.check_fit(dna, skilldata, implantdata)
        if fit_check.errors:
            return fit_check.errors[0], 400

        # Replace the previous x'up if we see the same hull twice
        existing_x_for_hull = (
            g.db.query(WaitlistEntryFit, Fitting)
            .join(WaitlistEntryFit.fit)
            .filter(
                WaitlistEntryFit.entry == waitlist_entry, Fitting.hull == fitting.hull
            )
            .one_or_none()
        )
        if existing_x_for_hull:
            g.db.delete(existing_x_for_hull[0])

        # X!
        g.db.add(
            WaitlistEntryFit(
                character_id=g.character_id,
                entry=waitlist_entry,
                fit=fitting,
                category=fit_check.category,
                approved=fit_check.approved,
                tags=",".join(sorted(list(fit_check.tags))),
                implant_set=implant_set,
                fit_analysis=json.dumps(fit_check.fit_check),
                cached_time_in_fleet=time_in_fleet,
            )
        )

        # Log the fit in history
        g.db.add(
            FitHistory(
                character_id=g.character_id,
                fit=fitting,
                implant_set=implant_set,
            )
        )

    g.db.commit()

    notify_waitlist_update(waitlist.id)
    messager.MESSAGER.send_json(["xup"], "message", {"message": "New x-up in waitlist"})

    return "OK"


@bp.route("/api/waitlist/approve", methods=["POST"])
@auth.login_required
@auth.require_permission("waitlist-manage")
def approve() -> ViewReturn:
    fit_entry_id = request.json["id"]

    fit_entry = (
        g.db.query(WaitlistEntryFit).filter(WaitlistEntryFit.id == fit_entry_id).one()
    )
    fit_entry.approved = True
    fit_entry.reject_reason = None
    g.db.commit()

    notify_waitlist_update(fit_entry.entry.waitlist_id)

    return "OK"


@bp.route("/api/waitlist/reject", methods=["POST"])
@auth.login_required
@auth.require_permission("waitlist-manage")
def reject() -> ViewReturn:
    fit_entry_id = request.json["id"]

    fit_entry = (
        g.db.query(WaitlistEntryFit).filter(WaitlistEntryFit.id == fit_entry_id).one()
    )
    fit_entry.approved = False
    fit_entry.reject_reason = str(request.json["reject_reason"])
    g.db.commit()

    notify_waitlist_update(fit_entry.entry.waitlist_id)

    return "OK"


@bp.route("/api/waitlist/set_open", methods=["POST"])
@auth.login_required
@auth.require_permission("waitlist-edit")
def set_open() -> ViewReturn:
    waitlist = (
        g.db.query(Waitlist).filter(Waitlist.id == request.json["waitlist_id"]).one()
    )
    waitlist.is_open = bool(request.json["open"])
    g.db.commit()
    notify_waitlist_update(waitlist.id)
    return "OK"


@bp.route("/api/waitlist/empty", methods=["POST"])
@auth.login_required
@auth.require_permission("waitlist-edit")
def empty_waitlist() -> ViewReturn:
    waitlist = (
        g.db.query(Waitlist).filter(Waitlist.id == request.json["waitlist_id"]).one()
    )
    if waitlist.is_open:
        return "Waitlist must be closed in order to empty it", 400

    entries = (
        g.db.query(WaitlistEntry).filter(WaitlistEntry.waitlist_id == waitlist.id).all()
    )
    entry_ids = [entry.id for entry in entries]

    g.db.query(WaitlistEntryFit).filter(
        WaitlistEntryFit.entry_id.in_(entry_ids)
    ).delete(synchronize_session=False)
    g.db.query(WaitlistEntry).filter(WaitlistEntry.id.in_(entry_ids)).delete(
        synchronize_session=False
    )

    g.db.commit()
    return "OK"


@bp.route("/api/waitlist/remove_fit", methods=["POST"])
@auth.login_required
def remove_fit() -> ViewReturn:
    fit_entry_id = request.json["id"]

    fit_entry = (
        g.db.query(WaitlistEntryFit).filter(WaitlistEntryFit.id == fit_entry_id).one()
    )
    if not fit_entry.entry.account_id == g.account_id and not auth.has_access(
        "waitlist-manage"
    ):
        return "Unauthorized", 401

    other_entries_count = (
        g.db.query(WaitlistEntryFit)
        .filter(
            WaitlistEntryFit.entry_id == fit_entry.entry_id,
            WaitlistEntryFit.id != fit_entry.id,
        )
        .count()
    )

    g.db.delete(fit_entry)
    if not other_entries_count:
        g.db.delete(fit_entry.entry)
    g.db.commit()

    notify_waitlist_update(fit_entry.entry.waitlist_id)

    return "OK"


@bp.route("/api/waitlist/remove_x", methods=["POST"])
@auth.login_required
def remove_x() -> ViewReturn:
    entry_id = request.json["id"]

    entry = g.db.query(WaitlistEntry).filter(WaitlistEntry.id == entry_id).one()
    if entry.account_id != g.account_id and not auth.has_access("waitlist-manage"):
        return "Unauthorized", 401

    g.db.query(WaitlistEntryFit).filter(WaitlistEntryFit.entry_id == entry.id).delete()
    g.db.delete(entry)
    g.db.commit()

    notify_waitlist_update(entry.waitlist_id)

    return "OK"


@bp.route("/api/waitlist/invite", methods=["POST"])
@auth.login_required
@auth.select_character()
@auth.require_permission("fleet-invite")
def invite() -> ViewReturn:
    fit_entry_id = request.json["id"]

    fleet = g.db.query(Fleet).filter(Fleet.boss_id == g.character_id).one_or_none()
    if not fleet:
        return "Fleet not configured", 400

    entry_fit, entry, fitting = (
        g.db.query(WaitlistEntryFit, WaitlistEntry, Fitting)
        .join(WaitlistEntryFit.entry)
        .join(WaitlistEntryFit.fit)
        .filter(WaitlistEntryFit.id == fit_entry_id)
        .one()
    )

    squad = (
        g.db.query(FleetSquad)
        .filter(
            FleetSquad.fleet_id == fleet.id, FleetSquad.category == entry_fit.category
        )
        .one()
    )

    try:
        esi.post(
            "/v1/fleets/%d/members/" % fleet.id,
            g.character_id,
            json={
                "character_id": entry_fit.character_id,
                "role": "squad_member",
                "squad_id": squad.squad_id,
                "wing_id": squad.wing_id,
            },
        )
    except esi.HTTP520 as exc:
        return exc.text, exc.code

    messager.MESSAGER.send(
        ["account;%d" % entry.account_id],
        "wakeup",
        "You have been invited to fleet with %s" % evedb.name_of(fitting.hull),
    )

    return "OK"
