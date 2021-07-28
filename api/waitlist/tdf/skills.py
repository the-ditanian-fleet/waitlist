from typing import Dict, Set, List, Tuple, Any
import yaml
from ..data.evedb import id_of, name_of

LOGI_IDS = {id_of("Nestor"), id_of("Guardian"), id_of("Oneiros")}


def load_skill_info() -> Tuple[
    Dict[str, Dict[int, Dict[str, int]]],
    List[int],
    Dict[str, int],
    Dict[str, List[int]],
]:
    with open("./waitlist/tdf/skills.yaml", "r") as fileh:
        yaml_raw: Dict[str, Any] = yaml.safe_load(fileh)
    categories_raw: Dict[str, List[str]] = yaml_raw["categories"]
    requirements_raw: Dict[str, Dict[str, Dict[str, int]]] = yaml_raw["requirements"]

    lookup: Dict[str, int] = {}
    categories: Dict[str, List[int]] = {}
    not_seen: Set[str] = set()
    for categoryname, skillnames in categories_raw.items():
        categories[categoryname] = []
        for skill_name in skillnames:
            skill_id = id_of(skill_name)
            categories[categoryname].append(skill_id)
            lookup[skill_name] = skill_id
            not_seen.add(skill_name)

    skills: Dict[str, Dict[int, Dict[str, int]]] = {}
    for section, skillreq in requirements_raw.items():
        if section.startswith("_"):
            # Definitions, ignore
            continue

        skills[section] = {}
        for skill_name, tiers in skillreq.items():
            skill_id = lookup[skill_name]
            skills[section][skill_id] = tiers
            if "min" in tiers and not "elite" in tiers:
                tiers["elite"] = tiers["min"]
            if "elite" in tiers and not "gold" in tiers:
                tiers["gold"] = tiers["elite"]
            if skill_name in not_seen:
                not_seen.remove(skill_name)

    if not_seen:
        raise Exception(
            "Skill in category but not required: %s" % ",".join(list(not_seen))
        )

    return skills, list(sorted(lookup.values())), lookup, categories


REQUIREMENTS, RELEVANT_SKILLS, SKILL_IDS, CATEGORIES = load_skill_info()


def get_armor_comps_level(skilldata: Dict[int, int]) -> int:
    return min(
        [
            skilldata.get(id_of("EM Armor Compensation"), 0),
            skilldata.get(id_of("Explosive Armor Compensation"), 0),
            skilldata.get(id_of("Thermal Armor Compensation"), 0),
            skilldata.get(id_of("Kinetic Armor Compensation"), 0),
        ]
    )


def skillcheck(ship: int, skilldata: Dict[int, int], group: str) -> bool:
    ship_name = name_of(ship)

    if not ship_name in REQUIREMENTS:
        # We don't know the ship. Can't have the skills for it.
        return False

    for skill_id, tiers in REQUIREMENTS[ship_name].items():
        if not group in tiers:
            continue
        if skilldata.get(skill_id, 0) < tiers[group]:
            return False

    return True
