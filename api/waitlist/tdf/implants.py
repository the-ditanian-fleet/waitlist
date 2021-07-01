from typing import List, Tuple, Optional
from ..data.evedb import id_of


def detect_implants(
    ship: int, implants: List[int]
) -> Tuple[Optional[str], bool]:  # pylint: disable=too-many-branches
    "Detects implants. Returns a tuple of (base_set, is_complete)"
    base_set = _detect_base(implants)  # 1-6
    if not base_set:
        return None, False

    have_slots = {7: False, 8: False, 9: False, 10: False}

    # Slot 7
    for implant in ["Ogdin's Eye %", "% MR-706"]:
        if id_of(implant, fuzzy=True) in implants:
            have_slots[7] = True

    # Slot 8
    if id_of("% EM-806", fuzzy=True) in implants:
        have_slots[8] = True
    if id_of("% MR-807", fuzzy=True) in implants and ship == id_of("Vindicator"):
        have_slots[8] = True

    # Slot 9
    for implant in [
        "% RF-906",
        "% SS-906",
        "Pashan's Turret Customization Mindlink",
    ]:
        if id_of(implant, fuzzy=True) in implants:
            have_slots[9] = True

    # Slot 10
    have_slots[10] = _have_slot10(ship, implants)

    return base_set, all(have_slots.values())


def _have_slot10(ship: int, implants: List[int]) -> bool:
    anything_goes = ship in [
        id_of("Nestor"),
        id_of("Guardian"),
        id_of("Oneiros"),
    ]

    if ship in [id_of("Nightmare"), id_of("Paladin")] or anything_goes:
        if id_of("% LE-1006", fuzzy=True) in implants:
            return True
        if id_of("Pashan's Turret Handling Mindlink") in implants:
            return True
    if ship in [id_of("Vindicator"), id_of("Kronos")] or anything_goes:
        if id_of("% LH-1006", fuzzy=True) in implants:
            return True

    return False


def _detect_base(implants: List[int]) -> Optional[str]:
    # Base set, slot 1-6
    if (
        id_of("High-grade Amulet Alpha") in implants
        and id_of("High-grade Amulet Beta") in implants
        and id_of("High-grade Amulet Gamma") in implants
        and id_of("High-grade Amulet Delta") in implants
        and id_of("High-grade Amulet Epsilon") in implants
    ):
        if id_of("% WS-618", fuzzy=True) in implants:
            return "HYBRID"
        if id_of("High-grade Amulet Omega") in implants:
            return "AMULET"

    if (
        id_of("High-grade Ascendancy Alpha") in implants
        and id_of("High-grade Ascendancy Beta") in implants
        and id_of("High-grade Ascendancy Gamma") in implants
        and id_of("High-grade Ascendancy Delta") in implants
        and id_of("High-grade Ascendancy Epsilon") in implants
    ):
        if id_of("% WS-618", fuzzy=True) in implants:
            return "WARPSPEED"
        if id_of("High-grade Ascendancy Omega") in implants:
            return "WARPSPEED"

    return None
