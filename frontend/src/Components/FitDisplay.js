import React from "react";
import styled from "styled-components";
import { apiCall, toaster } from "../api";
import _ from "lodash";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaste } from "@fortawesome/free-solid-svg-icons";
import { ToastContext } from "../contexts";
import { Badge } from "./Badge";

const slotOrder = ["high", "med", "low", "rig", "other", "drone", "cargo"];

var modulePreload = null;
var moduleCache = {};

async function fetchAndCacheModules(commaSeparatedIds) {
  const modules = commaSeparatedIds.split(",");

  // Start by fetching the preload dataset, which has some common items
  if (!modulePreload) {
    modulePreload = apiCall("/api/module/preload", {}).catch((err) => (modulePreload = null));
  }
  for (const [module, info] of Object.entries(await modulePreload)) {
    moduleCache[module] = info;
  }

  // Figure out what we're missing
  var missing = [];
  for (const module of modules) {
    if (!(module in moduleCache)) {
      missing.push(module);
    }
  }

  // Missing anything? Fetch it by ID
  if (missing && missing.length) {
    const apiResult = await apiCall("/api/module/info?ids=" + missing.join(","), {});
    for (const [module, info] of Object.entries(apiResult)) {
      moduleCache[module] = info;
    }
  }

  // Build the result
  var result = {};
  for (const module of modules) {
    result[module] = module in moduleCache ? moduleCache[module] : null;
  }

  return result;
}

function useModuleInfo(ids) {
  const [result, setResult] = React.useState(null);
  const commaSeparated = Array.from(ids).sort().join(",");

  React.useEffect(() => {
    var cancelled = false;
    fetchAndCacheModules(commaSeparated).then((data) => !cancelled && setResult(data));
    return () => (cancelled = true);
  }, [commaSeparated, setResult]);

  return result || {};
}

const DOM = {};
DOM.Hull = styled.div`
  display: flex;
  align-items: center;
  font-size: 1.2em;
  font-weight: 600;
  margin-bottom: 0.5em;
`;
DOM.Hull.Image = styled.img`
  height: 2em;
  width: 2em;
  margin-right: 2em;
`;
DOM.Hull.Name = styled.span``;
DOM.Hull.Copy = styled.div`
  margin-left: auto;
  margin-right: 2em;
  cursor: pointer;
  font-size: 0.8em;
`;
DOM.Warning = styled.div`
  margin: 1em 0;
`;
DOM.Slot = styled.div`
  margin-bottom: 0.5em;
`;
DOM.Line = styled.div`
  display: flex;
  ${(props) =>
    ({
      have: ``,
      missing: `
        background-color: ${props.theme.colors.danger.color};
        color: ${props.theme.colors.danger.text};
        text-decoration: line-through;
      `,
      extra: `
        background-color: ${props.theme.colors.success.color};
        color: ${props.theme.colors.success.text};
      `,
      downgraded_orig: `
        background-color: ${props.theme.colors.warning.color};
        color: ${props.theme.colors.warning.text};
        text-decoration: line-through;
      `,
      downgraded_new: `
        background-color: ${props.theme.colors.warning.color};
        color: ${props.theme.colors.warning.text};
      `,
    }[props.group])}

  > * {
    margin-right: 0.5em;
  }
`;
DOM.Line.Image = styled.img`
  height: 1.5em;
  width: 1.5em;
`;
DOM.Line.Count = styled.span`
  min-width: 1em;
`;
DOM.Line.ModuleName = styled.span``;

function parseDna(dna) {
  const [hull, ...modules] = dna.split(/:/);
  var ids = new Set();
  var counts = {};
  ids.add(parseInt(hull));
  for (const module of modules) {
    if (!module) continue;

    const [moduleId, count] = module.split(/;/);
    ids.add(parseInt(moduleId));

    if (!(moduleId in counts)) counts[moduleId] = 0;
    counts[moduleId] += parseInt(count);
  }
  const idsList = Array.from(ids).sort();
  return [hull, idsList, counts];
}

