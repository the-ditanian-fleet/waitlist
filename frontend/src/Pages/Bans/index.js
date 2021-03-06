import React from "react";
import { Table, Row, Cell, TableHead, TableBody, CellHead } from "../../Components/Table";

export function Bans() {
  const [bans, setBans] = React.useState(null);

  React.useEffect(() => {
    fetch("/api/bans/list")
      .then((response) => response.json())
      .then(setBans);
  }, []);

  if (!bans) {
    return <em>Loading bans...</em>;
  }

  return (
    <Table fullWidth>
      <TableHead>
        <Row>
          <CellHead>Kind</CellHead>
          <CellHead>ID</CellHead>
          <CellHead>Name</CellHead>
          <CellHead>Expiry</CellHead>
        </Row>
      </TableHead>
      <TableBody>
        {bans.bans.map((ban) => (
          <Row key={ban.id}>
            <Cell>{ban.kind}</Cell>
            <Cell>{ban.id}</Cell>
            <Cell>{ban.name}</Cell>
            <Cell>{ban.expires_at}</Cell>
          </Row>
        ))}
      </TableBody>
    </Table>
  );
}
