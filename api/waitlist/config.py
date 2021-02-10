import configparser
import os

CONFIG = configparser.ConfigParser()
CONFIG.read(os.environ.get("WAITLIST_CONFIG", "config.ini"))
