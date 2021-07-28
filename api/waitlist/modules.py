from typing import List
from flask import Blueprint, request
from . import auth
from .webutil import ViewReturn
from .data import evedb
from .tdf import FITS

bp = Blueprint("modules", __name__)


def _module_info(type_ids: List[int]) -> ViewReturn:
    # attribute_info = evedb.type_attributes(type_ids)
    effect_info = evedb.type_effects(type_ids)
    category_info = evedb.type_categories(type_ids)
    names = evedb.type_names(type_ids)

    result = {}
    for type_id in type_ids:
        if type_id not in names:
            continue
        # attributes = attribute_info.get(type_id, {})
        effects = effect_info.get(type_id, {})
        category = category_info.get(type_id, evedb.Category.OTHER)

        type_info = {
            "name": names[type_id],
            "category": category.name,
        }

        if evedb.Effect.LOW_POWER in effects:
            type_info["slot"] = "low"
        elif evedb.Effect.MED_POWER in effects:
            type_info["slot"] = "med"
        elif evedb.Effect.HIGH_POWER in effects:
            type_info["slot"] = "high"
        elif evedb.Effect.RIG_SLOT in effects:
            type_info["slot"] = "rig"
        elif category == evedb.Category.DRONE:
            type_info["slot"] = "drone"

        result[type_id] = type_info

    return result


@bp.route("/api/module/info")
@auth.login_required
def module_info() -> ViewReturn:
    type_ids = [int(type_id) for type_id in request.args["ids"].split(",")]
    if len(type_ids) > 200:
        return "Too many IDs", 400

    return _module_info(type_ids)


def _get_preload_ids() -> List[int]:
    ids = set(
        [
            evedb.id_of("Capsule"),
        ]
    )

    for hull_id, fits in FITS.items():
        ids.add(hull_id)
        for fit in fits:
            for item_id, _count in {**fit.cargo, **fit.modules}.items():
                ids.add(item_id)

    return list(ids)


PRELOAD_INFO = _module_info(_get_preload_ids())


@bp.route("/api/module/preload")
@auth.login_required
def module_preload() -> ViewReturn:
    return PRELOAD_INFO
