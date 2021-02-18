from typing import Set
import yaml

with open("./waitlist/tdf/tags.yaml", "r") as fileh:
    _raw_tags = yaml.safe_load(fileh)
    PUBLIC_TAGS: Set[str] = set(_raw_tags["public_tags"])
