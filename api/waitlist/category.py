from flask import Blueprint
from . import auth
from .webutil import ViewReturn
from .tdf import CATEGORIES_SORTED

bp = Blueprint("category", __name__)


@bp.route("/api/categories")
@auth.login_required
def categories() -> ViewReturn:
    return {"categories": CATEGORIES_SORTED}
