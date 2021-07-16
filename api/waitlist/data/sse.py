from typing import List, Dict, Any
import json
from branca import Branca
import msgpack
import requests

from .config import CONFIG

session = requests.Session()


def sse_sign(data: Dict[str, Any]) -> str:
    packed = msgpack.packb(data)
    return Branca(bytes.fromhex(CONFIG["sse"]["secret"])).encode(packed)  # type: ignore


def submit(messages: List[Dict[str, str]]) -> None:
    session.post(
        "%s/submit" % CONFIG["sse"]["url"],
        data=sse_sign(
            {
                "events": messages,
            }
        ),
    )


def get_events_url(topics: List[str]) -> str:
    token = sse_sign({"topics": topics})
    return "%s/events?token=%s" % (CONFIG["sse"]["url"], token)


def message(topic: str, event: str, data: str) -> Dict[str, str]:
    return {
        "topic": topic,
        "event": event,
        "data": data,
    }


def message_json(topic: str, event: str, data: Any) -> Dict[str, str]:
    return message(topic, event, json.dumps(data))
