import React from "react";
import {
  Input,
  NavButton,
  Button,
  Select,
  InputGroup,
  Buttons,
  CenteredButtons,
} from "../../Components/Form";
import { Cell, Table, Row, TableHead, TableBody, CellHead } from "../../Components/Table";
import { useApi, apiCall, toaster } from "../../api";
import { AuthContext, ToastContext } from "../../contexts";
import { useQuery } from "../../Util/query";
import { Title } from "../../Components/Page";
import { Modal } from "../../Components/Modal";
import { Box } from "../../Components/Box";
import { removeAcl } from "./ACL";
import { fcroles } from "./ACL";
import CharacterBadgeModal from "./badges/CharacterBadgeModal";

async function addAcl(id, level) {
  return apiCall("/api/acl/add", { json: { id: parseInt(id), level } });
}

export function Search() {
  const authContext = React.useContext(AuthContext);

  var [{ query }, setQuery] = useQuery();
  const setSearchTerm = (newTerm) => {
    setQuery("query", newTerm ? newTerm : null, true);
  };

  const [results] = useApi(
    query && query.length >= 3 ? "/api/search?" + new URLSearchParams({ query }) : null
  );

  return (
    <>
      <div style={{ marginBottom: "1em" }}>
        <label>
          <strong>Search term:</strong>
          <br />
          <Input value={query ?? ""} onChange={(evt) => setSearchTerm(evt.target.value)} />
        </label>
      </div>
      {results == null ? null : results.results.length ? (
        <Table fullWidth>
          <TableHead>
            <Row>
              <CellHead>Name</CellHead>
              <CellHead>Character ID</CellHead>
              <CellHead style={{ width: "50%" }}></CellHead>
            </Row>
          </TableHead>
          <TableBody>
            {results.results.map((character) => (
              <Row key={character.id}>
                <Cell>{character.name}</Cell>
                <Cell>{character.id}</Cell>
                <Cell>
                  <Buttons marginb={"0em"}>
                    <InputGroup>
                      <NavButton to={"/skills?character_id=" + character.id}>Skills</NavButton>
                      <NavButton to={"/pilot?character_id=" + character.id}>Information</NavButton>
                    </InputGroup>
                    <InputGroup>
                      {authContext.access["bans-manage"] &&
                        authContext.account_id !== character.id && (
                          <NavButton to={"/fc/bans/add?kind=character&id=" + character.id}>
                            Ban
                          </NavButton>
                        )}
                      {authContext.access["access-manage"] &&
                        authContext.account_id !== character.id && (
                          <>
                            <AddACL who={character} authContext={authContext} />
                          </>
                        )}

                      {authContext.access["badges-manage"] && (
                        <CharacterBadgeModal character={character} />
                      )}
                    </InputGroup>
                  </Buttons>
                </Cell>
              </Row>
            ))}
          </TableBody>
        </Table>
      ) : (
        <em>No results</em>
      )}
    </>
  );
}

export function AddACL({ who, authContext }) {
  const toastContext = React.useContext(ToastContext);
  const [level, setLevel] = React.useState("trainee");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [acl, refreshAcl] = useApi("/api/acl/list");

  var current = "No level";
  if (acl && who) {
    const find = acl.acl.filter((entry) => entry.id === who.id)[0];
    if (find) {
      current = find.level;
    }
  }

  if (!acl || !who) {
    return <Button>ACL</Button>;
  }

  return (
    <>
      {modalOpen ? (
        <Modal open={true} setOpen={setModalOpen}>
          <Box style={{ height: "220px" }}>
            <Title>{who.name}</Title>
            <p>{current}</p>
            <br />
            {fcroles.includes(current) ? (
              <>
                <br />
                <CenteredButtons>
                  <Button
                    variant="danger"
                    onClick={(evt) => toaster(toastContext, removeAcl(who.id).then(refreshAcl))}
                  >
                    Remove FC
                  </Button>
                </CenteredButtons>
              </>
            ) : (
              <>
                <CenteredButtons>
                  <label>Level</label>
                  <Select
                    value={level}
                    onChange={(evt) => setLevel(evt.target.value)}
                    style={{ marginBottom: "0.3em" }}
                  >
                    <option value="trainee">trainee</option>
                    <option value="trainee-advanced">trainee-advanced</option>
                    <option value="fc">fc</option>
                    <option value="fc-trainer">fc-trainer</option>
                    <option value="council">council</option>
                  </Select>
                </CenteredButtons>
                <CenteredButtons>
                  <Button
                    variant={"success"}
                    onClick={(evt) => toaster(toastContext, addAcl(who.id, level).then(refreshAcl))}
                  >
                    Confirm
                  </Button>
                </CenteredButtons>
              </>
            )}
          </Box>
        </Modal>
      ) : null}
      <Button onClick={(evt) => setModalOpen(true)}>ACL</Button>
    </>
  );
}
