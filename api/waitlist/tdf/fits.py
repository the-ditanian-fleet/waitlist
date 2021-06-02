from typing import List, Dict, Tuple, Optional
import re
from ..eft2dna import split_dna
from . import modules

RE_FIT = re.compile(r'<a href="fitting:([0-9:;_]+)">([^<]+)</a>')

ALTERNATIVES = modules.load_alternatives()
IDENTIFICATION = modules.load_identification(ALTERNATIVES)
BANNED = modules.load_banned()


def _alts(module_id: int) -> List[Tuple[int, int]]:
    if module_id in ALTERNATIVES:
        return ALTERNATIVES[module_id]
    return [(module_id, 0)]


def _module_score(module_id: int) -> int:
    if module_id in IDENTIFICATION:
        return 100
    return 1


class CheckResult:  # pylint: disable=too-few-public-methods,too-many-arguments,too-many-instance-attributes
    def __init__(
        self,
        spec: "FitSpec",
        missing: Dict[int, int],
        extra: Dict[int, int],
        downgraded: Dict[int, Dict[int, int]],
        upgraded: Dict[int, Dict[int, int]],
        cargo_missing: Dict[int, int],
    ):
        self.spec = spec
        self.missing = missing
        self.extra = extra
        self.downgraded = downgraded
        self.upgraded = upgraded
        self.cargo_missing = cargo_missing
        self.fit_ok = not missing and not extra and not downgraded
        self.cargo_ok = not cargo_missing
        self.score = 0

        # Missing modules: it is definitely not there
        for module_id, count in missing.items():
            self.score -= _module_score(module_id) * count * 12
        # Extra: does this belong here?
        for module_id, count in extra.items():
            self.score -= _module_score(module_id) * count * 8
        # Downgraded. Didn't have money?
        for module_id, changes in downgraded.items():
            for _new_module_id, count in changes.items():
                self.score -= _module_score(module_id) * count * 5
        # Upgraded? Either rich, or not actually part of our fit
        for module_id, changes in upgraded.items():
            for _new_module_id, count in changes.items():
                self.score -= _module_score(module_id) * count * 1


def _diff(
    expect: Dict[int, int], have: Dict[int, int]
) -> Tuple[
    Dict[int, int], Dict[int, int], Dict[int, Dict[int, int]], Dict[int, Dict[int, int]]
]:
    remaining = {**have}
    missing = {**expect}
    downgraded: Dict[int, Dict[int, int]] = {}
    upgraded: Dict[int, Dict[int, int]] = {}

    # First pass: only look at meta_diff==0
    for module_id_on_fit in missing.keys():
        for module_id, meta_diff in _alts(module_id_on_fit):
            if meta_diff:
                continue
            sub = min(remaining.get(module_id, 0), missing[module_id_on_fit])
            if not sub:
                continue
            remaining[module_id] -= sub
            missing[module_id_on_fit] -= sub

    # Second pass: take any meta level
    for module_id_on_fit in missing.keys():
        for module_id, meta_diff in _alts(module_id_on_fit):
            sub = min(remaining.get(module_id, 0), missing[module_id_on_fit])
            if not sub:
                continue
            remaining[module_id] -= sub
            missing[module_id_on_fit] -= sub
            if meta_diff < 0:
                downgraded.setdefault(module_id_on_fit, {}).setdefault(module_id, 0)
                downgraded[module_id_on_fit][module_id] += sub
            elif meta_diff > 0:
                upgraded.setdefault(module_id_on_fit, {}).setdefault(module_id, 0)
                upgraded[module_id_on_fit][module_id] += sub

    missing = {module_id: count for module_id, count in missing.items() if count}
    remaining = {module_id: count for module_id, count in remaining.items() if count}

    return missing, remaining, downgraded, upgraded


