from typing import List, Generator
import queue
from flask import Blueprint, Response, g
from . import auth
from .webutil import ViewReturn
from .data import messager

bp = Blueprint("sse", __name__)


def stream(buckets: List[str]) -> Generator[str, None, None]:
    q_id, bus = messager.MESSAGER.subscribe(buckets)
    yield "event: hello\ndata: world\n\n"
    try:
        while True:
            try:
                event, data = bus.get(timeout=60)
                yield "event: %s\ndata: %s\n\n" % (event, data)
            except queue.Empty:
                yield "event: keepalive\ndata: wave\n\n"
    finally:
        messager.MESSAGER.unsubscribe(q_id)


@bp.route("/api/sse/stream")
@auth.login_required
def sse() -> ViewReturn:
    buckets = []
    buckets.append("waitlist")
    buckets.append("account;%d" % g.account_id)
    if auth.has_access("waitlist-manage"):
        buckets.append("xup")

    # Remove database connections
    if g.db:
        g.db.close()
        g.db = None

    return Response(
        stream(buckets),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-transform"},
    )
