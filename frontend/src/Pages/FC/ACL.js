import React from "react";
import { Route } from "react-router-dom";
import { apiCall, toaster, useApi } from "../../api";
import { Box } from "../../Components/Box";
import { Button, Input, CenteredButtons } from "../../Components/Form";
import { PageTitle, Title } from "../../Components/Page";
import { CellHead, Table, TableHead, Row, TableBody, Cell } from "../../Components/Table";
import { ToastContext, AuthContext } from "../../contexts";
import { Modal } from "../../Components/Modal";

export const fcroles = ["trainee", "trainee-advanced", "fc", "fc-trainer", "council", "admin"];

export function ACLRoutes() {
  return (
    <>
      <Route exact path="/fc/acl">
        <ACLOverview />
      </Route>
    </>
  );
}

export async function removeAcl(id) {
  return apiCall("/api/acl/remove", { json: { id } });
}

function RemoveConfirm({ who, onAction }) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const toastContext = React.useContext(ToastContext);
  return (
    <>
      {modalOpen ? (
        <Modal open={true} setOpen={setModalOpen}>
          <Box>
            <Title>Remove {who.name}</Title>
            <p style={{ marginBottom: "15px" }}>{who.level}</p>

            <CenteredButtons size={"90px"}>
              <Button variant="secondary" onClick={(evt) => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={(evt) => toaster(toastContext, removeAcl(who.id).then(onAction))}
              >
                Confirm
              </Button>
            </CenteredButtons>
          </Box>
        </Modal>
      ) : null}
      <Button variant="danger" onClick={(evt) => setModalOpen(true)}>
        Remove
      </Button>
    </>
  );
}

function ACLTable({ entries, onAction }) {
  const authContext = React.useContext(AuthContext);

  return (
    <Table fullWidth>
      <TableHead>
        <Row>
          <CellHead>Name</CellHead>
          <CellHead>Level</CellHead>
          <CellHead>Actions</CellHead>
        </Row>
      </TableHead>
      <TableBody>
        {entries.map((admin) => (
          <Row key={admin.id}>
            <Cell>{admin.name}</Cell>
            <Cell>{admin.level}</Cell>
            <Cell>
              {authContext.access["access-manage"] && (
                <RemoveConfirm who={admin} onAction={onAction} />
              )}
            </Cell>
          </Row>
        ))}
      </TableBody>
    </Table>
  );
}

function ACLOverview() {
  const [acl, refreshAcl] = useApi("/api/acl/list");
  const [find, setFind] = React.useState("");

  if (!acl) {
    return <em>Loading</em>;
  }

  return (
    <>
      <PageTitle>Access control list</PageTitle>

      <Box>
        <Input
          value={find}
          onChange={(evt) => setFind(evt.target.value)}
          style={{ marginBottom: "15px" }}
        />

        <ACLTable
          entries={acl.acl.filter(
            (entry) => fcroles.includes(entry.level) && entry.name.toLowerCase().startsWith(find)
          )}
          onAction={refreshAcl}
        />
      </Box>
    </>
  );
}
