from flask import Blueprint, g
from . import auth
from .data import skills
from .data.database import Character, SkillHistory
from .webutil import ViewReturn

bp = Blueprint("skills", __name__)


@bp.route("/api/skills")
@auth.login_required
@auth.select_character(admin_ok=True)
def get_skills() -> ViewReturn:
    overview = {}

    character = g.db.query(Character).filter(Character.id == g.character_id).one()
    skill_lookup = skills.load_character_skills(g.character_id)

    for skill_id in skills.RELEVANT_SKILLS:
        overview[skill_id] = skill_lookup[skill_id] if skill_id in skill_lookup else 0

    return {
        "current": overview,
        "requirements": skills.MIN_SKILLS,
        "ids": skills.SKILL_IDS,
        "character_name": character.name,
    }


@bp.route("/api/history/skills")
@auth.login_required
@auth.select_character(admin_ok=True)
def get_skills_history() -> ViewReturn:
    relevant = set(skills.RELEVANT_SKILLS)

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
        "ids": skills.SKILL_IDS,
    }
