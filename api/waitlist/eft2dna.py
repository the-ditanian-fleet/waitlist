import re
from typing import Dict, List, Tuple
from . import evedb


def split_eft(eft_input: str) -> List[str]:
    lines = eft_input.split("\n")
    ships = []
    for line in lines:
        line = line.strip()
        if re.match(r"\[.+, .+\]$", line):
            ships.append("")
        ships[-1] += line + "\n"
    return ships


def eft2dna(eft_input: str) -> str:  # pylint: disable=too-many-locals
    lines = eft_input.split("\n")

    ship_type = lines.pop(0).split(",")[0][1:].strip()

    sections: List[List[Tuple[str, int]]] = [[]]
    names = set()
    names.add(ship_type)
    for line in lines:
        line = line.strip()
        if not line:
            sections.append([])
            continue

        if re.match(r"\[.*\]$", line):
            continue

        if " x" in line:
            *itemtype_a, count_s = line.split(" x")
            itemtype = " x".join(itemtype_a)  # Is this too paranoid?
            count = int(count_s)
        else:
            itemtype = line
            count = 1

        names.add(itemtype)
        sections[-1].append((itemtype, count))

    ids = evedb.type_ids(list(names))
    categories = evedb.type_categories(list(ids.values()))

    dna_string = str(ids[ship_type]) + ":"

    for section_i in [4, 0, 1, 2, 3, 5, 6, 7, 8, 9, 10]:
        if section_i >= len(sections):
            continue
        counts: Dict[str, int] = {}
        for itemname, count in sections[section_i]:
            counts.setdefault(itemname, 0)
            counts[itemname] += count
        for itemname in sorted(counts.keys()):
            if section_i < 7 or categories[ids[itemname]] == 8:
                dna_string += "%d;%d:" % (ids[itemname], counts[itemname])
            else:
                dna_string += "%d_;%d:" % (ids[itemname], counts[itemname])

    return dna_string + ":"
