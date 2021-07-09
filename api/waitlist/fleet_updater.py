import threading
import time
import logging
from typing import Any, Dict, Set
import sqlalchemy
from .data import sse, esi
from .data.database import (
    Character,
    Session,
    Fleet,
    FleetSquad,
    WaitlistEntry,
    WaitlistEntryFit,
    FleetActivity,
)


LOG = logging.getLogger(__name__)


def notify_waitlist_update(waitlist_id: int) -> None:
    sse.submit(
        [
            sse.message_json(
                "waitlist", "waitlist_update", {"waitlist_id": waitlist_id}
            ),
        ]
    )


def update_fleet(session: sqlalchemy.orm.session.Session, fleet: Fleet) -> None:
    # Lock the fleet by starting a transaction
    fleet.is_updating = True

    try:
        members_raw = esi.get("/v1/fleets/%d/members" % fleet.id, fleet.boss_id).json()
    except (esi.HTTP404, esi.HTTP403):
        # Fleet no longer exists
        session.query(FleetSquad).filter(FleetSquad.fleet_id == fleet.id).delete()
        session.delete(fleet)
        session.commit()
        return

    members = {member["character_id"]: member for member in members_raw}

    _update_characters(session, fleet, members)
    waitlist_ids = _update_waitlist(session, members)
    _update_activity(session, fleet, members)

    # (almost) All done!
    fleet.is_updating = False
    session.commit()

    # Do this after releasing the lock, in case the notifications take a while
    for waitlist_id in waitlist_ids:
        notify_waitlist_update(waitlist_id)


def _update_characters(
    session: sqlalchemy.orm.session.Session,
    fleet: Fleet,
    members: Dict[int, Dict[str, Any]],
) -> None:
    "Ensure we have names for everyone in fleet stored"

    in_db = {
        character.id: True
        for character in session.query(Character).filter(
            Character.id.in_(members.keys())
        )
    }
    for character_id in members.keys():
        if character_id not in in_db:
            character_info = esi.get(
                "/v4/characters/%d/" % character_id, fleet.boss_id
            ).json()
            session.add(
                Character(
                    id=character_id,
                    name=character_info["name"],
                )
            )


def _update_waitlist(
    session: sqlalchemy.orm.session.Session, members: Dict[int, Dict[str, Any]]
) -> Set[int]:
    waitlist_ids = set()
    member_ids = set(members.keys())
    for entry_fit in session.query(WaitlistEntryFit):
        if entry_fit.character_id in member_ids:
            session.query(WaitlistEntryFit).filter(
                WaitlistEntryFit.entry_id == entry_fit.entry_id
            ).delete()
            entry = (
                session.query(WaitlistEntry)
                .filter(WaitlistEntry.id == entry_fit.entry_id)
                .one_or_none()
            )
            if entry:
                session.delete(entry)
                waitlist_ids.add(entry.waitlist_id)

    return waitlist_ids


def _update_activity(
    session: sqlalchemy.orm.session.Session,
    fleet: Fleet,
    members: Dict[int, Dict[str, Any]],
) -> None:
    stored = {
        activity.character_id: activity
        for activity in session.query(FleetActivity)
        .filter(FleetActivity.fleet_id == fleet.id, FleetActivity.has_left.in_([False]))
        .order_by(FleetActivity.last_seen.asc())
    }

    current_time = int(time.time())

    if len(members) < 8:
        # Don't track anything if the fleet is very, very small
        members = {}

    for member in members.values():
        character_id = member["character_id"]

        # Detect ship changes: archive with has_left=True if it happens
        if character_id in stored:
            if stored[character_id].hull != member["ship_type_id"]:
                stored[character_id].has_left = True
                stored[character_id].last_seen = current_time
                del stored[character_id]

        if not character_id in stored:
            stored[character_id] = FleetActivity(
                character_id=character_id,
                fleet_id=fleet.id,
                first_seen=current_time,
                last_seen=current_time,
                hull=member["ship_type_id"],
            )
            session.add(stored[character_id])

        this_entry = stored[character_id]
        if current_time - this_entry.last_seen > 60:
            # Reduce database writes by only writing once per minute
            this_entry.last_seen = current_time

    for stored_entry in stored.values():
        if stored_entry.character_id not in members:
            stored_entry.has_left = True


def fleet_updater() -> None:
    while True:
        session = Session()
        sleep_time = 6  # ESI docs say fleets are cached for "up to 5 seconds"
        try:
            for fleet in session.query(Fleet).all():
                update_fleet(session, fleet)
        except Exception:  # pylint: disable=broad-except
            session.rollback()
            LOG.exception("Failed to run fleet updater")
            sleep_time = 30
        finally:
            session.close()

        time.sleep(sleep_time)


def create_fleet_updater() -> threading.Thread:
    return threading.Thread(target=fleet_updater, daemon=True)
