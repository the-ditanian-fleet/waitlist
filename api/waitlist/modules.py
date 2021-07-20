from flask import Blueprint, request
from . import auth
from .webutil import ViewReturn
from .data import evedb

bp = Blueprint("modules", __name__)


@bp.route("/api/module/info")
@auth.login_required
def module_info() -> ViewReturn:
    type_ids = [int(type_id) for type_id in request.args.getlist("id")]
    if len(type_ids) > 200:
        return "Too many IDs", 400

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
