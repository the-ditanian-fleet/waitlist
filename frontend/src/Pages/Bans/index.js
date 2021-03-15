import React from "react";
import { Table, Row, Cell, TableHead, TableBody, CellHead } from "../../Components/Table";

import { ToastContext } from "../../contexts";
import { errorToaster, apiCall } from "../../api";

export function Bans() {
  const [bans, setBans] = React.useState(null);
  const toastContext = React.useContext(ToastContext);

  React.useEffect(() => {
    errorToaster(toastContext, apiCall("/api/bans/list", {}).then(setBans));
  }, [toastContext]);

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
