from typing import Dict, List
from flask import Blueprint, g, request

from . import auth, category
from .webutil import ViewReturn
from .data import esi
from .data.database import Character, Fleet, FleetSquad

bp = Blueprint("fleet", __name__)


@bp.route("/api/fleet/status")
@auth.login_required
@auth.admin_only
def fleet_status() -> ViewReturn:
    squads_by_fleet: Dict[int, List[FleetSquad]] = {}
    for squad in g.db.query(FleetSquad).all():
        squads_by_fleet.setdefault(squad.fleet_id, []).append(squad)

    result = []
    for fleet, fleet_boss in g.db.query(Fleet, Character).join(Fleet.boss):
        result.append(
            dict(
                id=fleet.id,
                boss={"id": fleet_boss.id, "name": fleet_boss.name},
            )
        )
    return {"fleets": result}


@bp.route("/api/fleet/info")
@auth.login_required
@auth.select_character()
@auth.admin_only
def fleet_info() -> ViewReturn:
    basic_info = esi.get(
        "/v1/characters/%d/fleet" % g.character_id, g.character_id
    ).json()
    fleet_id = basic_info["fleet_id"]
    members = esi.get("/v1/fleets/%d/members" % fleet_id, g.character_id).json()
    wings = esi.get("/v1/fleets/%d/wings" % fleet_id, g.character_id).json()

    boss_in_fleet = list(filter(lambda member: "Boss" in member["role_name"], members))[
        0
    ]

    return {
        **basic_info,
        "members": members,
        "wings": wings,
        "fleet_boss": boss_in_fleet["character_id"],
        "is_fleet_boss": boss_in_fleet["character_id"] == g.character_id,
    }


@bp.route("/api/fleet/register", methods=["POST"])
@auth.login_required
@auth.select_character()
@auth.admin_only
def register_fleet() -> ViewReturn:
    fleet_id = request.json["fleet_id"]
    assignments = request.json["assignments"]

    fleet = g.db.query(Fleet).filter(Fleet.id == fleet_id).one_or_none()
    if not fleet:
        fleet = Fleet(id=fleet_id)
        g.db.add(fleet)
    fleet.boss_id = g.character_id

    g.db.query(FleetSquad).filter(FleetSquad.fleet_id == fleet_id).delete()
    for category_id, _category_name in category.CATEGORIES.items():
        if category_id not in assignments:
            raise Exception("Missing category assignment for %s" % category_id)

        g.db.add(
            FleetSquad(
                fleet=fleet,
                category=category_id,
                wing_id=assignments[category_id][0],
                squad_id=assignments[category_id][1],
            )
        )

    g.db.commit()
    return "OK"
