import datetime
from typing import Dict, List, Any, Optional
from flask import Blueprint, request, g
import pydantic
from . import auth
from .webutil import ViewReturn
from .data.database import Ban, Character

bp = Blueprint("bans", __name__)


class AddBanRequest(pydantic.BaseModel):
    kind: str
    id: int
    duration: Optional[int]


@bp.route("/api/bans/add", methods=["POST"])
@auth.login_required
@auth.require_permission("bans-manage")
def add_ban() -> ViewReturn:
    req = AddBanRequest.parse_obj(request.json)
    if req.kind not in ["character", "corporation", "alliance"]:
        return "Invalid 'kind'", 400

    with g.db.begin():
        ban = Ban(kind=req.kind, id=req.id)
        if req.duration:
            ban.expires_at = datetime.datetime.utcnow() + datetime.timedelta(
                minutes=req.duration
            )

        g.db.merge(ban)

    return "OK"


class RemoveBanRequest(pydantic.BaseModel):
    kind: str
    id: int


@bp.route("/api/bans/remove", methods=["POST"])
@auth.login_required
@auth.require_permission("bans-manage")
def remove_ban() -> ViewReturn:
    req = RemoveBanRequest.parse_obj(request.json)

    with g.db.begin():
        ban = g.db.query(Ban).filter(Ban.kind == req.kind, Ban.id == req.id).one()
        g.db.delete(ban)

    return "OK"


@bp.route("/api/bans/list")
@auth.login_required
@auth.require_permission("bans-view")
def list_bans() -> ViewReturn:
    # Prune before we show anything
    with g.db.begin():
        g.db.query(Ban).filter(Ban.expires_at < datetime.datetime.utcnow()).delete()

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
