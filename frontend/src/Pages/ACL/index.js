import React from "react";
import { Route } from "react-router-dom";
import { apiCall, errorToaster, toaster } from "../../api";
import { Box } from "../../Components/Box";
import { Button, Input, Select } from "../../Components/Form";
import { PageTitle, Title } from "../../Components/Page";
import { CellHead, Table, TableHead, Row, TableBody, Cell } from "../../Components/Table";
import { ToastContext } from "../../contexts";

export function ACLRoutes() {
  return (
    <>
      <Route exact path="/acl">
        <ACLOverview />
      </Route>
    </>
  );
}

async function removeAcl(id) {
  return apiCall("/api/acl/remove", { json: { id } });
}

async function addAcl(id, level) {
  return apiCall("/api/acl/add", { json: { id, level } });
}

function ACLOverview() {
  const toastContext = React.useContext(ToastContext);
  const [acl, setAcl] = React.useState(null);

  React.useEffect(() => {
    errorToaster(toastContext, apiCall("/api/acl/list", {}).then(setAcl));
  }, [toastContext]);

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
              <Cell>
                <a href={`char:${admin.id}`}>{admin.name}</a>
              </Cell>
              <Cell>{admin.level}</Cell>
              <Cell>
                <Button
                  variant="danger"
                  onClick={(evt) => toaster(toastContext, removeAcl(admin.id))}
                >
                  Remove
                </Button>
              </Cell>
            </Row>
          ))}
        </TableBody>
      </Table>
      <AddACL />
    </>
  );
}

function AddACL() {
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
            <option value="fc">fc</option>
          </Select>
        </p>
        <Button onClick={(evt) => toaster(toastContext, addAcl(id, level))}>Confirm</Button>
      </Box>
    </>
  );
}
