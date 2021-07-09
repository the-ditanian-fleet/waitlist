from functools import cached_property
from typing import Dict, TypeVar
from datetime import datetime

from flask import Blueprint, g
from sqlalchemy.sql import func

from . import auth
from .webutil import ViewReturn
from .data.database import FleetActivity, FitHistory, Fitting
from .data.dbutil import from_unixtime, yearmonth
from .data.evedb import name_of

bp = Blueprint("stats", __name__)

T = TypeVar("T")  # pylint: disable=invalid-name


def _filter_into_other(
    source_data: Dict[str, Dict[str, int]],
    threshold: float = 0.01,
    other: str = "Other",
) -> Dict[str, Dict[str, int]]:
    sums: Dict[str, int] = {}
    for x_value in source_data.values():
        for key, value in x_value.items():
            if key not in sums:
                sums[key] = 0
            sums[key] += value

    total = sum(sums.values())
    top_n = {item[0] for item in sums.items() if item[1] > threshold * total}

    result: Dict[str, Dict[str, int]] = {}
    for x_key, x_value in source_data.items():
        result[x_key] = {}
        for key, value in x_value.items():
            if key in top_n:
                result[x_key][key] = value
            else:
                if not other in result[x_key]:
                    result[x_key][other] = 0
                result[x_key][other] += value

    return result


class StatisticsFetcher:
    @cached_property
    def beginning_of_time(  # Used for memoization. pylint: disable=no-self-use
        self,
    ) -> str:
        for (year_month,) in g.db.query(
            yearmonth(func.min(FitHistory.logged_at))
        ).all():
            return str(year_month)
        raise Exception("When did time begin?!")

    def _fill_missing_months(
        self, source_data: Dict[str, T], on_missing: T
    ) -> Dict[str, T]:
        begin_year, begin_month = map(int, self.beginning_of_time.split("-", 1))
        current_datetime = datetime.now()

        iter_year = begin_year
        iter_month = begin_month

        result_data: Dict[str, T] = {}
        while iter_year < current_datetime.month or iter_month < current_datetime.month:
            iter_month += 1
            if iter_month > 12:
                iter_month = 1
                iter_year += 1
            year_month = "%04d-%02d" % (iter_year, iter_month)
            result_data[year_month] = source_data.get(year_month, on_missing)
        return result_data

    @cached_property
    def fleet_seconds_by_character_by_month(self) -> Dict[str, Dict[int, int]]:
        result: Dict[str, Dict[int, int]] = {}
        for year_month, character_id, fleet_seconds in (
            g.db.query(
                yearmonth(from_unixtime(FleetActivity.first_seen)),
                FleetActivity.character_id,
                func.sum(FleetActivity.last_seen - FleetActivity.first_seen),
            )
            .group_by(
                yearmonth(from_unixtime(FleetActivity.first_seen)),
                FleetActivity.character_id,
            )
            .all()
        ):
            result.setdefault(str(year_month), {})[character_id] = int(fleet_seconds)
        return self._fill_missing_months(result, {})

    @cached_property
    def fleet_seconds_by_hull_by_month(self) -> Dict[str, Dict[int, int]]:
        result: Dict[str, Dict[int, int]] = {}
        for year_month, hull, fleet_seconds in (
            g.db.query(
                yearmonth(from_unixtime(FleetActivity.first_seen)),
                FleetActivity.hull,
                func.sum(FleetActivity.last_seen - FleetActivity.first_seen),
            )
            .group_by(
                yearmonth(from_unixtime(FleetActivity.first_seen)),
                FleetActivity.hull,
            )
            .all()
        ):
            result.setdefault(str(year_month), {})[hull] = int(fleet_seconds)
        return self._fill_missing_months(result, {})

    @cached_property
    def xes_by_hull_by_month(self) -> Dict[str, Dict[int, int]]:
        result: Dict[str, Dict[int, int]] = {}
        for year_month, hull, count in (
            g.db.query(
                yearmonth(FitHistory.logged_at),
                Fitting.hull,
                func.count(func.distinct(FitHistory.character_id)),
            )
            .join(Fitting)
            .filter(Fitting.id == FitHistory.fit_id)
            .group_by(
                yearmonth(FitHistory.logged_at),
                Fitting.hull,
            )
            .all()
        ):
            result.setdefault(str(year_month), {})[hull] = int(count)
        return self._fill_missing_months(result, {})

    @cached_property
    def fleet_seconds_by_month(self) -> Dict[str, int]:
        result: Dict[str, int] = {}
        for year_month, fleet_seconds in (
            g.db.query(
                yearmonth(from_unixtime(FleetActivity.first_seen)),
                func.sum(FleetActivity.last_seen - FleetActivity.first_seen),
            )
            .group_by(yearmonth(from_unixtime(FleetActivity.first_seen)))
            .all()
        ):
            result[year_month] = int(fleet_seconds)
        return self._fill_missing_months(result, 0)

    @cached_property
    def pilots_by_month(self) -> Dict[str, int]:
        result: Dict[str, int] = {}
        for year_month, pilots in (
            g.db.query(
                yearmonth(from_unixtime(FleetActivity.first_seen)),
                func.count(func.distinct(FleetActivity.character_id)),
            )
            .group_by(yearmonth(from_unixtime(FleetActivity.first_seen)))
            .all()
        ):
            result[year_month] = int(pilots)
        return self._fill_missing_months(result, 0)


