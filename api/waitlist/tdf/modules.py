from typing import Tuple, Dict, List, Any, Set
import yaml
from ..data.evedb import Attribute, id_of, name_of, type_variations, type_attributes


def _debug_tierlist(tiers: Dict[int, int]) -> None:
    sorted_tiers = sorted(tiers.items(), key=lambda x: x[1])
    print("---")
    print("TIER INFO")
    print("")
    for module_id, tier in sorted_tiers:
        print("    %2d: %s" % (tier, name_of(module_id)))
    print("---")


def _add_tierlist(
    destination: Dict[int, List[Tuple[int, int]]], source: Dict[int, int]
) -> None:
    # _debug_tierlist(source)

    for module_i, tier_i in source.items():
        if module_i in destination:
            raise Exception("Duplicate declaration for ID %d" % module_i)
        destination.setdefault(module_i, [])
        for module_j, tier_j in source.items():
            destination[module_i].append((module_j, tier_j - tier_i))


def _compute_alternatives(
    destination: Dict[int, List[Tuple[int, int]]],
    source: List[List[List[str]]],
) -> None:
    for group in source:
        tiers: Dict[int, int] = {}
        tier_i = 0
        for tier in group:
            tier_i += 1
            for module in tier:
                if id_of(module) in tiers:
                    raise Exception("Duplicate declaration for %s" % module)
                tiers[id_of(module)] = tier_i
        _add_tierlist(destination, tiers)


def _from_meta(
    destination: Dict[int, List[Tuple[int, int]]], items: List[Dict[str, str]]
) -> None:
    for item in items:
        variations = type_variations(id_of(item["base"]))
        if "abyssal" in item:
            variations[id_of(item["abyssal"])] = variations[id_of(item["base"])]
        _add_tierlist(destination, variations)


def _from_attribute(
    destination: Dict[int, List[Tuple[int, int]]], items: List[Dict[str, Any]]
) -> None:
    for item in items:
        base: List[str] = item["base"]
        attribute = Attribute[item["attribute"]]

        modules: List[int] = []
        for base_module in base:
            modules.extend(type_variations(id_of(base_module)).keys())

        attribute_info = type_attributes(modules)
        modules_with_attr: List[Tuple[int, float]] = []
        for module in modules:
            modules_with_attr.append((module, attribute_info[module][attribute]))

        modules_with_attr = list(sorted(modules_with_attr, key=lambda item: item[1]))
        if item.get("reverse", False):
            modules_with_attr = list(reversed(modules_with_attr))

        last_attr = None
        tier_i = 0
        tiers: Dict[int, int] = {}
        for module_id, attr_value in modules_with_attr:
            if attr_value != last_attr:
                tier_i += 1
                last_attr = attr_value
            tiers[module_id] = tier_i
        _add_tierlist(destination, tiers)


def _add_t1(destination: Dict[int, List[Tuple[int, int]]], t2_items: List[str]) -> None:
    for t2_item in t2_items:
        _add_tierlist(
            destination,
            {
                id_of(t2_item[:-1]): 1,
                id_of(t2_item): 2,
            },
        )


def load_alternatives() -> Dict[int, List[Tuple[int, int]]]:
    with open("./waitlist/tdf/modules.yaml", "r") as fileh:
        modules_raw: Dict[str, Any] = yaml.safe_load(fileh)

    alternatives: Dict[int, List[Tuple[int, int]]] = {}

    # Generate all possible valid permutations for the alternatives listed in the data
    _compute_alternatives(alternatives, modules_raw["alternatives"])
    _from_meta(alternatives, modules_raw["from_meta"])
    _from_attribute(alternatives, modules_raw["from_attribute"])
    _add_t1(alternatives, modules_raw["accept_t1"])

    # Sort upgrades before downgrades
    def _sortfn(item: Tuple[int, int]) -> int:
        if item[1] < 0:
            return 1000000 - item[1]
        return item[1]

    alternatives = {
        module_id: sorted(alternative_modules, key=_sortfn)
        for module_id, alternative_modules in alternatives.items()
    }

    return alternatives


def load_identification(alternatives: Dict[int, List[Tuple[int, int]]]) -> Set[int]:
    with open("./waitlist/tdf/modules.yaml", "r") as fileh:
        modules_raw: Dict[str, Any] = yaml.safe_load(fileh)

    result: Set[int] = set()
    for module_id in map(id_of, modules_raw["identification"]):
        for alternative, _meta_diff in alternatives.get(module_id, [(module_id, 0)]):
            result.add(alternative)

    return result
