import { Table, Row, Cell, TableBody, TableHead, CellHead } from "../../Components/Table";
import { useApi } from "../../api";
import React from "react";
import { Modal } from "../../Components/Modal";
import styled from "styled-components";
import { Box } from "../../Components/Box";
import { DNADisplay } from "../../Components/FitDisplay";

const Link = styled.a`
  cursor: pointer;
  text-decoration: underline;
`;

function implantsToFit(implants) {
  return "670:" + implants.map((implant) => `${implant};1`).join(":") + "::";
}

function HistoryLine({ xup }) {
  const [showModal, setShowModal] = React.useState(false);
  return (
    <Row>
      {showModal && (
        <Modal open={true} setOpen={setShowModal}>
          <Box style={{ display: "flex" }}>
            <DNADisplay dna={xup.dna} />
            {xup.implants && xup.implants.length ? (
              <DNADisplay dna={implantsToFit(xup.implants)} />
            ) : null}
          </Box>
        </Modal>
      )}
      <Cell>{new Date(xup.logged_at).toLocaleString()}</Cell>
      <Cell>
        <Link onClick={(evt) => setShowModal(true)}>{xup.hull.name}</Link>
      </Cell>
    </Row>
  );
}

export function FitHistory({ characterId }) {
  const [history] = useApi(`/api/history/xup?character_id=${characterId}`);

  if (!history) {
    return <em>Loading history...</em>;
  }

  if (!history.xups.length) {
    return <em>No stored previous x-ups</em>;
  }

  return (
    <Table fullWidth>
      <TableHead>
        <Row>
          <CellHead>Date</CellHead>
          <CellHead>Ship</CellHead>
        </Row>
      </TableHead>
      <TableBody>
        {history.xups.map((xup, i) => {
          return <HistoryLine xup={xup} key={i} />;
        })}
      </TableBody>
    </Table>
  );
}
