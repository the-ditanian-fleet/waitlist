import time
from typing import Dict, Optional, Any, Tuple, Type
import requests
from .database import Session, RefreshToken, AccessToken, Character
from .config import CONFIG

AUTH_ID = CONFIG["esi"]["client_id"]
AUTH_SECRET = CONFIG["esi"]["client_secret"]

session = requests.Session()


def process_auth(auth_type: str, auth_token: str) -> Tuple[str, str, int]:
    body = {"grant_type": auth_type}
    if auth_type == "refresh_token":
        body["refresh_token"] = auth_token
    else:
        body["code"] = auth_token

    result = session.post(
        "https://login.eveonline.com/oauth/token",
        data=body,
        auth=(AUTH_ID, AUTH_SECRET),
    )
    result.raise_for_status()
    result_json = result.json()

    verify = session.get(
        "https://login.eveonline.com/oauth/verify",
        headers={"Authorization": "Bearer %s" % result_json["access_token"]},
    )
    verify.raise_for_status()
    verify_json = verify.json()

    character = Character(
        id=verify_json["CharacterID"],
        name=verify_json["CharacterName"],
    )
    refresh_token = RefreshToken(
        character_id=verify_json["CharacterID"],
        refresh_token=result_json["refresh_token"],
    )
    access_token_obj = AccessToken(
        character_id=verify_json["CharacterID"],
        access_token=result_json["access_token"],
        expires=int(time.time() + (result_json["expires_in"] / 2)),
    )

    dbsession = Session()
    try:
        dbsession.merge(character)
        dbsession.merge(refresh_token)
        dbsession.merge(access_token_obj)
        dbsession.commit()
    finally:
        dbsession.close()

    return (access_token_obj.access_token, refresh_token.refresh_token, character.id)


def access_token(character_id: int) -> str:
    dbsession = Session()
    try:
        from_db = (
            dbsession.query(AccessToken)
            .filter(AccessToken.character_id == character_id)
            .one_or_none()
        )
        if from_db and from_db.expires <= time.time():
            dbsession.delete(from_db)
            dbsession.commit()
            from_db = None

        if from_db:
            return from_db.access_token  # type: ignore

        refresh_token = (
            dbsession.query(RefreshToken)
            .filter(RefreshToken.character_id == character_id)
            .one_or_none()
        )
        if not refresh_token:
            raise Exception("No refresh token found for %d" % character_id)

        access_token_s, _refresh_token, _character_id = process_auth(
            "refresh_token", refresh_token.refresh_token
        )
        return access_token_s

    finally:
        dbsession.close()


class HTTPError(Exception):
    def __init__(self, code: int, text: str):
        super().__init__("HTTP error %d: %s" % (code, text))
        self.code = code
        self.text = text


class HTTP403(HTTPError):
    pass


class HTTP404(HTTPError):
    pass


class HTTP520(HTTPError):
    pass


def _raise_for_status(response: requests.Response) -> None:
    exception: Optional[Type[HTTPError]] = None
    if response.status_code == 403:
        exception = HTTP403
    elif response.status_code == 404:
        exception = HTTP404
    elif response.status_code == 520:
        exception = HTTP520
    elif response.status_code >= 400:
        exception = HTTPError
    if exception:
        raise exception(response.status_code, response.text)
    response.raise_for_status()


def get(
    path: str,
    character_id: int,
    headers: Optional[Dict[str, str]] = None,
    **kwargs: Dict[str, Any]
) -> requests.Response:
    url = "https://esi.evetech.net" + path

    if headers is None:
        headers = {}
    token = access_token(character_id)
    headers["Authorization"] = "Bearer %s" % token
    headers["User-Agent"] = "waitlist, by Xifon Naari"

    kwargs["headers"] = headers
    result = session.get(url, **kwargs)
    _raise_for_status(result)
    return result


def post(
    path: str,
    character_id: int,
    headers: Optional[Dict[str, str]] = None,
    **kwargs: Dict[str, Any]
) -> requests.Response:
    url = "https://esi.evetech.net" + path

    if headers is None:
        headers = {}
    token = access_token(character_id)
    headers["Authorization"] = "Bearer %s" % token
    headers["User-Agent"] = "waitlist, by Xifon Naari"

    kwargs["headers"] = headers
    result = session.post(url, **kwargs)
    _raise_for_status(result)
    return result
