from typing import Tuple, Dict, List, Any, Set
import yaml
from ..data.evedb import id_of, type_variations


def _compute_alternatives(
    destination: Dict[int, List[Tuple[int, int]]],
    source: List[List[List[str]]],
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
                destination[module_i].append((module_j, tier_j - tier_i))


def _from_meta(
    destination: Dict[int, List[Tuple[int, int]]],
    meta_items: List[str],
) -> None:
    for item in meta_items:
        meta_levels = type_variations(id_of(item))
        for module_i, meta_i in meta_levels.items():
            destination.setdefault(module_i, [])
            for module_j, meta_j in meta_levels.items():
                destination[module_i].append((module_j, meta_j - meta_i))


def _add_t1(destination: Dict[int, List[Tuple[int, int]]], t2_items: List[str]) -> None:
    for t2_item in t2_items:
        if not t2_item.endswith(" II"):
            raise Exception("%s is not a T2 item" % t2_item)
        t1_item = t2_item[:-3] + " I"
        destination.setdefault(id_of(t1_item), []).append((id_of(t2_item), 1))
        destination.setdefault(id_of(t1_item), []).append((id_of(t1_item), 0))
        destination.setdefault(id_of(t2_item), []).append((id_of(t1_item), -1))
        destination.setdefault(id_of(t2_item), []).append((id_of(t2_item), 0))


def load_alternatives() -> Dict[int, List[Tuple[int, int]]]:
    with open("./waitlist/tdf/modules.yaml", "r") as fileh:
        modules_raw: Dict[str, Any] = yaml.safe_load(fileh)

    alternatives: Dict[int, List[Tuple[int, int]]] = {}

    # Generate all possible valid permutations for the alternatives listed in the data
    _compute_alternatives(alternatives, modules_raw["alternatives"])
    _from_meta(alternatives, modules_raw["from_meta"])

    _add_t1(alternatives, modules_raw["accept_t1"])

    # Sort all lists by distance from the base module
    for (
        module_id
    ) in alternatives.keys():  # pylint: disable=consider-iterating-dictionary
        alternatives[module_id] = sorted(
            alternatives[module_id], key=lambda alt: abs(alt[1])
        )

    return alternatives


def load_identification(alternatives: Dict[int, List[Tuple[int, int]]]) -> Set[int]:
    with open("./waitlist/tdf/modules.yaml", "r") as fileh:
        modules_raw: Dict[str, Any] = yaml.safe_load(fileh)

    result: Set[int] = set()
    for module_id in map(id_of, modules_raw["identification"]):
        for alternative, _meta_diff in alternatives.get(module_id, [(module_id, 0)]):
            result.add(alternative)

    return result


def load_banned() -> List[int]:
    with open("./waitlist/tdf/modules.yaml", "r") as fileh:
        modules_raw: Dict[str, Any] = yaml.safe_load(fileh)

    return list(map(id_of, modules_raw["banned"]))
