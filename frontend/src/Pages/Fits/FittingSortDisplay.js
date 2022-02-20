import styled from "styled-components";
import _ from "lodash";
import { DNADisplay } from "../../Components/FitDisplay";
import { Box } from "../../Components/Box";
import React from "react";
import { Modal } from "../../Components/Modal";
import { Title } from "../../Components/Page";
import { Shield } from "../Waitlist/XCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";

const FitCard = styled.div`
  border: solid 2px ${(props) => props.theme.colors[props.variant].color};
  border-radius: 5px;
  font-size: 0.9em;
  filter: drop-shadow(0px 4px 5px ${(props) => props.theme.colors.shadow});
  width: 360px;
  a {
  }
  &:hover:not(:disabled):not(.static) {
    border-color: ${(props) => props.theme.colors.accent3};
	cursor: pointer;
`;

FitCard.Content = styled.div`
  display: flex;
  align-items: center;
  background-color: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
  border-radius: 5px;
  img {
    border-radius: 3px 0px 0px 3px;
    margin-right: 0.5em;
    align-self: flex-start;
  }
}
`;
FitCard.Content.Badges = styled.div`
  margin-left: auto;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  > * {
    margin-left: 0.1em;
  }
  > *:last-child {
    margin-left: 0.4em;
    margin-right: 0.5em;
  }
  > span {
    display: flex;
    align-items: center;
  }
  img {
    height: 1.3em;
  }
`;

const NoteUI = styled.div`
  padding: 0.2em 0em;
  display: flex;
  > tex {
    background-color: ${(props) => props.theme.colors[props.variant].color};
    color: ${(props) => props.theme.colors.text};
    border-radius: 5px;
    width: 100%;
    max-width: 500px;
    filter: drop-shadow(0px 4px 5px ${(props) => props.theme.colors.shadow});
    padding: 0.1em 0.5em;
  }
`;

const DisplayDOM = styled.div`
  display: flex;
  flex-wrap: wrap;
  > div {
    padding: 0.5em;
  }
`;

function Fitout({ data, tier }) {
  var dps = [];
  var logi = [];
  var logiid = [];
  var notes = {};
  var fitnote;
  _.forEach(data.rules, (ship) => {
    logiid.push(ship);
  });
  _.forEach(data.notes, (note) => {
    notes[note.name] = note.description;
  });

  _.forEach(data.fittingdata, function (value, key) {
    if (
      (tier === "Other" && value.name.split("_").length === 2) ||
      (value.name.toLowerCase().indexOf(tier.toLowerCase()) !== -1 && value.dna && value.name)
    ) {
      const id = value.dna.split(":", 1)[0];
      if (value.name in notes) {
        fitnote = notes[value.name];
      } else {
        fitnote = null;
      }
      if (logiid.includes(parseInt(id))) {
        logi.push(
          <div key={key}>
            <ShipDisplay
              fit={value}
              id={id}
              hybrid={value.name.indexOf("HYBRID") !== -1}
              note={fitnote}
            />
          </div>
        );
      } else {
        dps.push(
          <div key={key}>
            <ShipDisplay
              fit={value}
              id={id}
              hybrid={value.name.indexOf("HYBRID") !== -1}
              note={fitnote}
            />
          </div>
        );
      }
    }
  });
  if (tier === "Other") {
    return (
      <>
        <div style={{ margin: "2.5em 0em" }}>
          <Title>Secondary Support Ships</Title>
          <p>These ships are never used as main characters in fleet.</p>
          <DisplayDOM>{dps}</DisplayDOM>
        </div>
      </>
    );
  } else {
    return (
      <>
        <div style={{ margin: "2.5em 0em" }}>
          <Title>DPS</Title>
          {tier === "Starter" ? (
            <p>
              These are the only ships you can fly with all <b>Armor Compensation</b> skills at
              level 2, all others require at least 4.
            </p>
          ) : (
            <br />
          )}
          <DisplayDOM>{dps}</DisplayDOM>
          <br />
          <Title>LOGISTICS</Title>
          <br />
          <DisplayDOM>{logi}</DisplayDOM>
        </div>
      </>
    );
  }
}

function ShipDisplay({ fit, id, hybrid, note }) {
  const [modalOpen, setModalOpen] = React.useState(false);
  return (
    <>
      {modalOpen ? (
        <Modal open={true} setOpen={setModalOpen}>
          <Box>
            <div style={{ display: "flex" }}>
              <div style={{ margin: "0 0.5em" }}>
                <DNADisplay dna={fit.dna} />
              </div>
            </div>
            {note ? (
              <NoteUI variant={"warning"}>
                <tex>{note}</tex>
              </NoteUI>
            ) : null}
            {hybrid ? (
              <NoteUI variant={"danger"}>
                <tex>
                  HYBRID FIT! This fit requires at least Amulet 1 - 5. See mailing list: <br />
                  TDF-Implant1
                </tex>
              </NoteUI>
            ) : null}
          </Box>
        </Modal>
      ) : null}
      <Box>
        <FitCard variant={"secondary"}>
          <a onClick={(evt) => setModalOpen(true)}>
            <FitCard.Content>
              <img
                style={{ height: "64px" }}
                src={`https://images.evetech.net/types/${id}/icon`}
                alt={fit.name}
              />
              {fit.name}

              <FitCard.Content.Badges>
                {note ? <FontAwesomeIcon icon={faExclamationCircle} /> : null}
                {hybrid ? <Shield color="red" letter="H" title="Hybrid Implants" /> : null}
              </FitCard.Content.Badges>
            </FitCard.Content>
          </a>
        </FitCard>
      </Box>
    </>
  );
}

export { Fitout };
