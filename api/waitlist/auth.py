from functools import wraps
from typing import Callable, TypeVar, Any, Tuple, cast
from flask import Blueprint, request, session, g
import requests
from .data import esi, database, config

bp = Blueprint("auth", __name__)
req_session = requests.Session()

REDIR_URI = config.CONFIG["esi"]["url"]
LOGIN_SCOPES = [
    "publicData",
    "esi-skills.read_skills.v1",
    "esi-clones.read_implants.v1",
]
FC_SCOPES = [
    "esi-fleets.read_fleet.v1",
    "esi-fleets.write_fleet.v1",
    "esi-ui.open_window.v1",
]

LOGIN_URL_FMT = (
    "https://login.eveonline.com/oauth/authorize?response_type=code"
    + "&redirect_uri={redir_uri}&client_id={client_id}&scope={scopes}"
)

DecoratorType = TypeVar("DecoratorType", bound=Callable[..., Any])


def login_required(func: DecoratorType) -> DecoratorType:
    @wraps(func)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        # Never logged in
        if "account_id" not in session:
            return "Not logged in", 401

        g.account_id = session["account_id"]

        if (
            g.db.query(database.Administrator)
            .filter(database.Administrator.character_id == g.account_id)
            .one_or_none()
        ):
            g.is_admin = True
        else:
            g.is_admin = False

        return func(*args, **kwargs)

    return cast(DecoratorType, decorated)


def admin_only(func: DecoratorType) -> DecoratorType:
    @wraps(func)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        if not g.is_admin:
            return "Unauthorized", 401
        return func(*args, **kwargs)

    return cast(DecoratorType, decorated)


def select_character(
    admin_ok: bool = False,
) -> Callable[[DecoratorType], DecoratorType]:
    def decorator(func: DecoratorType) -> DecoratorType:
        @wraps(func)
        def decorated(*args: Any, **kwargs: Any) -> Any:
            if request.json:
                if not "character_id" in request.json:
                    return "Missing character_id in request", 400
                character_id = int(request.json["character_id"])
            else:
                if not "character_id" in request.args:
                    return "Missing character_id in request", 400
                character_id = int(request.args["character_id"])

            if character_id != g.account_id and not admin_ok:
                if (
                    not g.db.query(database.AltCharacter)
                    .filter(
                        database.AltCharacter.account_id == g.account_id,
                        database.AltCharacter.alt_id == character_id,
                    )
                    .one_or_none()
                ):
                    return "Not allowed to query this character_id", 401

            g.character_id = character_id
            return func(*args, **kwargs)

        return cast(DecoratorType, decorated)

    return decorator


@bp.route("/api/auth/login_url")
def login_url() -> str:
    scopes = []
    scopes += LOGIN_SCOPES
    if "fc" in request.args:
        scopes += FC_SCOPES

    return LOGIN_URL_FMT.format(
        redir_uri=REDIR_URI, client_id=esi.AUTH_ID, scopes=" ".join(scopes)
    )


@bp.route("/api/auth/cb", methods=["POST"])
def callback() -> Tuple[str, int]:
    if request.data is None or request.data == b"":
        return "Bad request", 400

    _access_token, _refresh_token, character_id = esi.process_auth(
        "authorization_code", request.data.decode("ascii")
    )
    session["account_id"] = character_id
    return "OK", 200


@bp.route("/api/auth/whoami")
@login_required
def whoami() -> Tuple[Any, int]:
    char = (
        g.db.query(database.Character)
        .filter(database.Character.id == session["account_id"])
        .one_or_none()
    )
    if not char:
        return "Character data missing from db", 401

    return {
        "id": char.id,
        "name": char.name,
        "is_admin": g.is_admin,
    }, 200


@bp.route("/api/auth/logout")
def logout() -> str:
    session.clear()
    return "OK"
