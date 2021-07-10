from functools import cached_property
from typing import Dict, TypeVar
import datetime

from flask import Blueprint, g
from sqlalchemy.sql import func

from . import auth
from .webutil import ViewReturn
from .data.database import FleetActivity, FitHistory, Fitting
from .data.dbutil import from_unixtime, yearmonth
from .data.evedb import name_of

bp = Blueprint("stats", __name__)

T = TypeVar("T")  # pylint: disable=invalid-name
N = TypeVar("N", int, float)  # pylint: disable=invalid-name


def _filter_into_other(
    source_data: Dict[str, Dict[str, N]],
    threshold: float = 0.01,
    other: str = "Other",
) -> Dict[str, Dict[str, N]]:
    sums: Dict[str, float] = {}
    for x_value in source_data.values():
        for key, value in x_value.items():
            if key not in sums:
                sums[key] = 0
            sums[key] += value

    total = sum(sums.values())
    top_n = {item[0] for item in sums.items() if item[1] > threshold * total}

    result: Dict[str, Dict[str, N]] = {}
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


def _filter_into_other_1d(
    source_data: Dict[str, N], threshold: float = 0.01, other: str = "Other"
) -> Dict[str, N]:
    total = sum(source_data.values())
    result: Dict[str, N] = {}
    for key, value in source_data.items():
        if value >= threshold * total:
            result[key] = value
        else:
            if other not in result:
                result[other] = value
            else:
                result[other] += value
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

    @cached_property
    def now_minus_28_days(  # Used for memoization. pylint: disable=no-self-use
        self,
    ) -> datetime.datetime:
        return datetime.datetime.utcnow() - datetime.timedelta(days=28)

    def _fill_missing_months(
        self, source_data: Dict[str, T], on_missing: T
    ) -> Dict[str, T]:
        begin_year, begin_month = map(int, self.beginning_of_time.split("-", 1))
        current_datetime = datetime.datetime.utcnow()

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

    @cached_property
    def xes_by_hull_28d(self) -> Dict[int, int]:
        result: Dict[int, int] = {}
        for hull, count in (
            g.db.query(
                Fitting.hull,
                func.count(func.distinct(FitHistory.character_id)),
            )
            .join(Fitting)
            .filter(
                Fitting.id == FitHistory.fit_id,
                FitHistory.logged_at > self.now_minus_28_days,
            )
            .group_by(
                Fitting.hull,
            )
            .all()
        ):
            result[hull] = int(count)
        return result

    @cached_property
    def fleet_seconds_by_hull_28d(self) -> Dict[int, int]:
        result: Dict[int, int] = {}
        for hull, fleet_seconds in (
            g.db.query(
                FleetActivity.hull,
                func.sum(FleetActivity.last_seen - FleetActivity.first_seen),
            )
            .group_by(FleetActivity.hull)
            .filter(FleetActivity.first_seen > self.now_minus_28_days.timestamp())
        ).all():
            result[hull] = int(fleet_seconds)
        return result


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


def build_xes_by_hull_28d(fetcher: StatisticsFetcher) -> Dict[str, int]:
    return _filter_into_other_1d(_map_dict_keys_to_name(fetcher.xes_by_hull_28d))


def build_fleet_seconds_by_hull_28d(fetcher: StatisticsFetcher) -> Dict[str, int]:
    return _filter_into_other_1d(
        _map_dict_keys_to_name(fetcher.fleet_seconds_by_hull_28d)
    )


def build_x_vs_time_by_hull_28d(
    fetcher: StatisticsFetcher,
) -> Dict[str, Dict[str, float]]:
    fleet_time_by_hull = fetcher.fleet_seconds_by_hull_28d
    xes_by_hull = fetcher.xes_by_hull_28d

    sum_fleet_time = sum(fleet_time_by_hull.values())
    sum_xes = sum(xes_by_hull.values())

    if sum_fleet_time == 0 or sum_xes == 0:
        # Avoid division by zero
        return {}

    listed_hulls = {
        item[0]
        for item in fleet_time_by_hull.items()
        if item[1] >= sum_fleet_time * 0.01  # 1% threshold
    }

    result: Dict[str, Dict[str, float]] = {}
    for hull, fleet_seconds in fleet_time_by_hull.items():
        bucket = name_of(hull) if hull in listed_hulls else "Other"
        result.setdefault(bucket, {"Time": 0, "X": 0})["Time"] += (
            fleet_seconds / sum_fleet_time
        )

    for hull, count in xes_by_hull.items():
        bucket = name_of(hull) if hull in listed_hulls else "Other"
        result.setdefault(bucket, {"Time": 0, "X": 0})["X"] += count / sum_xes

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
        "xes_by_hull_28d": build_xes_by_hull_28d(fetcher),
        "fleet_seconds_by_hull_28d": build_fleet_seconds_by_hull_28d(fetcher),
        "x_vs_time_by_hull_28d": build_x_vs_time_by_hull_28d(fetcher),
    }
