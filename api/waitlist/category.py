from flask import Blueprint
from . import auth
from .webutil import ViewReturn
from .tdf import CATEGORIES

bp = Blueprint("category", __name__)


@bp.route("/api/categories")
@auth.login_required
def categories() -> ViewReturn:
    return CATEGORIES
