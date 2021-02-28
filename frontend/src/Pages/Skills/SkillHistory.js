import React from "react";
import _ from "lodash";
import styled from "styled-components";

const HistoryTable = styled.table`
  width: 100%;
  font-size: 1.2em;
  th,
  td {
    text-align: left;
  }
  th {
    font-weight: bolder;
  }
`;

export function SkillHistory({ characterId }) {
  const [history, setHistory] = React.useState(null);
  React.useEffect(() => {
    fetch("/api/skills/history?character_id=" + characterId)
      .then((response) => response.json())
      .then(setHistory);
  }, [characterId]);

  if (!history) {
    return <em>Loading skill history...</em>;
  }

  var skillNames = _.invert(history.ids);

  var table = [];
  _.forEach(history.history, (historyLine) => {
    const date = new Date(historyLine.logged_at);
    table.push(
      <tr key={`${historyLine.skill_id} ${historyLine.logged_at}`}>
        <td>{date.toLocaleDateString()}</td>
        <td>{skillNames[historyLine.skill_id]}</td>
        <td>
          {historyLine.old_level} -&gt; {historyLine.new_level}
        </td>
      </tr>
    );
  });

  return (
    <div>
      <h2 style={{ fontSize: "2em", fontWeight: "600" }}>Skill history</h2>
      <HistoryTable>
        <thead>
          <tr>
            <th>Date</th>
            <th>Skill</th>
            <th></th>
          </tr>
        </thead>
        {table}
      </HistoryTable>
    </div>
  );
}
