import re
from typing import Dict, List, Tuple
from .data import evedb

NOT_MODULE_CATEGORIES = [
    evedb.Category.CHARGE,
    evedb.Category.IMPLANT,
]


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

    sections: List[List[Tuple[str, int, bool]]] = [[]]
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
        sections[-1].append((itemtype, count, " x" in line))

    ids = evedb.type_ids(list(names))
    categories = evedb.type_categories(list(ids.values()))

    dna_string = str(ids[ship_type]) + ":"

    for section_i in [4, 0, 1, 2, 3, 5, 6, 7, 8, 9, 10]:
        if section_i >= len(sections):
            continue
        counts: Dict[str, int] = {}
        inactive = False
        for itemname, count, stacked in sections[section_i]:
            counts.setdefault(itemname, 0)
            counts[itemname] += count
            if (
                stacked
                and section_i >= 4
                and categories[ids[itemname]] != evedb.Category.DRONE
            ):
                inactive = True

        for itemname in sorted(counts.keys()):
            if (
                section_i < 7 or categories[ids[itemname]] in NOT_MODULE_CATEGORIES
            ) and not inactive:
                dna_string += "%d;%d:" % (ids[itemname], counts[itemname])
            else:
                dna_string += "%d_;%d:" % (ids[itemname], counts[itemname])

    return dna_string + ":"


def split_dna(fit_dna: str) -> Tuple[int, Dict[int, int], Dict[int, int]]:
    items_sum: Dict[int, int] = {}
    cargo: Dict[int, int] = {}
    modules: Dict[int, int] = {}

    pieces = fit_dna.split(":")
    for dna_piece in pieces[1:]:
        if not dna_piece:
            continue
        if ";" in dna_piece:
            module_id_s, module_count_s = dna_piece.split(";", 1)
            module_count = int(module_count_s)
        else:
            module_id_s = dna_piece
            module_count = 1
        if module_id_s.endswith("_"):
            module_id = int(module_id_s[:-1])
            cargo.setdefault(module_id, 0)
            cargo[module_id] += module_count
        else:
            module_id = int(module_id_s)
            items_sum.setdefault(module_id, 0)
            items_sum[module_id] += module_count

    categories = evedb.type_categories(list(items_sum.keys()))

    for module_id, module_count in items_sum.items():
        if categories[module_id] in NOT_MODULE_CATEGORIES:
            desto = cargo
        else:
            desto = modules
        desto.setdefault(module_id, 0)
        desto[module_id] += module_count
    return int(pieces[0]), modules, cargo
