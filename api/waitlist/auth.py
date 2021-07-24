from functools import wraps
from typing import Callable, TypeVar, Any, Tuple, cast, Optional, Dict, Set
from flask import Blueprint, request, g, make_response
import requests
import pydantic
from branca import Branca
import msgpack
from .data import esi, database, config
from .webutil import ViewReturn

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
    + "&redirect_uri={redir_uri}&client_id={client_id}&scope={scopes}&state={state}"
)

ACCESS_LEVELS: Dict[str, Set[str]] = {}
ACCESS_LEVELS["user"] = set()
ACCESS_LEVELS["trainee"] = ACCESS_LEVELS["user"] | set(
    [
        "fleet-configure",
        "fleet-invite",
        "fleet-view",
        "pilot-view",
        "waitlist-view",
    ]
)
ACCESS_LEVELS["trainee-advanced"] = ACCESS_LEVELS["trainee"] | set(
    [
        "fit-view",
        "skill-view",
        "waitlist-manage",
    ]
)
ACCESS_LEVELS["fc"] = ACCESS_LEVELS["trainee-advanced"] | set(
    [
        "fleet-activity-view",
        "fleet-comp-history",
        "fit-history-view",
        "search",
        "skill-history-view",
        "waitlist-edit",
        "stats-view",
    ]
)
ACCESS_LEVELS["council"] = ACCESS_LEVELS["fc"] | set(
    [
        "bans-view",
        "bans-manage",
        "access-manage",
    ]
)
ACCESS_LEVELS["admin"] = ACCESS_LEVELS["council"] | set(
    [
        "access-manage-all",
    ]
)

DecoratorType = TypeVar("DecoratorType", bound=Callable[..., Any])


def has_access(permission: str) -> bool:
    return permission in ACCESS_LEVELS[g.access_level]


def account_id_from_cookie() -> Optional[int]:
    # Never logged in
    if "authToken" not in request.cookies:
        return None

    auth_token = request.cookies.get("authToken")
    branca = Branca(bytes.fromhex(config.CONFIG["app"]["token_secret"]))
    try:
        decoded_token = branca.decode(auth_token, ttl=31 * 86400)
    except:  # Nothing useful to catch :-(  pylint: disable=bare-except
        return None

    decoded = msgpack.unpackb(decoded_token)
    if decoded["version"] != 1:
        return None
    if not decoded["account_id"]:
        return None

    return int(decoded["account_id"])


def login_required(func: DecoratorType) -> DecoratorType:
    @wraps(func)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        account_id = account_id_from_cookie()
        if not account_id:
            return "Not logged in", 401

        g.account_id = account_id  # false positive pylint: disable=assigning-non-slot

        with g.db.begin():
            admin_record = (
                g.db.query(database.Administrator)
                .filter(database.Administrator.character_id == g.account_id)
                .one_or_none()
            )
            if admin_record:
                g.access_level = (  # false positive pylint: disable=assigning-non-slot
                    admin_record.level
                )
            else:
                g.access_level = (  # false positive pylint: disable=assigning-non-slot
                    "user"
                )

        return func(*args, **kwargs)

    return cast(DecoratorType, decorated)


def require_permission(permission: str) -> Callable[[DecoratorType], DecoratorType]:
    def decorator(func: DecoratorType) -> DecoratorType:
        @wraps(func)
        def decorated(*args: Any, **kwargs: Any) -> Any:
            if not has_access(permission):
                return "Unauthorized", 401
            return func(*args, **kwargs)

        return cast(DecoratorType, decorated)

    return decorator


class CharacterIdRequest(pydantic.BaseModel):
    character_id: Optional[int]


def select_character(
    override_permission: Optional[str] = None,
) -> Callable[[DecoratorType], DecoratorType]:
    def decorator(func: DecoratorType) -> DecoratorType:
        @wraps(func)
        def decorated(*args: Any, **kwargs: Any) -> Any:
            if request.json:
                req = CharacterIdRequest.parse_obj(request.json)
                if not req.character_id:
                    return "Missing character_id in request", 400
                character_id = req.character_id
            else:
                if not "character_id" in request.args:
                    return "Missing character_id in request", 400
                character_id = int(request.args["character_id"])

            if character_id != g.account_id and not (
                override_permission and has_access(override_permission)
            ):
                with g.db.begin():
                    if (
                        not g.db.query(database.AltCharacter)
                        .filter(
                            database.AltCharacter.account_id == g.account_id,
                            database.AltCharacter.alt_id == character_id,
                        )
                        .one_or_none()
                    ):
                        return "Not allowed to query this character_id", 401

            g.character_id = (  # false positive pylint: disable=assigning-non-slot
                character_id
            )
            return func(*args, **kwargs)

        return cast(DecoratorType, decorated)

    return decorator


@bp.route("/api/auth/login_url")
def login_url() -> str:
    scopes = []
    scopes += LOGIN_SCOPES
    state = ""

    if "fc" in request.args:
        scopes += FC_SCOPES
    if "alt" in request.args:
        state = "alt"

    return LOGIN_URL_FMT.format(
        redir_uri=REDIR_URI, client_id=esi.AUTH_ID, scopes=" ".join(scopes), state=state
    )


class AuthCallbackRequest(pydantic.BaseModel):
    state: Optional[str]
    code: str


@bp.route("/api/auth/cb", methods=["POST"])
def callback() -> ViewReturn:
    req = AuthCallbackRequest.parse_obj(request.json)
    _access_token, _refresh_token, character_id = esi.process_auth(
        "authorization_code", req.code, g.db
    )

    if req.state == "alt":
        account_id = account_id_from_cookie()
        if not account_id:
            return "Not logged in", 401

        if account_id != character_id:
            with g.db.begin():
                alt = database.AltCharacter(account_id=account_id, alt_id=character_id)
                g.db.merge(alt)

    else:
        account_id = character_id

    resp = make_response()

    branca = Branca(bytes.fromhex(config.CONFIG["app"]["token_secret"]))
    encoded_token = branca.encode(
        msgpack.packb(
            {
                "version": 1,
                "account_id": account_id,
            }
        )
    )

    resp.set_cookie(
        "authToken",
        encoded_token,
        max_age=31 * 86400,
        httponly=True,
        samesite="Strict",
        secure=config.CONFIG["esi"]["url"].startswith("https:"),
    )

    return resp


@bp.route("/api/auth/whoami")
@login_required
def whoami() -> Tuple[Any, int]:
    char = (
        g.db.query(database.Character)
        .filter(database.Character.id == g.account_id)
        .one_or_none()
    )
    if not char:
        return "Character data missing from db", 401

    characters = [
        {
            "id": char.id,
            "name": char.name,
        }
    ]
    for _alt_record, alt_character in (
        g.db.query(database.AltCharacter, database.Character)
        .join(database.AltCharacter.alt)
        .filter(database.AltCharacter.account_id == char.id)
    ):
        characters.append({"id": alt_character.id, "name": alt_character.name})

    return {
        "account_id": g.account_id,
        "access": sorted(ACCESS_LEVELS[g.access_level]),
        "characters": characters,
    }, 200


@bp.route("/api/auth/logout")
@login_required
def logout() -> ViewReturn:
    resp = make_response()
    resp.set_cookie("authToken", "", max_age=1, httponly=True, samesite="Strict")

    with g.db.begin():
        g.db.query(database.AltCharacter).filter(
            database.AltCharacter.account_id == g.account_id
        ).delete()
        g.db.query(database.AltCharacter).filter(
            database.AltCharacter.alt_id == g.account_id
        ).delete()

    return resp
