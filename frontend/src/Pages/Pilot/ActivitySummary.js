import { Table, TableBody, Cell, Row, CellHead } from "../../Components/Table";
import { formatDuration } from "../../Util/time";
import _ from "lodash";

export function ActivitySummary({ summary }) {
  if (!summary) {
    return null;
  }

  if (!summary.length) {
    return <em>Never seen before</em>;
  }

  const total = _.sum(summary.map(({ time_in_fleet }) => time_in_fleet));

  return (
    <Table fullWidth edgeLine style={{ marginBottom: "2em" }}>
      <TableBody>
        <Row>
          <CellHead>Total</CellHead>
          <CellHead>{formatDuration(total)}</CellHead>
        </Row>
        {summary.map(({ hull, time_in_fleet }) => (
          <Row key={hull.id}>
            <Cell>{hull.name}</Cell>
            <Cell>{formatDuration(time_in_fleet)}</Cell>
          </Row>
        ))}
      </TableBody>
    </Table>
  );
}
