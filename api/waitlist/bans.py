from typing import Dict, List, Any
from flask import Blueprint, request, g
from . import auth
from .webutil import ViewReturn
from .data.database import Ban, Character

bp = Blueprint("bans", __name__)


@bp.route("/api/bans/add", methods=["POST"])
@auth.login_required
@auth.admin_only
def add_ban() -> ViewReturn:
    kind = request.args["kind"]
    if kind not in ["character", "corporation", "alliance"]:
        return "Invalid 'kind'", 400

    target = int(request.args["id"])

    ban = Ban(kind=kind, id=target)
    g.db.add(ban)
    g.db.commit()

    return "OK"


@bp.route("/api/bans/remove", methods=["POST"])
@auth.login_required
@auth.admin_only
def remove_ban() -> ViewReturn:
    kind = request.args["kind"]
    if kind not in ["character", "corporation", "alliance"]:
        return "Invalid 'kind'", 400

    target = int(request.args["id"])

    ban = g.db.query(Ban).filter(Ban.kind == kind, Ban.id == target).one()
    g.db.remove(ban)

    return "OK"


@bp.route("/api/bans/list")
@auth.login_required
@auth.admin_only
def list_bans() -> ViewReturn:

    ban_list = g.db.query(Ban).all()
    character_ids = [ban.id for ban in ban_list if ban.kind == "character"]
    characters = {
        char.id: char.name
        for char in g.db.query(Character).filter(Character.id.in_(character_ids))
    }

    result: List[Dict[str, Any]] = []
    for ban in ban_list:
        ban_info = {
            "kind": ban.kind,
            "id": ban.id,
            "expires_at": ban.expires_at,
        }
        if ban.kind == "character":
            ban_info["name"] = characters.get(ban.id, None)

        result.append(ban_info)

    return {"bans": result}
