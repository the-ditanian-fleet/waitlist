import React from "react";
import { Route } from "react-router-dom";
import { apiCall, toaster, useApi } from "../../api";
import { Box } from "../../Components/Box";
import { Button, Input, Select } from "../../Components/Form";
import { PageTitle, Title } from "../../Components/Page";
import { CellHead, Table, TableHead, Row, TableBody, Cell } from "../../Components/Table";
import { ToastContext, AuthContext } from "../../contexts";

export function ACLRoutes() {
  return (
    <>
      <Route exact path="/fc/acl">
        <ACLOverview />
      </Route>
    </>
  );
}

async function removeAcl(id) {
  return apiCall("/api/acl/remove", { json: { id } });
}

async function addAcl(id, level) {
  return apiCall("/api/acl/add", { json: { id: parseInt(id), level } });
}

function ACLOverview() {
  const [acl, refreshAcl] = useApi("/api/acl/list");
  const toastContext = React.useContext(ToastContext);
  const authContext = React.useContext(AuthContext);

  if (!acl) {
    return <em>Loading</em>;
  }

  return (
    <>
      <PageTitle>Access control</PageTitle>
      <Table fullWidth>
        <TableHead>
          <Row>
            <CellHead>Name</CellHead>
            <CellHead>Level</CellHead>
            <CellHead>Actions</CellHead>
          </Row>
        </TableHead>
        <TableBody>
          {acl.acl.map((admin) => (
            <Row key={admin.id}>
              <Cell>{admin.name}</Cell>
              <Cell>{admin.level}</Cell>
              <Cell>
                {authContext.access["access-manage"] && (
                  <Button
                    variant="danger"
                    onClick={(evt) => toaster(toastContext, removeAcl(admin.id).then(refreshAcl))}
                  >
                    Remove
                  </Button>
                )}
              </Cell>
            </Row>
          ))}
        </TableBody>
      </Table>
      {authContext.access["access-manage"] && <AddACL onAction={refreshAcl} />}
    </>
  );
}

function AddACL({ onAction }) {
  const toastContext = React.useContext(ToastContext);
  const [id, setId] = React.useState("");
  const [level, setLevel] = React.useState("");

  return (
    <>
      <Title>Add ACL</Title>
      <Box>
        <p>
          <label>
            Character ID
            <br />
          </label>
          <Input value={id} onChange={(evt) => setId(evt.target.value)} />
        </p>
        <p>
          <label>
            Level
            <br />
          </label>
          <Select value={level} onChange={(evt) => setLevel(evt.target.value)}>
            <option></option>
            <option value="trainee">trainee</option>
            <option value="trainee-advanced">trainee-advanced</option>
            <option value="fc">fc</option>
            <option value="fc-trainer">fc-trainer</option>
            <option value="council">council</option>
          </Select>
        </p>
        <Button onClick={(evt) => toaster(toastContext, addAcl(id, level).then(onAction))}>
          Confirm
        </Button>
      </Box>
    </>
  );
}