function extractAnalysisIds(analysis) {
  if (!analysis) return [];

  var ids = new Set();
  for (const group of ["missing", "extra", "cargo_missing"]) {
    if (!analysis[group]) continue;
    Object.keys(analysis[group]).forEach((id) => ids.add(id));
  }
  for (const group of ["downgraded", "upgraded"]) {
    if (!analysis[group]) continue;
    Object.entries(analysis[group]).forEach(([origModuleId, newItems]) => {
      ids.add(origModuleId);
      Object.keys(newItems).forEach((id) => ids.add(id));
    });
  }

  return Array.from(ids).sort();
}

function getSlot(moduleId, moduleInfo) {
  if (moduleId.endsWith("_")) return "cargo";
  const thisModule = moduleInfo[parseInt(moduleId)] || {};
  if (thisModule.slot) return thisModule.slot;
  return "cargo";
}

function _addCount(destination, moduleId, count) {
  const realModuleId = parseInt(moduleId);
  if (!(realModuleId in destination)) {
    destination[realModuleId] = count;
  } else {
    destination[realModuleId] += count;
    if (!destination[realModuleId]) {
      delete destination[realModuleId];
    }
  }
}

function _addCount2(destination, origModuleId, newModuleId, count) {
  const realOrigModuleId = parseInt(origModuleId);
  const realNewModuleId = parseInt(newModuleId);
  if (!(realOrigModuleId in destination)) {
    destination[realOrigModuleId] = {};
  }
  if (!(realNewModuleId in destination[realOrigModuleId])) {
    destination[realOrigModuleId][realNewModuleId] = 0;
  }
  destination[realOrigModuleId][realNewModuleId] += count;
  if (!destination[realOrigModuleId][realNewModuleId]) {
    delete destination[realOrigModuleId][realNewModuleId];
  }
  if (_.isEmpty(destination[realOrigModuleId])) {
    delete destination[realOrigModuleId];
  }
}

function filterSlots(counts, analysis, moduleInfo) {
  if (!moduleInfo) return null;

  var slots = {};
  slotOrder.forEach(
    (slot) => (slots[slot] = { have: {}, match: {}, missing: {}, extra: {}, downgraded: {} })
  );
  for (const [moduleId, count] of Object.entries(counts)) {
    const slot = getSlot(moduleId, moduleInfo);
    _addCount(slots[slot].have, moduleId, count);
    _addCount(slots[slot].match, moduleId, count);
  }
  if (analysis && analysis.cargo_missing) {
    for (const [moduleId, count] of Object.entries(analysis.cargo_missing)) {
      _addCount(slots["cargo"].missing, moduleId, count);
    }
  }
  if (analysis && analysis.missing) {
    for (const [moduleId, count] of Object.entries(analysis.missing)) {
      const slot = getSlot(moduleId, moduleInfo);
      _addCount(slots[slot].missing, moduleId, count);
    }
  }
  if (analysis && analysis.extra) {
    for (const [moduleId, count] of Object.entries(analysis.extra)) {
      const slot = getSlot(moduleId, moduleInfo);
      _addCount(slots[slot].match, moduleId, -count);
      _addCount(slots[slot].extra, moduleId, count);
    }
  }
  if (analysis && analysis.downgraded) {
    for (const [origModuleId, newItems] of Object.entries(analysis.downgraded)) {
      const slot = getSlot(origModuleId, moduleInfo);
      for (const [newModuleId, count] of Object.entries(newItems)) {
        _addCount(slots[slot].match, newModuleId, -count);
        _addCount2(slots[slot].downgraded, origModuleId, newModuleId, count);
      }
    }
  }
  return slots;
}

function copyableFit(hull, slots, moduleInfo) {
  var fit = `[${moduleInfo[hull].name}, ${moduleInfo[hull].name}]\n`;
  for (const slot of slotOrder) {
    for (const [module, count] of Object.entries(slots[slot].have)) {
      const moduleName = module in moduleInfo ? moduleInfo[module].name : module;
      if (slot === "cargo" || slot === "drone") {
        fit += `${moduleName} x${count}\n`;
      } else {
        for (var i = 0; i < count; i++) {
          fit += `${moduleName}\n`;
        }
      }
    }
    fit += "\n";
  }

  return fit;
}

