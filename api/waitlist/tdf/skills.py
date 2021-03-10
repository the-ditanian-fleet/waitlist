from typing import Dict
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


def skillcheck(ship: int, skilldata: Dict[int, int], group: str) -> bool:
    ship_name = name_of(ship)

    if not ship_name in skills.REQUIREMENTS:
        # We don't know the ship. Can't have the skills for it.
        return False

    for skill_id, tiers in skills.REQUIREMENTS[ship_name].items():
        if not group in tiers:
            continue
        if skilldata.get(skill_id, 0) < tiers[group]:
            return False

    return True
