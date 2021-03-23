from flask import Blueprint, g
from . import auth
from .webutil import ViewReturn
from .data.database import FitHistory, Fitting, ImplantSet
from .data.evedb import name_of

bp = Blueprint("xup_history", __name__)


@bp.route("/api/history/xup")
@auth.login_required
@auth.select_character(override_permission="fit-history-view")
def get_xup_history() -> ViewReturn:
    xups = []
    for history_line, fitting, implant_set in (
        g.db.query(FitHistory, Fitting, ImplantSet)
        .join(FitHistory.fit)
        .join(FitHistory.implant_set)
        .filter(FitHistory.character_id == g.character_id)
        .order_by(FitHistory.id.desc())
    ):
        xups.append(
            {
                "logged_at": history_line.logged_at,
                "dna": fitting.dna,
                "implants": list(
                    map(int, filter(lambda x: x, implant_set.implants.split(":")))
                ),
                "hull": {
                    "id": fitting.hull,
                    "name": name_of(fitting.hull),
                },
            }
        )

    return {
        "xups": xups,
    }
