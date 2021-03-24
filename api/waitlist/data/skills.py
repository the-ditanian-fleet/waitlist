from typing import Dict
from .database import SkillCurrent, SkillHistory, Session
from . import esi


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
