from typing import List, Dict
import sqlite3

DATABASE = sqlite3.connect("sqlite-latest.sqlite", check_same_thread=False)


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
