import React from "react";
import { Route } from "react-router-dom";
import { apiCall, toaster, useApi } from "../../api";
import { Box } from "../../Components/Box";
import { Button, InputGroup, Buttons, Input, CenteredButtons } from "../../Components/Form";
import { PageTitle, Title } from "../../Components/Page";
import { CellHead, Table, TableHead, Row, TableBody, Cell } from "../../Components/Table";
import { ToastContext, AuthContext } from "../../contexts";
import { useLocation, useHistory } from "react-router-dom";
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
            <p>
              <AclToRead role={who.level} />
            </p>
            <br />
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
          <CellHead></CellHead>
          <CellHead></CellHead>
          <CellHead>Level</CellHead>
          <CellHead></CellHead>
          <CellHead></CellHead>
          <CellHead>Actions</CellHead>
        </Row>
      </TableHead>
      <TableBody>
        {entries.map((admin) => (
          <Row key={admin.id}>
            <Cell>{admin.name}</Cell>
            <Cell></Cell>
            <Cell></Cell>
            <Cell>
              <AclToRead role={admin.level} />
            </Cell>
            <Cell></Cell>
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
  var category = queryParams.get("Category") || "FC";
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
            <Button active={category === "l"} onClick={(evt) => setCategory("l")}>
              Logi
            </Button>
            <Button active={category === "b"} onClick={(evt) => setCategory("b")}>
              Bastion
            </Button>
            <Button active={category === "w"} onClick={(evt) => setCategory("w")}>
              Web
            </Button>
          </InputGroup>
          <InputGroup>
            <Button active={category === "FC"} onClick={(evt) => setCategory("FC")}>
              FC
            </Button>
          </InputGroup>
        </Buttons>
      )}
      <Box>
        <Input value={find} onChange={(evt) => setFind(evt.target.value)} />

        {category !== "FC" ? (
          <ACLTable
            entries={acl.acl.filter(
              (entry) =>
                entry.level.includes(category) &&
                !fcroles.includes(entry.level) &&
                entry.name.toLowerCase().startsWith(find)
            )}
            onAction={refreshAcl}
          />
        ) : category === "FC" ? (
          <ACLTable
            entries={acl.acl.filter(
              (entry) => fcroles.includes(entry.level) && entry.name.toLowerCase().startsWith(find)
            )}
            onAction={refreshAcl}
          />
        ) : null}
      </Box>
    </>
  );
}

export function AclToRead({ role }) {
  if (!fcroles.includes(role) && role !== "No level") {
    var word = "";
    if (role.includes("l")) {
      word += "Logi-";
    }
    if (role.includes("b")) {
      word += "Bastion-";
    }
    if (role.includes("w")) {
      word += "Web-";
    }
    word += "Specialist";
    return word;
  } else return role;
}
