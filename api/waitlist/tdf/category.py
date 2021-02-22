from typing import Dict, Tuple, List, Optional, Any
from ..data import skills, evedb
from ..data.evedb import id_of, name_of

CATEGORIES = {
    "logi": "Logistics",
    "cqc": "CQC",
    "sniper": "Sniper",
    "leshak": "Leshak",
    "starter": "Starter",
}


CATEGORIZATION = [
    # Logi
    ("Oneiros", "logi"),
    ("Guardian", "logi"),
    ("Nestor", "logi"),
    # Starter tank
    ("Multispectrum Energized Membrane II", "starter"),
    ("Centum C-Type Explosive Energized Membrane", "starter"),
    ("Corpum C-Type Explosive Energized Membrane", "starter"),
    # Fleet annoyances
    ("500MN Quad LiF Restrained Microwarpdrive", "starter"),
    # Starter damage mods
    ("Magnetic Field Stabilizer II", "starter"),
    ("Stasis Webifier II", "starter"),
    ("Modal Mega Neutron Particle Accelerator I", "starter"),
    ("Tachyon Modulated Energy Beam I", "starter"),
    ("Drone Link Augmentor I", "starter"),
    ("Heat Sink II", "starter"),
    ("Mega Modulated Pulse Energy Beam I", "starter"),
    # Ships
    ("Megathron", "starter"),
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
    elif group != "min":
        # When checking for anything but minimum skills, we should have the ship defined before
        # we consider a pilot to actually have them. This stops us from calling unknown ships
        # elite just because we have no requirements listed.
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


def implant_tags(  # pylint: disable=too-many-branches
    ship: int, implants: List[int]
) -> List[str]:
    tags = []
    have_slots = {7: False, 8: False, 9: False, 10: False}

    # Base set, slot 1-6
    base_set = None
    if (
        id_of("High-grade Amulet Alpha") in implants
        and id_of("High-grade Amulet Beta") in implants
        and id_of("High-grade Amulet Gamma") in implants
        and id_of("High-grade Amulet Delta") in implants
        and id_of("High-grade Amulet Epsilon") in implants
    ):
        if id_of("% WS-618", fuzzy=True) in implants:
            base_set = "HYBRID"
        elif id_of("High-grade Amulet Omega") in implants:
            base_set = "AMULET"

    if (
        id_of("High-grade Ascendancy Alpha") in implants
        and id_of("High-grade Ascendancy Beta") in implants
        and id_of("High-grade Ascendancy Gamma") in implants
        and id_of("High-grade Ascendancy Delta") in implants
        and id_of("High-grade Ascendancy Epsilon") in implants
    ):
        if id_of("% WS-618", fuzzy=True) in implants:
            base_set = "WARPSPEED"
        elif id_of("High-grade Ascendancy Omega") in implants:
            base_set = "WARPSPEED"

    # Slot 7
    for implant in ["Ogdin's Eye %", "% MR-706"]:
        if id_of(implant, fuzzy=True) in implants:
            have_slots[7] = True

    # Slot 8
    if id_of("% EM-806", fuzzy=True) in implants:
        have_slots[8] = True
    if id_of("% MR-807", fuzzy=True) in implants and ship == id_of("Vindicator"):
        have_slots[8] = True

    # Slot 9
    for implant in ["% RF-906", "% SS-906", "Pashan's Turret Customization Mindlink"]:
        if id_of(implant, fuzzy=True) in implants:
            have_slots[9] = True

    # Slot 10
    if ship in [id_of("Nightmare"), id_of("Paladin")]:
        if id_of("% LE-1006", fuzzy=True) in implants:
            have_slots[10] = True
        if id_of("Pashan's Turret Handling Mindlink") in implants:
            have_slots[10] = True
    elif ship == id_of("Vindicator") and id_of("% LH-1006", fuzzy=True) in implants:
        have_slots[10] = True
    elif ship == id_of("Leshak"):
        if id_of("% HG-1006", fuzzy=True) in implants:
            have_slots[10] = True
        if id_of("% HG-1008", fuzzy=True) in implants:
            have_slots[10] = True

    if base_set and all(have_slots.values()):
        tags.append("%s1-10" % base_set)
    elif base_set:
        tags.append("%s1-6" % base_set)

    return tags


def categorize(
    fit_dna: str, skilldata: Dict[int, int], implants: List[int]
) -> Tuple[str, List[str]]:
    ship = int(fit_dna.split(":")[0])

    modules_sum = dna_to_sum(fit_dna)
    detected_category = "starter"  # Default
    for module_name, category in CATEGORIZATION:
        if CATEGORIZATION_LOOKUP[module_name] in modules_sum:
            detected_category = category
            break

    tags: List[str] = []
    if not skillcheck(ship, skilldata, "min"):
        tags.append("NO-MINSKILLS")
        if detected_category != "logi":
            detected_category = "starter"
    elif skillcheck(ship, skilldata, "gold"):
        tags.append("GOLD-SKILLS")
    elif skillcheck(ship, skilldata, "elite"):
        tags.append("ELITE-SKILLS")

    tags.extend(implant_tags(ship, implants))

    return detected_category, tags
