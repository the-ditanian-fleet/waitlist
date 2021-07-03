from flask import Blueprint, g, redirect
from . import auth
from .webutil import ViewReturn
from .data import sse

bp = Blueprint("sse", __name__)


@bp.route("/api/sse/stream")
@auth.login_required
def sse_stream() -> ViewReturn:
    buckets = []
    buckets.append("waitlist")
    buckets.append("account;%d" % g.account_id)
    if auth.has_access("waitlist-view"):
        buckets.append("xup")

    return redirect(sse.get_events_url(buckets))
