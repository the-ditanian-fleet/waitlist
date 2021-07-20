import React from "react";
import { Box } from "./Box";
import styled from "styled-components";
import { apiCall, toaster } from "../api";
import _ from "lodash";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaste } from "@fortawesome/free-solid-svg-icons";
import { ToastContext } from "../contexts";

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
    const apiResult = await apiCall(
      "/api/module/info?" + missing.map((id) => `id=${id}`).join("&"),
      {}
    );
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
DOM.Slot = styled.div`
  margin-bottom: 0.5em;
`;
DOM.Line = styled.div`
  display: flex;
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

function filterSlots(counts, moduleInfo) {
  if (!moduleInfo) return null;
  var slots = {};
  slotOrder.forEach((slot) => (slots[slot] = {}));
  for (const [moduleId, count] of Object.entries(counts)) {
    const realModuleId = parseInt(moduleId); // Will totally strip off the trailing "_"
    var slot;
    const thisModule = moduleInfo[realModuleId] || {};
    if (moduleId.endsWith("_")) {
      slot = "cargo";
    } else if (thisModule.slot) {
      slot = thisModule.slot;
    } else {
      slot = "cargo";
    }
    if (!(slot in slots)) {
      slot = "cargo";
    }
    if (!(realModuleId in slots[slot])) {
      slots[slot][realModuleId] = 0;
    }
    slots[slot][realModuleId] += count;
  }
  return slots;
}

function copyableFit(hull, slots, moduleInfo) {
  var fit = `[${moduleInfo[hull].name}, ${moduleInfo[hull].name}]\n`;
  for (const slot of slotOrder) {
    for (const [module, count] of Object.entries(slots[slot])) {
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

export function DNADisplay({ dna }) {
  const toastContext = React.useContext(ToastContext);
  const [hull, ids, counts] = React.useMemo(() => parseDna(dna), [dna]);
  const moduleInfo = useModuleInfo(ids);
  const slots = React.useMemo(() => filterSlots(counts, moduleInfo), [counts, moduleInfo]);

  if (!moduleInfo || !moduleInfo[hull]) {
    return (
      <div>
        <em>Loading fit info</em>
      </div>
    );
  }

  return (
    <div>
      <DOM.Hull>
        <DOM.Hull.Image
          src={`https://imageserver.eveonline.com/Type/${hull}_64.png`}
          alt={moduleInfo[hull].name}
        />
        <DOM.Hull.Name>{moduleInfo[hull].name}</DOM.Hull.Name>
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
      {Object.entries(slots).map(([slot, modules]) => (
        <DOM.Slot key={slot}>
          {Object.entries(modules).map(([moduleId, count]) => (
            <DOM.Line key={moduleId}>
              <DOM.Line.Image
                src={`https://imageserver.eveonline.com/Type/${moduleId}_32.png`}
                alt={(moduleInfo[moduleId] || {}).name || null}
              />
              <DOM.Line.Count>{count}</DOM.Line.Count>
              <DOM.Line.ModuleName>{(moduleInfo[moduleId] || {}).name || null}</DOM.Line.ModuleName>
            </DOM.Line>
          ))}
        </DOM.Slot>
      ))}
    </div>
  );
}

const FitAnalysisDOM = styled.div`
  margin-bottom: 1em;

  h2 {
    font-size: 1.5em;
  }
  h3 {
    font-size: 1.2em;
    margin-top: 0.5em;
  }
  strong {
    font-weight: bold;
  }
  p img {
    height: 1em;
    vertical-align: middle;
  }
`;

function FitAnalysis({ source }) {
  if (!source) {
    return (
      <FitAnalysisDOM>
        <h2>UNKNOWN_FIT</h2>
      </FitAnalysisDOM>
    );
  }

  const idLookup = source._ids || {};
  const analysis = [];
  if (source.missing || source.extra || source.downgraded) {
    analysis.push(<h3 key="head-fit">Fit</h3>);
  }
  _.forEach(source.missing || {}, (count, itemId) => {
    analysis.push(
      <p key={itemId}>
        <img
          src={`https://imageserver.eveonline.com/Type/${itemId}_32.png`}
          alt={idLookup[itemId]}
        />{" "}
        Missing <strong>{idLookup[itemId]}</strong>: {count}
      </p>
    );
  });
  _.forEach(source.extra, (count, itemId) => {
    analysis.push(
      <p key={itemId}>
        <img
          src={`https://imageserver.eveonline.com/Type/${itemId}_32.png`}
          alt={idLookup[itemId]}
        />{" "}
        Extra <strong>{idLookup[itemId]}</strong>: {count}
      </p>
    );
  });
  _.forEach(source.downgraded || {}, (downgrades, originalItem) => {
    _.forEach(downgrades, (count, newItem) => {
      analysis.push(
        <p key={`${originalItem} ${newItem}`}>
          <img
            src={`https://imageserver.eveonline.com/Type/${originalItem}_32.png`}
            alt={idLookup[originalItem]}
          />{" "}
          Downgraded <strong>{idLookup[originalItem]}</strong> to{" "}
          <strong>{idLookup[newItem]}</strong>: {count}
        </p>
      );
    });
  });
  if (source.cargo_missing) {
    analysis.push(<h3 key="head-cargo">Cargo</h3>);
  }
  _.forEach(source.cargo_missing || {}, (count, itemId) => {
    analysis.push(
      <p key={itemId}>
        <img
          src={`https://imageserver.eveonline.com/Type/${itemId}_32.png`}
          alt={idLookup[itemId]}
        />{" "}
        Missing <strong>{idLookup[itemId]}</strong>: {count}
      </p>
    );
  });
  return (
    <FitAnalysisDOM>
      {source.name ? <h2>{source.name}</h2> : <h2>UNKNOWN_FIT</h2>}
      {analysis}
    </FitAnalysisDOM>
  );
}

function ImplantDisplay({ implants }) {
  const podDna = implants.map((implant) => `${implant};1`).join(":");
  return <DNADisplay dna={`670:${podDna}::`} />;
}

export function FitDisplay({ fit }) {
  return (
    <Box>
      <FitAnalysis source={fit.fit_analysis} />
      <div style={{ display: "flex" }}>
        <DNADisplay dna={fit.dna} />
        {fit.implants ? <ImplantDisplay implants={fit.implants} /> : null}
      </div>
    </Box>
  );
}
