from typing import Dict, List, Any
from flask import Blueprint, g, request
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
        time_in_fleet = entry.last_seen - entry.first_seen
        summary_by_hull.setdefault(entry.hull, 0)
        summary_by_hull[entry.hull] += time_in_fleet
        activity.append(
            {
                "logged_at": entry.first_seen,
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


@bp.route("/api/history/fleet-comp")
@auth.login_required
@auth.require_permission("fleet-comp-history")
def get_fleet_comp() -> ViewReturn:
    lookup_time = int(request.args["time"])

    result: Dict[int, List[Dict[str, Any]]] = {}
    for log_entry in (
        g.db.query(FleetActivity)
        .join(FleetActivity.character)
        .filter(
            FleetActivity.first_seen <= lookup_time,
            FleetActivity.last_seen >= lookup_time,
        )
    ):
        result.setdefault(log_entry.fleet_id, []).append(
            {
                "character": {
                    "id": log_entry.character_id,
                    "name": log_entry.character.name,
                },
                "hull": {
                    "id": log_entry.hull,
                    "name": name_of(log_entry.hull),
                },
                "logged_at": log_entry.first_seen,
                "time_in_fleet": log_entry.last_seen - log_entry.first_seen,
            }
        )

    return {
        "fleets": result,
    }
