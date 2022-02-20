import React from "react";
import { Route } from "react-router-dom";
import { apiCall, toaster, useApi } from "../../api";
import { Box } from "../../Components/Box";
import { Button, InputGroup, Buttons, Input } from "../../Components/Form";
import { PageTitle, Title } from "../../Components/Page";
import { CellHead, Table, TableHead, Row, TableBody, Cell } from "../../Components/Table";
import { ToastContext, AuthContext } from "../../contexts";
import { useLocation, useHistory } from "react-router-dom";
import { Modal } from "../../Components/Modal";
import styled from "styled-components";
const CenteredButtons = styled.div`
  display: flex;
  justify-content: center;
  margin-right: 0.5em;
  > * {
    margin: 0.2em;
    width: 90px;
  }
`;

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
            <p>{who.level}</p>
            <br />
            <CenteredButtons>
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
          <CellHead></CellHead>
          <CellHead>Level</CellHead>
          <CellHead></CellHead>
          <CellHead>Actions</CellHead>
        </Row>
      </TableHead>
      <TableBody>
        {entries.map((admin) => (
          <Row key={admin.id}>
            <Cell>{admin.name}</Cell>
            <Cell></Cell>
            <Cell>{admin.level}</Cell>
            <Cell></Cell>
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

  const queryParams = new URLSearchParams(useLocation().search);
  const history = useHistory();
  var category = queryParams.get("Category") || "Logi";
  const setCategory = (newCategory) => {
    queryParams.set("Category", newCategory);
    history.push({
      search: queryParams.toString(),
    });
  };
  if (!acl) {
    return <em>Loading</em>;
  }
  return (
    <>
      <PageTitle>Access control list</PageTitle>
      {setCategory != null && (
        <Buttons style={{ marginBottom: "1em" }}>
          <InputGroup>
            <Button active={category === "Logi"} onClick={(evt) => setCategory("Logi")}>
              Logi
            </Button>
            <Button active={category === "FC"} onClick={(evt) => setCategory("FC")}>
              FC
            </Button>
          </InputGroup>
        </Buttons>
      )}
      <Box>
        <Input value={find} onChange={(evt) => setFind(evt.target.value)} />
        {category === "Logi" ? (
          <ACLTable
            entries={acl.acl.filter(
              (entry) =>
                entry.level === "logi-specialist" && entry.name.toLowerCase().startsWith(find)
            )}
            onAction={refreshAcl}
          />
        ) : category === "FC" ? (
          <ACLTable
            entries={acl.acl.filter(
              (entry) =>
                entry.level !== "logi-specialist" && entry.name.toLowerCase().startsWith(find)
            )}
            onAction={refreshAcl}
          />
        ) : null}
      </Box>
    </>
  );
}
