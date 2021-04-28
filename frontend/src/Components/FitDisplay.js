import React from "react";
import { Box } from "./Box";
import styled from "styled-components";
import _ from "lodash";

export function FitDisplay({ fit }) {
  return (
    <Box>
      <FitAnalysis source={fit.fit_analysis} />
      <div style={{ display: "flex" }}>
        <ShipDisplay name={fit.hull.name} dna={fit.dna} />
        {fit.implants ? <ImplantDisplay implants={fit.implants} /> : null}
      </div>
    </Box>
  );
}

function ShipDisplay({ name, dna }) {
  React.useEffect(() => {
    if (window.eveui) {
      window.eveui.expand();
    }
  });

  return (
    <div>
      <a data-eveui-expand href={`fitting:${dna}`}>
        {name}
      </a>
    </div>
  );
}

const FitAnalysisDOM = styled.div`
  margin-bottom: 1em;

  h2 {
    font-size: 1.5em;
  }
  strong {
    font-weight: bold;
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
  _.forEach(source.missing || {}, (count, itemId) => {
    analysis.push(
      <p key={itemId}>
        Missing <strong>{idLookup[itemId]}</strong>: {count}
      </p>
    );
  });
  _.forEach(source.extra, (count, itemId) => {
    analysis.push(
      <p key={itemId}>
        Extra <strong>{idLookup[itemId]}</strong>: {count}
      </p>
    );
  });
  _.forEach(source.downgraded || {}, (downgrades, originalItem) => {
    _.forEach(downgrades, (count, newItem) => {
      analysis.push(
        <p key={`${originalItem} ${newItem}`}>
          Downgraded <strong>{idLookup[originalItem]}</strong> to{" "}
          <strong>{idLookup[newItem]}</strong>: {count}
        </p>
      );
    });
  });
  _.forEach(source.cargo_missing || {}, (count, itemId) => {
    analysis.push(
      <p key={itemId}>
        Missing in cargo <strong>{idLookup[itemId]}</strong>: {count}
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
  return <ShipDisplay name="Capsule" dna={`670:${podDna}::`} />;
}
