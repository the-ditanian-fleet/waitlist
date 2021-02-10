from typing import Dict, Tuple
from flask import Blueprint
from . import auth, evedb
from .webutil import ViewReturn

bp = Blueprint("category", __name__)

CATEGORIES = {
    "logi": "Logistics",
    "leshak": "Leshak",
    "cqc": "CQC",
    "sniper": "Sniper",
    "meta4": "Meta 4",
}


@bp.route("/api/categories")
@auth.login_required
def categories() -> ViewReturn:
    return CATEGORIES


CATEGORIZATION = [
    # Logi
    ("Oneiros", "logi"),
    ("Guardian", "logi"),
    ("Nestor", "logi"),
    # Meta4 tank
    ("Multispectrum Energized Membrane II", "meta4"),
    ("Centum C-Type Explosive Energized Membrane", "meta4"),
    ("Corpum C-Type Explosive Energized Membrane", "meta4"),
    # Fleet annoyances
    ("500MN Quad LiF Restrained Microwarpdrive", "meta4"),
    # Meta4 damage mods
    ("Magnetic Field Stabilizer II", "meta4"),
    ("Stasis Webifier II", "meta4"),
    ("Modal Mega Neutron Particle Accelerator I", "meta4"),
    ("Tachyon Modulated Energy Beam I", "meta4"),
    ("Drone Link Augmentor I", "meta4"),
    ("Heat Sink II", "meta4"),
    ("Mega Modulated Pulse Energy Beam I", "meta4"),
    # Ships
    ("Megathron", "meta4"),
    ("Vindicator", "cqc"),
    ("Paladin", "sniper"),
    ("Nightmare", "sniper"),
    ("Leshak", "leshak"),
]
CATEGORIZATION_LOOKUP = evedb.type_ids(list(item[0] for item in CATEGORIZATION))


def categorize(fit_dna: str) -> Tuple[str, str]:
    modules_sum: Dict[int, int] = {}
    for dna_piece in fit_dna.split(":"):
        if not dna_piece:
            continue
        if ";" in dna_piece:
            module_id_s, module_count_s = dna_piece.split(";", 1)
            module_count = int(module_count_s)
        else:
            module_id_s = dna_piece
            module_count = 1
        if module_id_s.endswith("_"):
            module_id_s = module_id_s[:-1]
        module_id = int(module_id_s)
        modules_sum.setdefault(module_id, 0)
        modules_sum[module_id] += module_count

    for module_name, category in CATEGORIZATION:
        if CATEGORIZATION_LOOKUP[module_name] in modules_sum:
            return category, ""

    return "meta4", ""  # Default
