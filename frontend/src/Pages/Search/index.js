import React from "react";
import { Input, NavButton } from "../../Components/Form";
import { Cell, Table, Row, TableHead, TableBody, CellHead } from "../../Components/Table";

export function Search() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [results, setResults] = React.useState(null);

  React.useEffect(() => {
    setResults(null);
    if (searchTerm.length < 3) {
      return;
    }
    fetch(
      "/api/search?" +
        new URLSearchParams({
          query: searchTerm,
        })
    )
      .then((response) => response.json())
      .then(setResults); // XXX error
  }, [searchTerm, setResults]);

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
              <CellHead></CellHead>
            </Row>
          </TableHead>
          <TableBody>
            {results.results.map((character) => (
              <Row key={character.id}>
                <Cell>{character.name}</Cell>
                <Cell>
                  <NavButton to={"/skills?character_id=" + character.id}>Skills</NavButton>
                  <NavButton to={"/pilot?character_id=" + character.id}>Information</NavButton>
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
