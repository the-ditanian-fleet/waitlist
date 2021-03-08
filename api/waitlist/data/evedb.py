from typing import List, Dict
import sqlite3

DATABASE = sqlite3.connect("sqlite-shrunk.sqlite", check_same_thread=False)

ID_CACHE: Dict[str, int] = {}
NAME_CACHE: Dict[int, str] = {}


def type_names(ids: List[int]) -> Dict[int, str]:
    result = {}
    query = "SELECT typeID, typeName FROM invTypes WHERE typeID IN (%s)" % (
        ",".join("?" for n in ids)
    )
    qresult = DATABASE.cursor().execute(query, list(ids))
    for type_id, type_name in qresult:
        result[type_id] = type_name
    return result


def type_ids(names: List[str]) -> Dict[str, int]:
    result = {}
    query = "SELECT typeID, typeName FROM invTypes WHERE typeName IN (%s)" % (
        ",".join("?" for n in names)
    )
    qresult = DATABASE.cursor().execute(query, list(names))
    for type_id, type_name in qresult:
        result[type_name] = type_id
    return result


def type_categories(ids: List[int]) -> Dict[int, int]:
    query = "SELECT typeID, groupID FROM invTypes WHERE typeID IN (%s)" % (
        ",".join("?" for n in ids)
    )
    type_groups = list(DATABASE.cursor().execute(query, list(ids)))
    group_ids = list(set(group_id for type_id, group_id in type_groups))

    query = "SELECT groupID, categoryID FROM invGroups WHERE groupID IN (%s)" % (
        ",".join("?" for n in group_ids)
    )
    group_categories = dict(DATABASE.cursor().execute(query, list(group_ids)))

    result = {}
    for type_id, group_id in type_groups:
        result[type_id] = group_categories[group_id]
    return result


def type_variations(type_id: int) -> Dict[int, int]:
    cursor = DATABASE.cursor()
    (parent,) = cursor.execute(
        "SELECT parentTypeID FROM invMetaTypes WHERE typeID=?", (type_id,)
    ).fetchone()

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

    return metas


def id_of(name: str, fuzzy: bool = False) -> int:
    if not name in ID_CACHE:
        if not fuzzy:
            ids = type_ids([name])
            ID_CACHE[name] = ids[name]
        else:
            query = "SELECT typeID FROM invTypes WHERE typeName LIKE ?"
            (type_id,) = DATABASE.cursor().execute(query, (name,)).fetchone()
            ID_CACHE[name] = type_id
    return ID_CACHE[name]


def name_of(type_id: int) -> str:
    if not type_id in NAME_CACHE:
        names = type_names([type_id])
        NAME_CACHE[type_id] = names[type_id]
    return NAME_CACHE[type_id]
