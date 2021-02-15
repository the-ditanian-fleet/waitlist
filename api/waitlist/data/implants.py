from typing import List
from . import esi


def load_character_implants(character_id: int) -> List[int]:
    return list(
        esi.get("/v2/characters/%d/implants/" % character_id, character_id).json()
    )
