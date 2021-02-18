from typing import Tuple, Dict, List, Any
import yaml
from ..data.evedb import id_of, type_variations


def _compute_alternatives(
    destination: Dict[int, List[Tuple[int, bool]]],
    source: List[List[List[str]]],
    allow_downgrade: bool,
) -> None:
    for group in source:
        this_group: List[Tuple[int, int]] = []
        tier_i = 0
        for tier in group:
            tier_i += 1
            for module in tier:
                this_group.append((id_of(module), tier_i))
        for module_i, tier_i in this_group:
            destination.setdefault(module_i, [])
            for module_j, tier_j in this_group:
                if tier_j >= tier_i or allow_downgrade:
                    destination[module_i].append((module_j, tier_j < tier_i))


def _from_meta(
    destination: Dict[int, List[Tuple[int, bool]]],
    meta_items: List[str],
    allow_downgrade: bool,
) -> None:
    for item in meta_items:
        meta_levels = type_variations(id_of(item))
        base_meta = meta_levels[id_of(item)]
        for module_i, meta_i in meta_levels.items():
            if meta_i < base_meta:
                continue

            destination.setdefault(module_i, [])
            for module_j, meta_j in meta_levels.items():
                if meta_j < base_meta:
                    continue

                is_downgrade = meta_j < meta_i
                if allow_downgrade or not is_downgrade:
                    destination[module_i].append((module_j, is_downgrade))


def _add_t1(
    destination: Dict[int, List[Tuple[int, bool]]], t2_items: List[str]
) -> None:
    for t2_item in t2_items:
        if not t2_item.endswith(" II"):
            raise Exception("%s is not a T2 item" % t2_item)
        t1_item = t2_item[:-3] + " I"
        destination.setdefault(id_of(t1_item), []).append((id_of(t2_item), False))
        destination.setdefault(id_of(t1_item), []).append((id_of(t1_item), False))
        destination.setdefault(id_of(t2_item), []).append((id_of(t1_item), True))
        destination.setdefault(id_of(t2_item), []).append((id_of(t2_item), False))


def load_alternatives() -> Dict[int, List[Tuple[int, bool]]]:
    with open("./waitlist/tdf/modules.yaml", "r") as fileh:
        modules_raw: Dict[str, Any] = yaml.safe_load(fileh)

    alternatives: Dict[int, List[Tuple[int, bool]]] = {}

    # Generate all possible valid permutations for the alternatives listed in the data
    _compute_alternatives(alternatives, modules_raw["alternatives"], True)
    _compute_alternatives(alternatives, modules_raw["no_downgrade"], False)

    _from_meta(alternatives, modules_raw["from_meta"], True)
    _from_meta(alternatives, modules_raw["from_meta_no_downgrade"], False)

    _add_t1(alternatives, modules_raw["accept_t1"])

    return alternatives


def load_identification() -> List[int]:
    with open("./waitlist/tdf/modules.yaml", "r") as fileh:
        modules_raw: Dict[str, Any] = yaml.safe_load(fileh)

    return list(map(id_of, modules_raw["identification"]))


def load_banned() -> List[int]:
    with open("./waitlist/tdf/modules.yaml", "r") as fileh:
        modules_raw: Dict[str, Any] = yaml.safe_load(fileh)

    return list(map(id_of, modules_raw["banned"]))
