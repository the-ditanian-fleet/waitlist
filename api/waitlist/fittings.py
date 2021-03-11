from typing import List, Dict, Any
from flask import Blueprint

from .tdf import FITS
from .webutil import ViewReturn
from . import auth
from .data.evedb import name_of

bp = Blueprint("fittings", __name__)


@bp.route("/api/fittings")
@auth.login_required
def list_fittings() -> ViewReturn:
    result = []
    for ship_id, fits in FITS.items():
        fitresult: List[Dict[str, Any]] = []

        for fit in fits:
            fitresult.append(
                {
                    "dna": fit.dna,
                    "name": fit.fitname,
                }
            )

        result.append(
            {
                "hull": {
                    "id": ship_id,
                    "name": name_of(ship_id),
                },
                "fits": fitresult,
            }
        )

    return {"fittings": result}
