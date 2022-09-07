import React from "react";
import { Input, NavButton, InputGroup, Buttons } from "../../Components/Form";
import { Cell, Table, Row, TableHead, TableBody, CellHead } from "../../Components/Table";
import { useApi } from "../../api";
import { AuthContext } from "../../contexts";
import { useQuery } from "../../Util/query";
import CharacterBadgeModal from "./badges/CharacterBadgeModal";
import CommanderModal from "./commanders/CommanderModal";

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
                      {authContext.access["access-manage"] && (
                        <CommanderModal character={character} isRevokeable />
                      )}
                      {authContext.access["bans-manage"] &&
                        authContext.account_id !== character.id && (
                          <NavButton to={"/fc/bans/add?kind=character&id=" + character.id}>
                            Ban
                          </NavButton>
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
