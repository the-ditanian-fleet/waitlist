from flask import Blueprint, g
from . import auth
from .data.database import Character
from .webutil import ViewReturn

bp = Blueprint("pilot", __name__)


@bp.route("/api/pilot/info")
@auth.login_required
@auth.select_character(override_permission="pilot-view")
def pilot_info() -> ViewReturn:
    char = g.db.query(Character).filter(Character.id == g.character_id).one()

    return {
        "id": char.id,
        "name": char.name,
    }