function DisplaySlot({ isDiff, groups, moduleInfo }) {
  const showGroups = isDiff ? ["match", "missing", "extra"] : ["have"];
  return (
    <DOM.Slot>
      {showGroups.map((group) =>
        Object.entries(groups[group]).map(([moduleId, count]) => (
          <DOM.Line key={moduleId} group={group}>
            <DOM.Line.Image
              src={`https://images.evetech.net/types/${moduleId}/icon?size=64`}
              alt={(moduleInfo[moduleId] || {}).name || null}
            />
            <DOM.Line.Count>{count}</DOM.Line.Count>
            <DOM.Line.ModuleName>{(moduleInfo[moduleId] || {}).name || null}</DOM.Line.ModuleName>
          </DOM.Line>
        ))
      )}
      {isDiff &&
        Object.entries(groups.downgraded).map(([origModuleId, newItems]) =>
          Object.entries(newItems).map(([newModuleId, count]) => (
            <React.Fragment key={`${origModuleId} ${newModuleId}`}>
              <DOM.Line group="downgraded_orig">
                <DOM.Line.Image
                  src={`https://images.evetech.net/types/${origModuleId}/icon?size=64`}
                  alt={(moduleInfo[origModuleId] || {}).name || null}
                />
                <DOM.Line.Count>{count}</DOM.Line.Count>
                <DOM.Line.ModuleName>
                  {(moduleInfo[origModuleId] || {}).name || null}
                </DOM.Line.ModuleName>
              </DOM.Line>
              <DOM.Line group="downgraded_new">
                <DOM.Line.Image
                  src={`https://images.evetech.net/types/${newModuleId}/icon?size=64`}
                  alt={(moduleInfo[newModuleId] || {}).name || null}
                />
                <DOM.Line.Count>{count}</DOM.Line.Count>
                <DOM.Line.ModuleName>
                  {(moduleInfo[newModuleId] || {}).name || null}
                </DOM.Line.ModuleName>
              </DOM.Line>
            </React.Fragment>
          ))
        )}
    </DOM.Slot>
  );
}

export function DNADisplay({ dna, analysis = null, name = null }) {
  const toastContext = React.useContext(ToastContext);
  const [hull, ids, counts] = React.useMemo(() => parseDna(dna), [dna]);
  const allIds = React.useMemo(() => ids.concat(extractAnalysisIds(analysis)), [ids, analysis]);
  const moduleInfo = useModuleInfo(allIds);
  const slots = React.useMemo(
    () => filterSlots(counts, analysis, moduleInfo),
    [counts, analysis, moduleInfo]
  );

  if (!moduleInfo || !moduleInfo[hull]) {
    return (
      <div>
        <em>Loading fit info</em>
      </div>
    );
  }

  let displayName = name ? name : analysis && analysis.name ? analysis.name : moduleInfo[hull].name;

  return (
    <div>
      <DOM.Hull>
        <DOM.Hull.Image
          src={`https://images.evetech.net/types/${hull}/icon?size=64`}
          alt={moduleInfo[hull].name}
        />
        <DOM.Hull.Name>{displayName}</DOM.Hull.Name>
        <DOM.Hull.Copy
          title="Copy to clipboard"
          onClick={(evt) => {
            toaster(
              toastContext,
              navigator.clipboard
                .writeText(copyableFit(hull, slots, moduleInfo))
                .then((success) => "Copied to clipboard")
            );
          }}
        >
          <FontAwesomeIcon fixedWidth icon={faPaste} />
        </DOM.Hull.Copy>
      </DOM.Hull>
      {analysis && !analysis.name ? (
        <DOM.Warning>
          <Badge variant="danger">Fit could not be automatically checked!</Badge>
        </DOM.Warning>
      ) : null}
      {Object.entries(slots).map(([slot, groups]) => (
        <DisplaySlot key={slot} isDiff={analysis != null} groups={groups} moduleInfo={moduleInfo} />
      ))}
    </div>
  );
}

export function ImplantDisplay({ implants, ...props }) {
  const podDna = implants.map((implant) => `${implant};1`).join(":");
  return <DNADisplay dna={`670:${podDna}::`} {...props} />;
}

export function FitDisplay({ fit }) {
  return (
    <div style={{ display: "flex" }}>
      <div style={{ margin: "0 0.5em" }}>
        <DNADisplay dna={fit.dna} analysis={fit.fit_analysis || {}} />
      </div>
      {fit.implants ? (
        <div style={{ margin: "0 0.5em" }}>
          <ImplantDisplay implants={fit.implants} />
        </div>
      ) : null}
    </div>
  );
}
