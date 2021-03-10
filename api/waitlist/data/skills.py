from typing import Dict, Tuple, List, Any, Set
import yaml
from .database import SkillCurrent, SkillHistory, Session
from . import esi, evedb


def load_skill_info() -> Tuple[
    Dict[str, Dict[int, Dict[str, int]]],
    List[int],
    Dict[str, int],
    Dict[str, List[int]],
]:
    with open("./waitlist/tdf/skills.yaml", "r") as fileh:
        yaml_raw: Dict[str, Any] = yaml.safe_load(fileh)
    categories_raw: Dict[str, List[str]] = yaml_raw["categories"]
    del yaml_raw["categories"]

    lookup: Dict[str, int] = {}
    categories: Dict[str, List[int]] = {}
    not_seen: Set[str] = set()
    for categoryname, skillnames in categories_raw.items():
        categories[categoryname] = []
        for skill_name in skillnames:
            skill_id = evedb.id_of(skill_name)
            categories[categoryname].append(skill_id)
            lookup[skill_name] = skill_id
            not_seen.add(skill_name)

    skills_raw: Dict[str, Dict[str, Dict[str, int]]] = yaml_raw
    skills: Dict[str, Dict[int, Dict[str, int]]] = {}
    for section, skillreq in skills_raw.items():
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


def load_character_skills(character_id: int) -> Dict[int, int]:
    skills_raw = esi.get(
        "/v4/characters/%d/skills/" % character_id, character_id
    ).json()

    session = Session()
    try:
        stored_skills = {}
        for skill in (
            session.query(SkillCurrent)
            .filter(SkillCurrent.character_id == character_id)
            .all()
        ):
            stored_skills[skill.skill_id] = skill

        levels = {}
        skills_add = []
        history_add = []
        for skill in skills_raw["skills"]:
            skill_id = skill["skill_id"]
            trained_skill_level = skill["trained_skill_level"]
            active_skill_level = skill["active_skill_level"]
            levels[skill_id] = active_skill_level

            # Store the *trained* skill level, but return the *active* skill level
            if skill_id in stored_skills:
                skill_obj = stored_skills[skill_id]
                if skill_obj.level != trained_skill_level:
                    history_add.append(
                        SkillHistory(
                            character_id=character_id,
                            skill_id=skill_id,
                            old_level=skill_obj.level,
                            new_level=trained_skill_level,
                        )
                    )
                    skill_obj.level = trained_skill_level

            else:
                skills_add.append(
                    SkillCurrent(
                        character_id=character_id,
                        skill_id=skill_id,
                        level=trained_skill_level,
                    )
                )
                if stored_skills:
                    history_add.append(
                        SkillHistory(
                            character_id=character_id,
                            skill_id=skill_id,
                            old_level=0,
                            new_level=trained_skill_level,
                        )
                    )
        if skills_add:
            session.add_all(skills_add)
        if history_add:
            session.add_all(history_add)
        session.commit()

        return levels

    finally:
        session.close()


REQUIREMENTS, RELEVANT_SKILLS, SKILL_IDS, CATEGORIES = load_skill_info()
