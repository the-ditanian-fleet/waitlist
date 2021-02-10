from typing import Union, Tuple, Dict, Any
from flask import Response

_ViewReturn = Union[
    str,
    Dict[str, Any],
    Response,
]

ViewReturn = Union[
    Tuple[_ViewReturn, int],
    _ViewReturn,
]
