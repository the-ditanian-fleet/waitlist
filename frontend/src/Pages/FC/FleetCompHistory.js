import React from "react";
import { useApi } from "../../api";
import { Input, InputGroup } from "../../Components/Form";
import _ from "lodash";
import { Content } from "../../Components/Page";
import { Cell, CellHead, Row, Table, TableBody, TableHead } from "../../Components/Table";
import { formatDuration } from "../../Util/time";

export function FleetCompHistory() {
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");

  const parsedDate = date && time ? new Date(`${date}T${time}Z`) : null;
  const parsedDateUnix = parsedDate ? parsedDate.getTime() / 1000 : null;

  const [result] = useApi(parsedDateUnix ? `/api/history/fleet-comp?time=${parsedDateUnix}` : null);

  return (
    <Content>
      <h2>Fleet history lookup</h2>
      <InputGroup>
        <Input type="date" value={date} onChange={(evt) => setDate(evt.target.value)} />
        <Input type="time" value={time} onChange={(evt) => setTime(evt.target.value)} />
      </InputGroup>
      {parsedDate ? (
        <div>
          <em>{parsedDate.toString()}</em>
        </div>
      ) : null}

      {result && <h2>Results</h2>}
      {result &&
        _.map(result.fleets, (comp, fleetId) => (
          <div key={fleetId}>
            <h3>Fleet {fleetId}</h3>
            <Table fullWidth>
              <TableHead>
                <Row>
                  <CellHead>Pilot</CellHead>
                  <CellHead>Ship</CellHead>
                  <CellHead>Time</CellHead>
                </Row>
              </TableHead>
              <TableBody>
                {comp.map((entry) => (
                  <Row key={entry.character.id}>
                    <Cell>{entry.character.name}</Cell>
                    <Cell>{entry.hull.name}</Cell>
                    <Cell>
                      {new Date(entry.logged_at * 1000).toUTCString()} (
                      {formatDuration(entry.time_in_fleet)})
                    </Cell>
                  </Row>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      {result && _.isEmpty(result.fleets) && <em>Nothing found!</em>}
    </Content>
  );
}