def _map_dict_keys_to_name(source_data: Dict[int, T]) -> Dict[str, T]:
    result: Dict[str, T] = {}
    for key, value in source_data.items():
        result[name_of(key)] = value
    return result


def build_fleet_seconds_by_hull_by_month(
    fetcher: StatisticsFetcher,
) -> Dict[str, Dict[str, int]]:
    return _filter_into_other(
        {
            year_month: _map_dict_keys_to_name(raw_data)
            for year_month, raw_data in fetcher.fleet_seconds_by_hull_by_month.items()
        }
    )


def build_xes_by_hull_by_month(fetcher: StatisticsFetcher) -> Dict[str, Dict[str, int]]:
    return _filter_into_other(
        {
            year_month: _map_dict_keys_to_name(raw_data)
            for year_month, raw_data in fetcher.xes_by_hull_by_month.items()
        }
    )


def build_time_spent_in_fleet_by_month(
    fetcher: StatisticsFetcher,
) -> Dict[str, Dict[str, int]]:
    result: Dict[str, Dict[str, int]] = {}
    buckets = ["a. <1h", "b. 1-5h", "c. 5-15h", "d. 15-40h", "e. 40h+"]
    for (
        year_month,
        character_data,
    ) in fetcher.fleet_seconds_by_character_by_month.items():
        result[year_month] = {bucket: 0 for bucket in buckets}
        for _character_id, fleet_seconds in character_data.items():
            if fleet_seconds < (1 * 3600):
                bucket = "a. <1h"
            elif fleet_seconds < (5 * 3600):
                bucket = "b. 1-5h"
            elif fleet_seconds < (15 * 3600):
                bucket = "c. 5-15h"
            elif fleet_seconds < (40 * 3600):
                bucket = "d. 15-40h"
            else:
                bucket = "e. 40h+"
            result[year_month][bucket] += 1
    return result


@bp.route("/api/stats")
@auth.login_required
@auth.require_permission("stats-view")
def stats() -> ViewReturn:
    fetcher = StatisticsFetcher()

    return {
        "beginning_of_time": str(fetcher.beginning_of_time),
        "fleet_seconds_by_hull_by_month": build_fleet_seconds_by_hull_by_month(fetcher),
        "xes_by_hull_by_month": build_xes_by_hull_by_month(fetcher),
        "fleet_seconds_by_month": dict(fetcher.fleet_seconds_by_month),
        "pilots_by_month": dict(fetcher.pilots_by_month),
        "time_spent_in_fleet_by_month": build_time_spent_in_fleet_by_month(fetcher),
    }
