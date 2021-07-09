from typing import Any
from sqlalchemy.sql import expression
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.engine import Compiled

# So mypy really doesn't like this file. Hope for the best!
# mypy: ignore-errors

# And pylint also doesn't.
# pylint: disable=too-many-ancestors,invalid-name,abstract-method


class from_unixtime(expression.FunctionElement):
    name = "from_unixtime"


@compiles(from_unixtime)
def generic_from_unixtime(
    element: expression.FunctionElement, compiler: Compiled, **_kwargs: Any
) -> str:
    return "from_unixtime({})".format(compiler.process(element.clauses))


@compiles(from_unixtime, "sqlite")
def sqlite_from_unixtime(
    element: expression.FunctionElement, compiler: Compiled, **_kwargs: Any
) -> str:
    return 'datetime({}, "unixepoch")'.format(compiler.process(element.clauses))


class yearmonth(expression.FunctionElement):
    name = "yearmonth"


@compiles(yearmonth, "mysql")
def mysql_yearmonth(
    element: expression.FunctionElement, compiler: Compiled, **_kwargs: Any
) -> str:
    return "date_format({}, '%%Y-%%m')".format(compiler.process(element.clauses))


@compiles(yearmonth, "sqlite")
def sqlite_yearmonth(
    element: expression.FunctionElement, compiler: Compiled, **_kwargs: Any
) -> str:
    return 'strftime("%Y-%m", {})'.format(compiler.process(element.clauses))
