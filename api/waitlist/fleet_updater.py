import threading
import time
import sqlalchemy
from . import esi
from .database import Session, Fleet, FleetSquad, WaitlistEntry, WaitlistEntryFit
from .data import messager


def notify_waitlist_update(waitlist_id: int) -> None:
    messager.MESSAGER.send_json(
        ["waitlist"], "waitlist_update", {"waitlist_id": waitlist_id}
    )


def update_fleet(session: sqlalchemy.orm.session.Session, fleet: Fleet) -> None:
    try:
        members = esi.get("/v1/fleets/%d/members" % fleet.id, fleet.boss_id).json()
    except esi.HTTP404:
        # Fleet no longer exists
        session.query(FleetSquad).filter(FleetSquad.fleet_id == fleet.id).delete()
        session.delete(fleet)  # type: ignore
        session.commit()
        return

    member_ids = set(member["character_id"] for member in members)

    waitlist_ids = set()
    for entry_fit in session.query(WaitlistEntryFit):
        if entry_fit.character_id in member_ids:
            waitlist_ids.add(entry_fit.entry.waitlist_id)
            session.query(WaitlistEntryFit).filter(
                WaitlistEntryFit.entry_id == entry_fit.entry_id
            ).delete()
            session.query(WaitlistEntry).filter(
                WaitlistEntry.id == entry_fit.entry_id
            ).delete()

    session.commit()
    for waitlist_id in waitlist_ids:
        notify_waitlist_update(waitlist_id)


def fleet_updater() -> None:
    while True:
        session = Session()
        try:
            for fleet in session.query(Fleet).all():
                update_fleet(session, fleet)
        except Exception as exc:  # pylint: disable=broad-except
            print(exc)
            time.sleep(30)
        finally:
            session.close()

        time.sleep(6)  # ESI docs say fleets are cached for "up to 5 seconds"


def create_fleet_updater() -> threading.Thread:
    return threading.Thread(target=fleet_updater, daemon=True)
