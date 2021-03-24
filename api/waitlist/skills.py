from flask import Blueprint, g
from . import auth
from .data import skills
from .data.database import Character, SkillHistory
from .webutil import ViewReturn
from .tdf import skills as tdf_skills

bp = Blueprint("skills", __name__)


@bp.route("/api/skills")
@auth.login_required
@auth.select_character(override_permission="skill-view")
def get_skills() -> ViewReturn:
    overview = {}

    character = g.db.query(Character).filter(Character.id == g.character_id).one()
    skill_lookup = skills.load_character_skills(g.character_id)

    for skill_id in tdf_skills.RELEVANT_SKILLS:
        overview[skill_id] = skill_lookup[skill_id] if skill_id in skill_lookup else 0

    return {
        "current": overview,
        "categories": tdf_skills.CATEGORIES,
        "requirements": tdf_skills.REQUIREMENTS,
        "ids": tdf_skills.SKILL_IDS,
        "character_name": character.name,
    }


@bp.route("/api/history/skills")
@auth.login_required
@auth.select_character(override_permission="skill-history-view")
def get_skills_history() -> ViewReturn:
    relevant = set(tdf_skills.RELEVANT_SKILLS)

    history = []

    for history_entry in (
        g.db.query(SkillHistory)
        .filter(SkillHistory.character_id == g.character_id)
        .order_by(SkillHistory.id.desc())
    ):
        if not history_entry.skill_id in relevant:
            continue

        history.append(
            {
                "skill_id": history_entry.skill_id,
                "old_level": history_entry.old_level,
                "new_level": history_entry.new_level,
                "logged_at": history_entry.logged_at,
            }
        )

    return {
        "history": history,
        "ids": tdf_skills.SKILL_IDS,
    }
