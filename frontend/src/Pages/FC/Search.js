import React from "react";
import { Input, NavButton } from "../../Components/Form";
import { Cell, Table, Row, TableHead, TableBody, CellHead } from "../../Components/Table";
import { apiCall, errorToaster } from "../../api";
import { AuthContext, ToastContext } from "../../contexts";
import { useLocation, useHistory } from "react-router-dom";

export function Search() {
  const toastContext = React.useContext(ToastContext);
  const authContext = React.useContext(AuthContext);
  const history = useHistory();
  const queryParams = new URLSearchParams(useLocation().search);
  const [results, setResults] = React.useState(null);

  const searchTerm = queryParams.get("query") || "";
  const setSearchTerm = (newTerm) => {
    if (newTerm) {
      queryParams.set("query", newTerm);
    } else {
      queryParams.delete("query");
    }
    history.replace({
      search: queryParams.toString(),
    });
  };

  React.useEffect(() => {
    setResults(null);
    if (searchTerm.length < 3) {
      return;
    }
    errorToaster(
      toastContext,
      apiCall(
        "/api/search?" +
          new URLSearchParams({
            query: searchTerm,
          }),
        {}
      ).then(setResults)
    );
  }, [toastContext, searchTerm, setResults]);

  return (
    <>
      <div style={{ marginBottom: "1em" }}>
        <label>
          <strong>Search term:</strong>
          <br />
          <Input value={searchTerm} onChange={(evt) => setSearchTerm(evt.target.value)} />
        </label>
      </div>
      {results == null ? null : results.results.length ? (
        <Table fullWidth>
          <TableHead>
            <Row>
              <CellHead>Name</CellHead>
              <CellHead>Character ID</CellHead>
              <CellHead></CellHead>
            </Row>
          </TableHead>
          <TableBody>
            {results.results.map((character) => (
              <Row key={character.id}>
                <Cell>{character.name}</Cell>
                <Cell>{character.id}</Cell>
                <Cell>
                  <NavButton to={"/skills?character_id=" + character.id}>Skills</NavButton>
                  <NavButton to={"/pilot?character_id=" + character.id}>Information</NavButton>
                  {authContext.access["bans-manage"] && (
                    <NavButton to={"/fc/bans/add?kind=character&id=" + character.id}>Ban</NavButton>
                  )}
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
