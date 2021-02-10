from typing import Dict
from datetime import datetime
from ..database import SkillCurrent, SkillHistory, Session
from .. import esi


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
            skill_level = skill["trained_skill_level"]
            levels[skill_id] = skill_level

            if skill_id in stored_skills:
                skill_obj = stored_skills[skill_id]
                if skill_obj.level != skill_level:
                    session.add(
                        SkillHistory(
                            character_id=character_id,
                            skill_id=skill_id,
                            old_level=skill_obj.level,
                            new_level=skill_level,
                            logged_at=datetime.now(),
                        )
                    )
                    skill_obj.level = skill_level

            else:
                session.add(
                    SkillCurrent(
                        character_id=character_id,
                        skill_id=skill_id,
                        level=skill_level,
                    )
                )
                if stored_skills:
                    session.add(
                        SkillHistory(
                            character_id=character_id,
                            skill_id=skill_id,
                            old_level=0,
                            new_level=skill_level,
                            logged_at=datetime.now(),
                        )
                    )
        session.commit()

        return levels

    finally:
        session.close()
