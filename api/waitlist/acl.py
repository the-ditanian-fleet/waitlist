from typing import Dict, List, Any
from flask import Blueprint, request, g
import pydantic
from . import auth
from .webutil import ViewReturn
from .data.database import Administrator, Character

bp = Blueprint("acl", __name__)


class AddAclRequest(pydantic.BaseModel):
    level: str
    id: int


@bp.route("/api/acl/add", methods=["POST"])
@auth.login_required
@auth.require_permission("access-manage")
def add_acl() -> ViewReturn:
    req = AddAclRequest.parse_obj(request.json)
    leveldata = auth.ACCESS_LEVELS.get(req.level, None)
    if not leveldata:
        return "Invalid level", 400
    if "access-manage" in leveldata and not auth.has_access("access-manage-all"):
        return "Cannot grant %s" % req.level, 400

    char = g.db.query(Character).filter(Character.id == req.id).one_or_none()
    if not char:
        return "Character not found", 404

    admin = Administrator(character_id=char.id, level=req.level)
    g.db.add(admin)
    g.db.commit()

    return "OK"


class RemoveAclRequest(pydantic.BaseModel):
    id: int


@bp.route("/api/acl/remove", methods=["POST"])
@auth.login_required
@auth.require_permission("access-manage")
def remove_acl() -> ViewReturn:
    req = RemoveAclRequest.parse_obj(request.json)

    acl = g.db.query(Administrator).filter(Administrator.character_id == req.id).one()
    leveldata = auth.ACCESS_LEVELS[acl.level]
    if "access-manage" in leveldata and not auth.has_access("access-manage-all"):
        return "Cannot revoke %s" % acl.level, 400

    g.db.delete(acl)
    g.db.commit()

    return "OK"


@bp.route("/api/acl/list")
@auth.login_required
@auth.require_permission("access-manage")
def list_acl() -> ViewReturn:
    result: List[Dict[str, Any]] = []
    for admin, character in g.db.query(Administrator, Character).join(
        Administrator.character
    ):
        result.append(
            {
                "id": character.id,
                "name": character.name,
                "level": admin.level,
            }
        )

    return {"acl": result}
