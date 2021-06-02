from flask import Blueprint, g, request
import pydantic
from .webutil import ViewReturn
from . import auth
from .data import esi

bp = Blueprint("window", __name__)


class OpenWindowRequest(pydantic.BaseModel):
    target_id: int


@bp.route("/api/open_window", methods=["POST"])
@auth.login_required
@auth.select_character()
def open_window() -> ViewReturn:
    req = OpenWindowRequest.parse_obj(request.json)
    target_id = req.target_id

    esi.post("/v1/ui/openwindow/information/?target_id=%d" % target_id, g.character_id)
    return "OK"
