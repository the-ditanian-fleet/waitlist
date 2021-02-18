from typing import Dict, List, Any
from ..data import skills
from ..data.evedb import id_of, name_of

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