class FitSpec:  # pylint: disable=too-few-public-methods,too-many-instance-attributes
    def __init__(self, fitname: str, dna: str):
        self.fitname = fitname
        self.dna = dna
        self.ship, self.modules, self.cargo = split_dna(dna)
        self.is_elite = "elite" in fitname.lower()
        self.is_advanced = "advanced" in fitname.lower()
        self.is_basic = "basic" in fitname.lower()
        self.is_starter = "starter" in fitname.lower()
        self.is_hybrid = "hybrid" in fitname.lower()
        self.is_amulet = "amulet" in fitname.lower()

    def check(self, mods: Dict[int, int], cargo: Dict[int, int]) -> CheckResult:
        (
            missing_modules,
            remaining_modules,
            downgraded_modules,
            upgraded_modules,
        ) = _diff(self.modules, mods)

        (
            missing_cargo,
            _remaining_cargo,
            downgraded_cargo,
            _upgraded_cargo,
        ) = _diff(self.cargo, cargo)

        cargo_missing_total: Dict[int, int] = {**missing_cargo}
        for module_id, downgrade_summary in downgraded_cargo.items():
            # Downgrading cargo isn't a thing - just class it as missing if we do go into this path
            cargo_missing_total.setdefault(module_id, 0)
            cargo_missing_total[module_id] += sum(downgrade_summary.values())

        # For anything that we require a large quantity of, allow 70% leeway
        for module_id, missing_count in cargo_missing_total.copy().items():
            if (
                self.cargo[module_id] >= 10
                and missing_count <= 0.7 * self.cargo[module_id]
            ):
                del cargo_missing_total[module_id]

        return CheckResult(
            self,
            missing_modules,
            remaining_modules,
            downgraded_modules,
            upgraded_modules,
            cargo_missing_total,
        )


def load_fitspecs() -> Dict[int, List[FitSpec]]:
    result: Dict[int, List[FitSpec]] = {}
    with open("waitlist/tdf/fits.dat", "r") as fileh:
        fits = fileh.read()
        for dna, fitname in RE_FIT.findall(fits):
            spec = FitSpec(fitname, dna)
            result.setdefault(spec.ship, []).append(spec)
    return result


FITS: Dict[int, List[FitSpec]] = load_fitspecs()


def best_match(
    ship: int,
    mods: Dict[int, int],
    cargo: Dict[int, int],
    can_amulet: bool,
    can_hybrid: bool,
) -> Optional[FitSpec]:
    matches = FITS.get(ship, [])

    if not can_amulet:
        matches = list(filter(lambda match: not match.is_amulet, matches))
    if not can_hybrid:
        matches = list(filter(lambda match: not match.is_hybrid, matches))

    matches = list(sorted(matches, key=lambda match: match.check(mods, cargo).score))

    if matches:
        return matches[-1]
    return None


def _main() -> None:
    check_count = 0
    for _ship_id, fits in FITS.items():
        for fit in fits:
            the_match = best_match(
                fit.ship,
                fit.modules,
                fit.cargo,
                fit.is_amulet,
                fit.is_hybrid or fit.is_amulet,
            )
            if not the_match:
                raise Exception("Did not recognize our own ship! %s" % fit.fitname)
            if the_match.fitname != fit.fitname:
                raise Exception(
                    "We recognized the wrong ship! %s vs %s"
                    % (fit.fitname, the_match.fitname)
                )
            result = the_match.check(fit.modules, fit.cargo)
            if not result or not result.fit_ok or not result.cargo_ok:
                raise Exception(
                    "We rejected our own fit: %s %s %s %s"
                    % (
                        result.missing,
                        result.extra,
                        result.downgraded,
                        result.cargo_missing,
                    )
                )
            if the_match.fitname != fit.fitname:
                raise Exception(
                    "We mismatched our own fit: %s matched %s"
                    % (fit.fitname, the_match.fitname)
                )
            check_count += 1
    print("Successfully checked %d fits" % check_count)


if __name__ == "__main__":
    _main()
