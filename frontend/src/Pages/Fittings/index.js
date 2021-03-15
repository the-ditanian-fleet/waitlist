import React from "react";
import { Table, Row, Cell, TableBody } from "../../Components/Table";
import { Content } from "../../Components/Page";
import { ToastContext } from "../../contexts";
import { apiCall, errorToaster } from "../../api";

export function Fittings() {
  const [fittings, setFittings] = React.useState(null);
  const toastContext = React.useContext(ToastContext);

  React.useEffect(() => {
    errorToaster(toastContext, apiCall("/api/fittings", {}).then(setFittings));
  }, [toastContext]);

  if (!fittings) {
    return <em>Loading fittings...</em>;
  }

  return (
    <Content>
      <h1>Fittings</h1>
      <p>
        <em>
          This page is still being worked on! The list of HQ fits is complete, but more information
          is to be added soon.
        </em>
      </p>
      {fittings.fittings.map((ship) => (
        <React.Fragment key={ship.hull.id}>
          <h2>{ship.hull.name}</h2>
          <Table fullWidth>
            <TableBody>
              {ship.fits.map((fit) => (
                <Row key={fit.name}>
                  <Cell>
                    <a href={`fitting:${fit.dna}`}>{fit.name}</a>
                  </Cell>
                </Row>
              ))}
            </TableBody>
          </Table>
        </React.Fragment>
      ))}
    </Content>
  );
}
