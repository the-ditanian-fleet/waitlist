import React from "react";
import { Table, Row, Cell, TableBody, TableHead, CellHead } from "../../Components/Table";
import { apiCall, errorToaster } from "../../api";
import { ToastContext } from "../../contexts";

function formatDuration(durationSeconds) {
  var groups = [];

  var days = Math.floor(durationSeconds / 86400);
  if (days > 0) groups.push(`${days}d`);

  var hours = Math.floor((durationSeconds % 86400) / 3600);
  if (hours > 0) groups.push(`${hours}h`);

  var minutes = Math.floor((durationSeconds % 3600) / 60);
  if (minutes > 0) groups.push(`${minutes}min`);

  var seconds = durationSeconds % 60;
  if (seconds > 0) groups.push(`${seconds}s`);

  if (!groups) {
    return "-";
  }
  if (groups.length > 1) {
    return `${groups[0]} ${groups[1]}`;
  }
  return groups[0];
}

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
