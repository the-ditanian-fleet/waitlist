import React from "react";
import { Table, Row, Cell, TableBody, TableHead, CellHead } from "../../Components/Table";
import { apiCall, errorToaster } from "../../api";
import { ToastContext } from "../../contexts";

function implantsToFit(implants) {
  return "670:" + implants.map((implant) => `${implant};1`).join(":") + "::";
}

export function FitHistory({ characterId }) {
  const toastContext = React.useContext(ToastContext);
  const [history, setHistory] = React.useState(null);
  React.useEffect(() => {
    setHistory(null);
    errorToaster(
      toastContext,
      apiCall("/api/history/xup?character_id=" + characterId, {}).then(setHistory)
    );
  }, [toastContext, characterId]);

  if (!history) {
    return <em>Loading history...</em>;
  }

  if (!history.xups.length) {
    return <em>No stored previous x-ups</em>;
  }

  return (
    <Table fullWidth>
      <TableHead>
        <Row>
          <CellHead>Date</CellHead>
          <CellHead>Fit</CellHead>
          <CellHead>Implants</CellHead>
        </Row>
      </TableHead>
      <TableBody>
        {history.xups.map((xup, i) => {
          return (
            <Row key={i}>
              <Cell>{new Date(xup.logged_at).toLocaleString()}</Cell>
              <Cell>
                <a href={"fitting:" + xup.dna}>{xup.hull.name}</a>
              </Cell>
              <Cell>
                {xup.implants && xup.implants.length ? (
                  <a href={"fitting:" + implantsToFit(xup.implants)}>Implants</a>
                ) : null}
              </Cell>
            </Row>
          );
        })}
      </TableBody>
    </Table>
  );
}
