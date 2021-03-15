import React from "react";
import _ from "lodash";
import { Cell, CellHead, Row, Table, TableBody, TableHead } from "../../Components/Table";
import { ToastContext } from "../../contexts";
import { apiCall, errorToaster } from "../../api";

export function SkillHistory({ characterId }) {
  const toastContext = React.useContext(ToastContext);
  const [history, setHistory] = React.useState(null);
  React.useEffect(() => {
    errorToaster(
      toastContext,
      apiCall("/api/history/skills?character_id=" + characterId, {}).then(setHistory)
    );
  }, [toastContext, characterId]);

  if (!history) {
    return <em>Loading skill history...</em>;
  }

  var skillNames = _.invert(history.ids);

  var table = [];
  _.forEach(history.history, (historyLine) => {
    table.push(
      <Row key={`${historyLine.skill_id} ${historyLine.logged_at}`}>
        <Cell>{new Date(historyLine.logged_at).toLocaleDateString()}</Cell>
        <Cell>{skillNames[historyLine.skill_id]}</Cell>
        <Cell>
          {historyLine.old_level} -&gt; {historyLine.new_level}
        </Cell>
      </Row>
    );
  });

  if (!table.length) {
    return <em>No skill history available</em>;
  }

  return (
    <Table fullWidth>
      <TableHead>
        <Row>
          <CellHead>Date</CellHead>
          <CellHead>Skill</CellHead>
          <CellHead></CellHead>
        </Row>
      </TableHead>
      <TableBody>{table}</TableBody>
    </Table>
  );
}
