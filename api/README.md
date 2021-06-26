# API server

This server deals with API requests, which is basically everything that requires ESI or a database.

## Installation

* Make sure you have the python development headers installed (`python3-dev` on Debian), plus the MySQL Client (`libmysqlclient-dev`).
* Optionally, but recommended, use virtualenv to create a local library installation.
* `pip install -r requirements_dev.txt` to install the libraries
* Download and shrink the Static Data Export, by running `shrink-sde.sh`. sqlite3 needs to be installed for this to work.
* Create a config by copying the example and filling in the missing details.
* Start the webserver by running `python main.py`. This will also initialize the database.
* Connect to the database and add yourself into the `character` and `admins` tables manually.
* The waitlist page currently won't work if no waitlist is defined, so add an entry into the `waitlist` table as well. This should be fixed at some point.

## Dev environment

Flask is nice.

    env FLASK_APP=waitlist.app flask run --reload --with-threads

You'll need a running [sse-server](https://github.com/TvdW/sse-server) instance to route events to the webbrowser.
