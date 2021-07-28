from typing import Optional
import logging
from flask import Flask, Response, send_from_directory, g
from . import (
    auth,
    skills,
    waitlist,
    alts,
    fleet,
    category,
    fleet_updater,
    sse,
    window,
    pilot,
    xup_history,
    search,
    bans,
    acl,
    fleet_history,
    statistics,
    modules,
)
from .webutil import ViewReturn
from .data import database

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

app.register_blueprint(auth.bp)
app.register_blueprint(skills.bp)
app.register_blueprint(waitlist.bp)
app.register_blueprint(alts.bp)
app.register_blueprint(fleet.bp)
app.register_blueprint(category.bp)
app.register_blueprint(sse.bp)
app.register_blueprint(window.bp)
app.register_blueprint(pilot.bp)
app.register_blueprint(xup_history.bp)
app.register_blueprint(search.bp)
app.register_blueprint(bans.bp)
app.register_blueprint(acl.bp)
app.register_blueprint(fleet_history.bp)
app.register_blueprint(statistics.bp)
app.register_blueprint(modules.bp)


@app.route("/favicon.ico")
def favicon() -> ViewReturn:
    return send_from_directory("static", "favicon.ico")


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def catch_all(path: str) -> ViewReturn:  # pylint: disable=unused-argument
    return send_from_directory("static", "index.html", cache_timeout=-1)


@app.before_request
def setup_db() -> None:
    g.db = database.Session()  # false positive pylint: disable=assigning-non-slot


@app.teardown_request
def finish_db(_exception: Optional[BaseException]) -> Response:
    if g.db:
        g.db.close()
        g.db = None  # false positive pylint: disable=assigning-non-slot


fleet_updater.create_fleet_updater().start()
