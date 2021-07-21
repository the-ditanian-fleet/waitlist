from typing import List, Dict
from enum import Enum
import sqlite3

DATABASE = sqlite3.connect("sqlite-shrunk.sqlite", check_same_thread=False)

ID_CACHE: Dict[str, int] = {}
NAME_CACHE: Dict[int, str] = {}


class Attribute(Enum):
    META_LEVEL = 633
    EM_RESIST = 984
    EXPLOSIVE_RESIST = 985
    KINETIC_RESIST = 986
    THERMAL_RESIST = 987


class Effect(Enum):
    LOW_POWER = 11
    HIGH_POWER = 12
    MED_POWER = 13
    RIG_SLOT = 2663


class Category(Enum):
    SHIP = 6
    MODULE = 7
    CHARGE = 8
    DRONE = 18
    IMPLANT = 20
    OTHER = 99999


KNOWN_ATTRIBUTES = {attr.value for attr in Attribute}
KNOWN_EFFECTS = {effect.value for effect in Effect}
KNOWN_CATEGORIES = {category.value for category in Category}


def type_attributes(ids: List[int]) -> Dict[int, Dict[Attribute, float]]:
    query = (
        "select typeID, attributeID, coalesce(valueInt,valueFloat) "
        + "from dgmTypeAttributes where typeID IN (%s)" % (",".join("?" for n in ids))
    )
    qresult = DATABASE.cursor().execute(query, ids)

    result: Dict[int, Dict[Attribute, float]] = {}
    for type_id, attribute_id, value in qresult:
        if attribute_id not in KNOWN_ATTRIBUTES:
            continue
        result.setdefault(int(type_id), {})[Attribute(attribute_id)] = float(value)
    return result


def type_effects(ids: List[int]) -> Dict[int, Dict[Effect, bool]]:
    query = (
        "select typeID, effectID, isDefault "
        + "from dgmTypeEffects where typeID IN (%s)" % (",".join("?" for n in ids))
    )
    qresult = DATABASE.cursor().execute(query, ids)

    result: Dict[int, Dict[Effect, bool]] = {}
    for type_id, effect_id, value in qresult:
        if effect_id not in KNOWN_EFFECTS:
            continue
        result.setdefault(int(type_id), {})[Effect(effect_id)] = bool(value)
    return result


def type_names(ids: List[int]) -> Dict[int, str]:
    result = {}
    query = (
        "SELECT typeID, typeName FROM invTypes WHERE typeID IN (%s) order by published asc"
        % (",".join("?" for n in ids))
    )
    qresult = DATABASE.cursor().execute(query, list(ids))
    for type_id, type_name in qresult:
        result[type_id] = type_name
    return result


def type_ids(names: List[str]) -> Dict[str, int]:
    result = {}
    query = (
        "SELECT typeID, typeName FROM invTypes WHERE typeName IN (%s) order by published asc"
        % (",".join("?" for n in names))
    )
    qresult = DATABASE.cursor().execute(query, list(names))
    for type_id, type_name in qresult:
        result[type_name] = type_id
    return result


def type_categories(ids: List[int]) -> Dict[int, Category]:
    query = (
        "SELECT typeID, groupID FROM invTypes WHERE typeID IN (%s) order by published asc"
        % (",".join("?" for n in ids))
    )
    type_groups = list(DATABASE.cursor().execute(query, list(ids)))
    group_ids = list(set(group_id for type_id, group_id in type_groups))

    query = "SELECT groupID, categoryID FROM invGroups WHERE groupID IN (%s)" % (
        ",".join("?" for n in group_ids)
    )
    group_categories = {
        groupID: (
            Category(categoryID) if categoryID in KNOWN_CATEGORIES else Category.OTHER
        )
        for groupID, categoryID in DATABASE.cursor().execute(query, list(group_ids))
    }

    result = {}
    for type_id, group_id in type_groups:
        result[type_id] = group_categories[group_id]
    return result


def type_variations(type_id: int) -> Dict[int, int]:
    cursor = DATABASE.cursor()
    (parent,) = cursor.execute(
        "SELECT parentTypeID FROM invMetaTypes WHERE typeID=?", (type_id,)
    ).fetchone()

    if not parent:
        parent = type_id

    metas: Dict[int, int] = {parent: 0}
    for variation, meta, meta_group_id in cursor.execute(
        """select invMetaTypes.typeID, coalesce(valueInt, valueFloat), metaGroupID
        from invMetaTypes left join dgmTypeAttributes
        on invMetaTypes.typeID = dgmTypeAttributes.typeID
        and attributeID = 633
        where parentTypeID=?""",
        (parent,),
    ):
        if meta is not None:
            metas[variation] = int(meta)
        elif meta_group_id == 1:  # T1
            metas[variation] = 0
        elif meta_group_id == 2:  # T2
            metas[variation] = 5

    if len(metas) <= 1:
        raise Exception("Variation lookup for %d failed" % type_id)

    return metas


def id_of(name: str, fuzzy: bool = False) -> int:
    if not name in ID_CACHE:
        if not fuzzy:
            ids = type_ids([name])
            ID_CACHE[name] = ids[name]
        else:
            query = (
                "SELECT typeID FROM invTypes WHERE typeName LIKE ? "
                + "order by published desc limit 1"
            )
            (type_id,) = DATABASE.cursor().execute(query, (name,)).fetchone()
            ID_CACHE[name] = type_id
    return ID_CACHE[name]


def name_of(type_id: int) -> str:
    if not type_id in NAME_CACHE:
        names = type_names([type_id])
        NAME_CACHE[type_id] = names[type_id]
    return NAME_CACHE[type_id]
