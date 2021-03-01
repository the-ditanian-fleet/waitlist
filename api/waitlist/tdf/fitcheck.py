from typing import List, Dict, Set, Optional, Any
import yaml
from ..eft2dna import split_dna
from ..data.evedb import id_of, name_of
from . import skills, fits, modules

BANNED_MODULES = modules.load_banned()

with open("./waitlist/tdf/categories.yaml", "r") as fileh:
    _yamldata = yaml.safe_load(fileh)
    CATEGORIES: Dict[str, str] = _yamldata["categories"]
    CATEGORY_RULES = [
        (id_of(rule["item"]), rule["category"]) for rule in _yamldata["rules"]
    ]


class FitCheckResult:  # pylint: disable=too-few-public-methods
    def __init__(self) -> None:
        self.approved = False
        self.tags: Set[str] = set()
        self.category: str = "starter"  # Default
        self.errors: List[str] = []
        self.fit_check: Dict[str, Any] = {}


class FitChecker:  # pylint: disable=too-many-instance-attributes
    def __init__(self, dna: str, skilldata: Dict[int, int], implants: List[int]):
        self.ship, self.modules, self.cargo = split_dna(dna)
        self.skills = skilldata
        self.implants = implants

        self.result = FitCheckResult()
        self.base_implants: Optional[str] = None
        self.fit: Optional[fits.FitSpec] = None
        self.fitcheck: Optional[fits.CheckResult] = None
        self.disable_approval = False

    def _add_tag(self, tag: str) -> None:
        self.result.tags.add(tag)

    def check_skills(self) -> None:
        if not skills.has_minimum_comps(self.skills):
            self.result.errors.append("Missing minimum Armor Compensation skills")
        elif not skills.skillcheck(self.ship, self.skills, "min"):
            self.disable_approval = True
            self._add_tag("NO-MINSKILLS")
        elif skills.skillcheck(self.ship, self.skills, "gold"):
            self._add_tag("GOLD-SKILLS")
        elif skills.skillcheck(self.ship, self.skills, "elite"):
            self._add_tag("ELITE-SKILLS")

    def check_implants(self) -> None:  # pylint: disable=too-many-branches
        have_slots = {7: False, 8: False, 9: False, 10: False}

        # Base set, slot 1-6
        if (
            id_of("High-grade Amulet Alpha") in self.implants
            and id_of("High-grade Amulet Beta") in self.implants
            and id_of("High-grade Amulet Gamma") in self.implants
            and id_of("High-grade Amulet Delta") in self.implants
            and id_of("High-grade Amulet Epsilon") in self.implants
        ):
            if id_of("% WS-618", fuzzy=True) in self.implants:
                self.base_implants = "HYBRID"
            elif id_of("High-grade Amulet Omega") in self.implants:
                self.base_implants = "AMULET"

        if (
            id_of("High-grade Ascendancy Alpha") in self.implants
            and id_of("High-grade Ascendancy Beta") in self.implants
            and id_of("High-grade Ascendancy Gamma") in self.implants
            and id_of("High-grade Ascendancy Delta") in self.implants
            and id_of("High-grade Ascendancy Epsilon") in self.implants
        ):
            if id_of("% WS-618", fuzzy=True) in self.implants:
                self.base_implants = "WARPSPEED"
            elif id_of("High-grade Ascendancy Omega") in self.implants:
                self.base_implants = "WARPSPEED"

        # Slot 7
        for implant in ["Ogdin's Eye %", "% MR-706"]:
            if id_of(implant, fuzzy=True) in self.implants:
                have_slots[7] = True

        # Slot 8
        if id_of("% EM-806", fuzzy=True) in self.implants:
            have_slots[8] = True
        if id_of("% MR-807", fuzzy=True) in self.implants and self.ship == id_of(
            "Vindicator"
        ):
            have_slots[8] = True

        # Slot 9
        for implant in [
            "% RF-906",
            "% SS-906",
            "Pashan's Turret Customization Mindlink",
        ]:
            if id_of(implant, fuzzy=True) in self.implants:
                have_slots[9] = True

        # Slot 10
        if self.ship in [id_of("Nightmare"), id_of("Paladin")]:
            if id_of("% LE-1006", fuzzy=True) in self.implants:
                have_slots[10] = True
            if id_of("Pashan's Turret Handling Mindlink") in self.implants:
                have_slots[10] = True
        elif (
            self.ship == id_of("Vindicator")
            and id_of("% LH-1006", fuzzy=True) in self.implants
        ):
            have_slots[10] = True
        elif self.ship == id_of("Leshak"):
            if id_of("% HG-1006", fuzzy=True) in self.implants:
                have_slots[10] = True
            if id_of("% HG-1008", fuzzy=True) in self.implants:
                have_slots[10] = True

        if self.base_implants and all(have_slots.values()):
            self._add_tag("%s1-10" % self.base_implants)

    def check_fit(self) -> None:
        can_amulet = self.base_implants == "AMULET"
        can_hybrid = self.base_implants in ["AMULET", "HYBRID"]
        self.fit = fits.best_match(
            self.ship, self.modules, self.cargo, can_amulet, can_hybrid
        )
        self.result.fit_check["name"] = self.fit.fitname if self.fit else None
        if not self.fit:
            return

        self.fitcheck = self.fit.check(self.modules, self.cargo)
        if self.fitcheck.is_ok and self.fit.is_elite and not self.fitcheck.downgraded:
            self._add_tag("ELITE-FIT")

        # Export the results of the fit check
        fit_check_ids: Set[int] = set()
        if self.fitcheck.missing:
            self.result.fit_check["missing"] = self.fitcheck.missing
            fit_check_ids.update(self.fitcheck.missing.keys())
        if self.fitcheck.extra:
            self.result.fit_check["extra"] = self.fitcheck.extra
            fit_check_ids.update(self.fitcheck.extra.keys())
        if self.fitcheck.downgraded:
            self.result.fit_check["downgraded"] = self.fitcheck.downgraded
            fit_check_ids.update(self.fitcheck.downgraded.keys())
            for downgrade in self.fitcheck.downgraded.values():
                fit_check_ids.update(downgrade.keys())
        self.result.fit_check["_ids"] = sorted(list(fit_check_ids))

    def check_category(self) -> None:
        if "NO-MINSKILLS" in self.result.tags:
            self.result.category = "starter"
            return

        items = {self.ship: 1, **self.modules}
        for item_id, then_category in CATEGORY_RULES:
            if items.get(item_id, 0):
                self.result.category = then_category
                return

    def check_banned_modules(self) -> None:
        for module_id in BANNED_MODULES:
            if self.modules.get(module_id, 0):
                self.result.errors.append(
                    "Fit contains banned module: %s" % name_of(module_id)
                )

    def check_logi_implants(self) -> None:
        if self.ship in [id_of("Nestor"), id_of("Guardian")]:
            if not id_of("% EM-806", fuzzy=True) in self.implants:
                self.disable_approval = True
                self._add_tag("NO-EM-806")

    def set_approval(self) -> None:
        if self.disable_approval:
            return
        if self.fitcheck and self.fitcheck.is_ok:
            self.result.approved = True

    def merge_tags(self) -> None:
        tags = self.result.tags  # Alias, not a copy
        if "ELITE-FIT" in tags:
            if "ELITE-SKILLS" in tags:
                tags.remove("ELITE-FIT")
                tags.remove("ELITE-SKILLS")
                tags.add("ELITE")
            if "GOLD-SKILLS" in tags:
                tags.remove("ELITE-FIT")
                tags.remove("GOLD-SKILLS")
                tags.add("ELITE-GOLD")

    def run(self) -> FitCheckResult:
        self.check_skills()
        self.check_implants()
        self.check_fit()
        self.check_category()
        self.check_banned_modules()
        self.check_logi_implants()
        self.set_approval()
        self.merge_tags()
        return self.result


def check_fit(
    dna: str, skilldata: Dict[int, int], implants: List[int]
) -> FitCheckResult:
    return FitChecker(dna, skilldata, implants).run()
