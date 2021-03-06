from flask import Blueprint, request, g
from . import auth
from .data.database import Character
from .webutil import ViewReturn

bp = Blueprint("search", __name__)


@bp.route("/api/search")
@auth.login_required
@auth.admin_only
def search() -> ViewReturn:
    search_like = "%{}%".format(request.args["query"])

    results = []
    for character in (
        g.db.query(Character)
        .filter(Character.name.like(search_like))
        .order_by(Character.name.asc())
    ):
        results.append(
            {
                "id": character.id,
                "name": character.name,
            }
        )

    return {
        "query": request.args["query"],
        "results": results,
    }
