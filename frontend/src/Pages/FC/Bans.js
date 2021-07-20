import React from "react";
import { useLocation, useHistory, Route } from "react-router-dom";
import { Table, Row, Cell, TableHead, TableBody, CellHead } from "../../Components/Table";
import { Button, Input, NavButton, Select } from "../../Components/Form";

import { AuthContext, ToastContext } from "../../contexts";
import { useApi, toaster, apiCall } from "../../api";

async function removeBan({ kind, id }) {
  return apiCall("/api/bans/remove", {
    json: { kind, id },
  });
}

export function BanRoutes() {
  return (
    <>
      <Route exact path="/fc/bans/add">
        <AddBan />
      </Route>
      <Route exact path="/fc/bans">
        <BanList />
      </Route>
    </>
  );
}

function BanList() {
  const authContext = React.useContext(AuthContext);
  const [bans, refreshBans] = useApi("/api/bans/list");

  if (!bans) {
    return <em>Loading bans...</em>;
  }

  return (
    <>
      {authContext.access["bans-manage"] && (
        <NavButton exact to="/fc/bans/add">
          Add ban
        </NavButton>
      )}
      <Table fullWidth>
        <TableHead>
          <Row>
            <CellHead>Kind</CellHead>
            <CellHead>ID</CellHead>
            <CellHead>Name</CellHead>
            <CellHead>Expiry</CellHead>
            {authContext.access["bans-manage"] && <CellHead>Actions</CellHead>}
          </Row>
        </TableHead>
        <TableBody>
          {bans.bans.map((ban) => (
            <BanEntry key={ban.id} {...ban} onAction={refreshBans} />
          ))}
        </TableBody>
      </Table>
    </>
  );
}

function BanEntry({ kind, id, name, expires_at, onAction }) {
  const toastContext = React.useContext(ToastContext);
  const authContext = React.useContext(AuthContext);

  var link = `https://evewho.com/${kind}/${id}`;

  return (
    <Row>
      <Cell>{kind}</Cell>
      <Cell>
        <a href={link}>{id}</a>
      </Cell>
      <Cell>{name}</Cell>
      <Cell>{expires_at}</Cell>
      {authContext.access["bans-manage"] && (
        <Cell>
          <Button onClick={(evt) => toaster(toastContext, removeBan({ kind, id })).then(onAction)}>
            Remove
          </Button>
        </Cell>
      )}
    </Row>
  );
}

function AddBan() {
  const toastContext = React.useContext(ToastContext);
  const queryParams = new URLSearchParams(useLocation().search);
  const [kind, setKind] = React.useState(queryParams.get("kind") || "character");
  const [banID, setBanID] = React.useState(queryParams.get("id") || "");
  const [duration, setDuration] = React.useState("");
  const history = useHistory();

  const doBan = function () {
    toaster(
      toastContext,
      apiCall("/api/bans/add", {
        json: {
          kind,
          id: banID,
          duration: parseFloat(duration),
        },
      }).then((success) => {
        history.push({ pathname: "/fc/bans" });
        return success;
      })
    );
  };

  return (
    <>
      <p>
        <label>
          Kind
          <br />
        </label>
        <Select value={kind} onChange={(evt) => setKind(evt.target.value)}>
          <option value="character">character</option>
          <option value="corporation">corporation</option>
          <option value="alliance">alliance</option>
        </Select>
      </p>
      <p>
        <label>
          ID
          <br />
        </label>
        <Input value={banID} onChange={(evt) => setBanID(evt.target.value)} />
      </p>
      <p>
        <label>
          Duration in minutes (0 for permanent)
          <br />
        </label>
        <Input type="number" value={duration} onChange={(evt) => setDuration(evt.target.value)} />
      </p>
      <Button variant="danger" onClick={(evt) => doBan()}>
        Ban
      </Button>
    </>
  );
}
