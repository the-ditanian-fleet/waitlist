import datetime
from typing import Dict
from flask import Blueprint, g
from . import auth
from .webutil import ViewReturn
from .data.database import FleetActivity
from .data.evedb import name_of

bp = Blueprint("fleet_history", __name__)


@bp.route("/api/history/fleet")
@auth.login_required
@auth.select_character(override_permission="fleet-activity-view")
def get_fleet_history() -> ViewReturn:
    activity = []
    summary_by_hull: Dict[int, int] = {}
    for entry in (
        g.db.query(FleetActivity)
        .filter(FleetActivity.character_id == g.character_id)
        .order_by(FleetActivity.first_seen.desc())
    ):
        logged_at = datetime.datetime.utcfromtimestamp(entry.first_seen)
        time_in_fleet = entry.last_seen - entry.first_seen
        summary_by_hull.setdefault(entry.hull, 0)
        summary_by_hull[entry.hull] += time_in_fleet
        activity.append(
            {
                "logged_at": logged_at,
                "hull": {"id": entry.hull, "name": name_of(entry.hull)},
                "time_in_fleet": time_in_fleet,
            }
        )

    summary = []
    for hull_id, time_in_fleet in reversed(
        sorted(summary_by_hull.items(), key=lambda item: item[1])
    ):
        summary.append(
            {
                "hull": {"id": hull_id, "name": name_of(hull_id)},
                "time_in_fleet": time_in_fleet,
            }
        )

    return {
        "activity": activity,
        "summary": summary,
    }
