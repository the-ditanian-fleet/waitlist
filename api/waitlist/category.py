from typing import Dict, Tuple, List, Optional, Any
from flask import Blueprint
from . import auth
from .webutil import ViewReturn
from .data import skills, evedb
from .data.evedb import id_of, name_of

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

LOGI_IDS = {id_of("Nestor"), id_of("Guardian"), id_of("Oneiros")}


def has_minimum_comps(skilldata: Dict[int, int]) -> bool:
    if skilldata.get(id_of("EM Armor Compensation"), 0) < 2:
        return False
    if skilldata.get(id_of("Explosive Armor Compensation"), 0) < 2:
        return False
    if skilldata.get(id_of("Thermal Armor Compensation"), 0) < 2:
        return False
    if skilldata.get(id_of("Kinetic Armor Compensation"), 0) < 2:
        return False
    return True


def _skillcheck_section(
    skilldata: Dict[int, int], requirements: List[Dict[str, Any]], group: str
) -> bool:
    for skillreq in requirements:
        skill_id = skills.SKILL_IDS[skillreq["name"]]
        if group in skillreq and skilldata.get(skill_id, 0) < skillreq[group]:
            return False
    return True


def skillcheck(ship: int, skilldata: Dict[int, int], group: str) -> bool:
    is_logi = ship in LOGI_IDS
    for groupname, requirements in skills.MIN_SKILLS["global"].items():
        if is_logi and groupname == "gunnery":
            # Logi don't have guns.
            continue

        if not _skillcheck_section(skilldata, requirements, group):
            return False

    if name_of(ship) in skills.MIN_SKILLS["ships"]:
        if not _skillcheck_section(
            skilldata, skills.MIN_SKILLS["ships"][name_of(ship)], group
        ):
            return False

    if is_logi:
        for groupname, requirements in skills.MIN_SKILLS["logi"].items():
            if not _skillcheck_section(skilldata, requirements, group):
                return False

    return True


def dna_to_sum(fit_dna: str) -> Dict[int, int]:
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
            continue  # Ignore modules in cargo
        module_id = int(module_id_s)
        modules_sum.setdefault(module_id, 0)
        modules_sum[module_id] += module_count
    return modules_sum


def check_valid(_fit_dna: str, skilldata: Dict[int, int]) -> Optional[str]:
    if not has_minimum_comps(skilldata):
        return "Missing minimum Armor Compensation skills"

    return None


def categorize(fit_dna: str, skilldata: Dict[int, int]) -> Tuple[str, List[str]]:
    ship = int(fit_dna.split(":")[0])

    modules_sum = dna_to_sum(fit_dna)
    detected_category = "meta4"  # Default
    for module_name, category in CATEGORIZATION:
        if CATEGORIZATION_LOOKUP[module_name] in modules_sum:
            detected_category = category
            break

    tags: List[str] = []
    if not skillcheck(ship, skilldata, "min"):
        detected_category = "meta4"
        tags.append("NO-MINSKILLS")
    elif skillcheck(ship, skilldata, "gold"):
        tags.append("GOLD-SKILLS")
    elif skillcheck(ship, skilldata, "elite"):
        tags.append("ELITE-SKILLS")

    return detected_category, tags
