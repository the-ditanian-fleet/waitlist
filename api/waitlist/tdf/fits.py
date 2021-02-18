from typing import List, Dict, Tuple, Optional
import re
from ..eft2dna import split_dna
from . import modules

RE_FIT = re.compile(r'<a href="fitting:([0-9:;_]+)">([^<]+)</a>')

ALTERNATIVES = modules.load_alternatives()
IDENTIFICATION = modules.load_identification()
BANNED = modules.load_banned()


def _alts(module_id: int) -> List[Tuple[int, bool]]:
    if module_id in ALTERNATIVES:
        return ALTERNATIVES[module_id]
    return [(module_id, False)]


class CheckResult:  # pylint: disable=too-few-public-methods
    def __init__(
        self,
        spec: "FitSpec",
        missing: Dict[int, int],
        extra: Dict[int, int],
        downgraded: Dict[int, Dict[int, int]],
    ):
        self.spec = spec
        self.missing = missing
        self.extra = extra
        self.downgraded = downgraded
        self.is_ok = not missing and not extra


class FitSpec:  # pylint: disable=too-many-instance-attributes
    def __init__(self, fitname: str, dna: str):
        self.fitname = fitname
        self.dna = dna
        self.ship, self.modules, self.cargo = split_dna(dna)
        self.is_elite = "elite" in fitname.lower()
        self.is_hybrid = "hybrid" in fitname.lower()
        self.is_amulet = "amulet" in fitname.lower()
        self.identification = self.build_identification()
        self.score = self.build_score()

    def build_identification(self) -> Dict[int, int]:
        id_hash: Dict[int, int] = {}
        for module_id in IDENTIFICATION:
            for alternative, _is_downgrade in _alts(module_id):
                count = self.modules.get(alternative, 0)
                if count:
                    id_hash.setdefault(alternative, 0)
                    id_hash[alternative] += count

        return id_hash

    def build_score(self) -> int:
        score = 0
        if "elite" in self.fitname.lower():
            score += 500
        if "advanced" in self.fitname.lower():
            score += 400
        if "basic" in self.fitname.lower():
            score += 300
        if "starter" in self.fitname.lower():
            score += 200
        if "amulet" in self.fitname.lower():
            score += 20
        if "hybrid" in self.fitname.lower():
            score += 10
        return score

    def match(self, mods: Dict[int, int], _cargo: Dict[int, int]) -> bool:
        remaining_modules = {**mods}
        for module_id, count in self.identification.items():
            for alternative, _is_downgrade in _alts(module_id):
                if alternative in remaining_modules:
                    sub = min(remaining_modules[alternative], count)
                    count -= sub
                    remaining_modules[alternative] -= count
            if count > 0:
                return False
        return True

    def check(self, mods: Dict[int, int], _cargo: Dict[int, int]) -> CheckResult:
        remaining_modules = {**mods}
        lacking_modules = {}
        downgraded: Dict[int, Dict[int, int]] = {}
        for module_id_on_fit, count in self.modules.items():
            for module_id, is_downgrade in _alts(module_id_on_fit):
                if module_id in remaining_modules:
                    sub = min(remaining_modules[module_id], count)
                    count -= sub
                    remaining_modules[module_id] -= sub
                    if is_downgrade:
                        downgraded.setdefault(module_id_on_fit, {}).setdefault(
                            module_id, 0
                        )
                        downgraded[module_id_on_fit][module_id] += sub
                    if not remaining_modules[module_id]:
                        del remaining_modules[module_id]
            if count > 0:
                lacking_modules[module_id_on_fit] = count
        return CheckResult(self, lacking_modules, remaining_modules, downgraded)


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
    possible_fits = FITS.get(ship)
    if not possible_fits:
        return None

    matches = []
    for maybe_this_one in possible_fits:
        if maybe_this_one.match(mods, cargo):
            matches.append(maybe_this_one)

    if not can_amulet:
        matches = list(filter(lambda match: not match.is_amulet, matches))
    if not can_hybrid:
        matches = list(filter(lambda match: not match.is_hybrid, matches))

    checks_out = list(filter(lambda match: match.check(mods, cargo).is_ok, matches))
    if checks_out:
        matches = checks_out

    matches = list(sorted(matches, key=lambda match: match.score))

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
            if not result or not result.is_ok:
                raise Exception(
                    "We rejected our own fit: %s %s %s"
                    % (result.missing, result.extra, result.downgraded)
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
