from typing import Dict, List
from flask import Blueprint, g, request

from . import auth, tdf
from .webutil import ViewReturn
from .data import esi, evedb
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
    try:
        basic_info = esi.get(
            "/v1/characters/%d/fleet" % g.character_id, g.character_id
        ).json()
    except esi.HTTP403:
        return "Missing ESI scopes", 403
    except esi.HTTP404:
        return "You are not in a fleet", 404

    try:
        wings = esi.get(
            "/v1/fleets/%d/wings" % basic_info["fleet_id"], g.character_id
        ).json()
    except esi.HTTP404:
        return "You are not the fleet boss", 404

    return {
        **basic_info,
        "wings": wings,
    }


@bp.route("/api/fleet/members")
@auth.login_required
@auth.select_character()
@auth.admin_only
def fleet_members() -> ViewReturn:
    try:
        basic_info = esi.get(
            "/v1/characters/%d/fleet" % g.character_id, g.character_id
        ).json()
    except esi.HTTP403:
        return "Missing ESI scopes", 403
    except esi.HTTP404:
        return "You are not in a fleet", 404

    fleet = g.db.query(Fleet).filter(Fleet.id == basic_info["fleet_id"]).one_or_none()
    if not fleet:
        return "Fleet not configured", 404

    members_raw = esi.get("/v1/fleets/%d/members" % fleet.id, fleet.boss_id).json()

    characters = {
        character.id: character
        for character in g.db.query(Character)
        .filter(Character.id.in_([member["character_id"] for member in members_raw]))
        .all()
    }

    members = []
    for member in members_raw:
        character_id = member["character_id"]
        character = characters[character_id] if character_id in characters else None
        members.append(
            {
                "id": character_id,
                "name": character.name if character else None,
                "ship": {
                    "id": member["ship_type_id"],
                    "name": evedb.name_of(member["ship_type_id"]),
                },
            }
        )

    return {
        "members": members,
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
    for category_id, _category_name in tdf.CATEGORIES.items():
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


@bp.route("/api/fleet/close", methods=["POST"])
@auth.login_required
@auth.select_character()
@auth.admin_only
def close_fleet() -> ViewReturn:
    try:
        fleet = esi.get(
            "/v1/characters/%d/fleet" % g.character_id, g.character_id
        ).json()
        fleet_id = fleet["fleet_id"]

    except esi.HTTP404:
        return "Not in a fleet", 404

    for member in esi.get("/v1/fleets/%d/members" % fleet_id, g.character_id).json():
        if member["character_id"] == g.character_id:
            # Don't kick ourselves
            continue

        esi.delete(
            "/v1/fleets/%d/members/%d/" % (fleet_id, member["character_id"]),
            g.character_id,
        )

    return "OK"
