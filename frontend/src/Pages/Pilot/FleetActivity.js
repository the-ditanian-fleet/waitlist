import React from "react";
import { Table, Row, Cell, TableBody, TableHead, CellHead } from "../../Components/Table";
import { apiCall, errorToaster } from "../../api";
import { ToastContext } from "../../contexts";
import { formatDuration } from "../../Util/time";

export function FleetActivity({ characterId }) {
  const toastContext = React.useContext(ToastContext);
  const [history, setHistory] = React.useState(null);
  React.useEffect(() => {
    setHistory(null);
    errorToaster(
      toastContext,
      apiCall("/api/history/fleet?character_id=" + characterId, {}).then(setHistory)
    );
  }, [toastContext, characterId]);

  if (!history) {
    return <em>Loading...</em>;
  }

  return (
    <>
      <Table fullWidth style={{ marginBottom: "2em" }}>
        <TableHead>
          <Row>
            <CellHead>Ship</CellHead>
            <CellHead>Duration</CellHead>
          </Row>
        </TableHead>
        <TableBody>
          {history.summary.map(({ hull, time_in_fleet }) => (
            <Row key={hull.id}>
              <Cell>{hull.name}</Cell>
              <Cell>{formatDuration(time_in_fleet)}</Cell>
            </Row>
          ))}
        </TableBody>
      </Table>
      <Table fullWidth>
        <TableHead>
          <Row>
            <CellHead>Date</CellHead>
            <CellHead>Ship</CellHead>
            <CellHead>Duration</CellHead>
          </Row>
        </TableHead>
        <TableBody>
          {history.activity.map(({ logged_at, hull, time_in_fleet }, i) => (
            <Row key={i}>
              <Cell>{new Date(logged_at).toLocaleString()}</Cell>
              <Cell>{hull.name}</Cell>
              <Cell>{formatDuration(time_in_fleet)}</Cell>
            </Row>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
