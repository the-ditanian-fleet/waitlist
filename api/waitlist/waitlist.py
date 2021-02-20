from typing import Dict, List, Tuple
from flask import Blueprint, request, g

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
)
from .webutil import ViewReturn

bp = Blueprint("waitlist", __name__)


def notify_waitlist_update(waitlist_id: int) -> None:
    messager.MESSAGER.send_json(
        ["waitlist"], "waitlist_update", {"waitlist_id": waitlist_id}
    )


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
    wl_by_entry: Dict[int, List[Tuple[WaitlistEntryFit, Character, Fitting]]] = {}
    hull_ids = set()
    for fit in (
        g.db.query(WaitlistEntryFit, Character, Fitting)
        .join(WaitlistEntryFit.character)
        .join(WaitlistEntryFit.fit)
    ):
        wl_by_entry.setdefault(fit[0].entry_id, []).append(fit)
        hull_ids.add(fit[2].hull)

    hull_names = evedb.type_names(list(hull_ids))
    for entry, account in (
        g.db.query(WaitlistEntry, Character)
        .join(WaitlistEntry.account)
        .order_by(WaitlistEntry.id.asc())
    ):
        can_see_full = g.is_admin or account.id == g.account_id

        fits_raw = wl_by_entry.get(entry.id, [])
        fits = []
        for fitentry, character, fitting in fits_raw:
            fit = {
                "id": fitentry.id,
                "approved": bool(fitentry.approved),
                "category": tdf.CATEGORIES[fitentry.category],
            }
            if can_see_full or fitentry.approved:
                fit["hull"] = {"id": fitting.hull, "name": hull_names[fitting.hull]}
            if can_see_full:
                fit["dna"] = fitting.dna
                fit["character"] = {"name": character.name, "id": character.id}
                fit["tags"] = list(
                    filter(lambda tag: len(tag) > 0, fitentry.tags.split(","))
                )
            fits.append(fit)

        waitlist_entries.append(
            dict(
                id=entry.id,
                fits=fits,
                character={"name": account.name, "id": account.id}
                if can_see_full
                else None,
                joined_at=entry.joined_at,
                can_manage=g.is_admin,
                can_remove=g.is_admin or g.account_id == account.id,
            )
        )

    return {"waitlist": waitlist_entries, "open": True}


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
        g.db.query(Waitlist).filter(Waitlist.id == request.json["waitlist_id"]).one()
    )

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

    for dna in dnas:
        fitting = g.db.query(Fitting).filter(Fitting.dna == dna).one_or_none()
        if not fitting:
            hull = int(dna.split(":")[0])
            fitting = Fitting(dna=dna, hull=hull)
            g.db.add(fitting)

        fit_error = tdf.check_valid(dna, skilldata)
        if fit_error:
            return fit_error, 400

        category_name, tags = tdf.categorize(dna, skilldata, implantdata)
        g.db.add(
            WaitlistEntryFit(
                character_id=g.character_id,
                entry=waitlist_entry,
                fit=fitting,
                category=category_name,
                approved=False,
                tags=",".join(tags),
            )
        )
        g.db.add(
            FitHistory(
                character_id=g.character_id,
                fit=fitting,
            )
        )

    g.db.commit()

    notify_waitlist_update(waitlist.id)
    messager.MESSAGER.send_json(["xup"], "message", {"message": "New x-up in waitlist"})

    return "OK"


@bp.route("/api/waitlist/approve", methods=["POST"])
@auth.login_required
@auth.admin_only
def approve() -> ViewReturn:
    fit_entry_id = request.json["id"]

    fit_entry = (
        g.db.query(WaitlistEntryFit).filter(WaitlistEntryFit.id == fit_entry_id).one()
    )
    fit_entry.approved = True
    g.db.commit()

    notify_waitlist_update(fit_entry.entry.waitlist_id)

    return "OK"


@bp.route("/api/waitlist/set_open", methods=["POST"])
@auth.login_required
@auth.admin_only
def set_open() -> ViewReturn:
    waitlist = (
        g.db.query(Waitlist).filter(Waitlist.id == request.json["waitlist_id"]).one()
    )
    waitlist.is_open = bool(request.json["open"])
    g.db.commit()
    notify_waitlist_update(waitlist.id)
    return "OK"


@bp.route("/api/waitlist/remove_fit", methods=["POST"])
@auth.login_required
def remove_fit() -> ViewReturn:
    fit_entry_id = request.json["id"]

    fit_entry = (
        g.db.query(WaitlistEntryFit).filter(WaitlistEntryFit.id == fit_entry_id).one()
    )
    if not fit_entry.entry.account_id == g.account_id and not g.is_admin:
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
    if entry.account_id != g.account_id and not g.is_admin:
        return "Unauthorized", 401

    g.db.query(WaitlistEntryFit).filter(WaitlistEntryFit.entry_id == entry.id).delete()
    g.db.delete(entry)
    g.db.commit()

    notify_waitlist_update(entry.waitlist_id)

    return "OK"


@bp.route("/api/waitlist/invite", methods=["POST"])
@auth.login_required
@auth.select_character()
@auth.admin_only
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
