from typing import Dict, Tuple, List, Any
from datetime import datetime
import yaml
from ..database import SkillCurrent, SkillHistory, Session
from .. import esi, evedb


def load_skill_info() -> Tuple[Dict[str, Any], List[int], Dict[str, int]]:
    with open("./skills.yaml", "r") as fileh:
        skills_raw: Dict[str, Any] = yaml.safe_load(fileh)
    all_names = set()
    for _section, groups in skills_raw.items():
        for _group, skills in groups.items():
            for skill in skills:
                all_names.add(skill["name"])
    all_ids = evedb.type_ids(list(all_names))
    for name in all_names:
        if name not in all_ids:
            raise Exception("Missing skill info for " + name)
    return skills_raw, list(all_ids.values()), all_ids


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
        for skill in skills_raw["skills"]:
            skill_id = skill["skill_id"]
            trained_skill_level = skill["trained_skill_level"]
            active_skill_level = skill["active_skill_level"]
            levels[skill_id] = active_skill_level

            # Store the *trained* skill level, but return the *active* skill level
            if skill_id in stored_skills:
                skill_obj = stored_skills[skill_id]
                if skill_obj.level != trained_skill_level:
                    session.add(
                        SkillHistory(
                            character_id=character_id,
                            skill_id=skill_id,
                            old_level=skill_obj.level,
                            new_level=trained_skill_level,
                            logged_at=datetime.now(),
                        )
                    )
                    skill_obj.level = trained_skill_level

            else:
                session.add(
                    SkillCurrent(
                        character_id=character_id,
                        skill_id=skill_id,
                        level=trained_skill_level,
                    )
                )
                if stored_skills:
                    session.add(
                        SkillHistory(
                            character_id=character_id,
                            skill_id=skill_id,
                            old_level=0,
                            new_level=trained_skill_level,
                            logged_at=datetime.now(),
                        )
                    )
        session.commit()

        return levels

    finally:
        session.close()


MIN_SKILLS, RELEVANT_SKILLS, SKILL_IDS = load_skill_info()
