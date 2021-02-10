from typing import Any, Dict, List, Tuple
from flask import Blueprint, g
import yaml
from . import auth, esi, evedb
from .database import Character
from .data import skills as _skills
from .webutil import ViewReturn


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


MIN_SKILLS, RELEVANT_SKILLS, SKILL_IDS = load_skill_info()

bp = Blueprint("skills", __name__)


@bp.route("/api/skills")
@auth.login_required
@auth.select_character(admin_ok=True)
def get_skills() -> ViewReturn:
    overview = {}

    character = g.db.query(Character).filter(Character.id == g.character_id).one()
    skill_lookup = _skills.load_character_skills(g.character_id)

    for skill_id in RELEVANT_SKILLS:
        overview[skill_id] = skill_lookup[skill_id] if skill_id in skill_lookup else 0

    return {
        "current": overview,
        "requirements": MIN_SKILLS,
        "ids": SKILL_IDS,
        "character_name": character.name,
    }


@bp.route("/api/implants")
@auth.login_required
def implants() -> ViewReturn:
    return dict(
        implants=esi.get(
            "/v2/characters/%d/implants/" % g.character_id, g.character_id
        ).json()
    )
