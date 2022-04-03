import styled from "styled-components";
import _ from "lodash";
import { DNADisplay } from "../../Components/FitDisplay";
import { ImplantTable } from "./ImplantText";
import { Box } from "../../Components/Box";
import React from "react";
import { Modal } from "../../Components/Modal";
import { Title } from "../../Components/Page";
import { Note } from "../../Components/NoteBox";
import { Shield } from "../../Components/Badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";

const FitCard = styled.div`
  border: solid 2px ${(props) => props.theme.colors[props.variant].color};
  border-radius: 5px;
  font-size: 0.9em;
  filter: drop-shadow(0px 3px 4px ${(props) => props.theme.colors.shadow});
  width: ${(props) => (props.size ? props.size : "360px")};
  a {
  }
  &:hover:not(:disabled):not(.static) {
    border-color: ${(props) => props.theme.colors.accent3};
    cursor: pointer;
  }
  @media (max-width: 480px) {
    width: ${(props) => (props.size ? props.size : "320px")};
    font-size: 0.75em;
  }
`;

FitCard.Content = styled.div`
  display: flex;
  align-items: center;
  background-color: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
  border-radius: 3px;
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
    margin-left: 0.25em;
    margin-right: 0.5em;
  }
  > span {
    display: flex;
    align-items: center;
  }
  img {
    height: 1.3em;
  }
  @media (max-width: 480px) {
    font-size: 1.2em;
    > *:last-child {
      margin-left: 0.1em;
      margin-right: 0.4em;
    }
  }
`;

const DisplayDOM = styled.div`
  display: flex;
  flex-wrap: wrap;
  @media (max-width: 480px) {
    justify-content: center;
  }
`;

const ImplantB = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-right: 0.2em;
  width: fit-content;
  height: 24px;
  padding: 0.2em 0.2em 0em;
  @media (max-width: 480px) {
    font-size: 1.3em;
  }
`;

function Fitout({ data, tier }) {
  var dps = [];
  var logi = [];
  var logiid = [];
  var notes = {};
  var fitnote;
  const ships = _.sortBy(data.fittingdata, function (item) {
    return item.name.indexOf("HYBRID");
  });
  _.forEach(data.rules, (ship) => {
    logiid.push(ship);
  });
  _.forEach(data.notes, (note) => {
    notes[note.name] = note.description;
  });

  ships.forEach((ship) => {
    if (
      (tier === "Other" && ship.name.split("_").length === 2) ||
      (ship.name.toLowerCase().indexOf(tier.toLowerCase()) !== -1 && ship.dna && ship.name)
    ) {
      const id = ship.dna.split(":", 1)[0];
      if (ship.name in notes) {
        fitnote = notes[ship.name];
      } else {
        fitnote = null;
      }
      if (logiid.includes(parseInt(id))) {
        logi.push(
          <div key={ship.name}>
            <ShipDisplay fit={ship} id={id} note={fitnote} />
          </div>
        );
      } else {
        dps.push(
          <div key={ship.name}>
            <ShipDisplay fit={ship} id={id} note={fitnote} />
          </div>
        );
      }
    }
  });
  if (tier === "Other") {
    return (
      <>
        <div style={{ margin: "0.5em 0em" }}>
          <Title>Secondary Support Ships</Title>
          <p>These ships are never used as main characters in fleet.</p>
          <DisplayDOM>{dps}</DisplayDOM>
        </div>
      </>
    );
  } else {
    return (
      <>
        <div style={{ margin: "0.5em 0em" }}>
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

function ShipDisplay({ fit, id, note }) {
  const [modalOpen, setModalOpen] = React.useState(false);
  return (
    <>
      {modalOpen ? (
        <Modal open={true} setOpen={setModalOpen}>
          <Box>
            <div style={{ display: "flex" }}>
              <div style={{ margin: "0 0.5em" }}>
                <DNADisplay dna={fit.dna} name={fit.name} />
              </div>
            </div>
            {note ? <Note variant={"secondary"}>{note}</Note> : null}
            {fit.name.indexOf("HYBRID") !== -1 ? (
              <Note variant={"danger"}>
                <p>
                  HYBRID FIT! This fit requires at least Amulet 1 - 5. <br /> See implants above or
                  mailing list: <b>TDF-Implant1</b>
                </p>
              </Note>
            ) : fit.name.indexOf("ASCENDANCY") !== -1 ? (
              <Note variant={"danger"}>
                <p>
                  ASCENDANCY FIT! This fit requires at least Ascendancy 1 - 5 & WS-618. <br /> See
                  implants above or mailing list: <b>TDF-Implant1</b>
                </p>
              </Note>
            ) : null}
          </Box>
        </Modal>
      ) : null}
      <Box>
        <div style={{ margin: "0.5em 0" }}>
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
                  {fit.name.indexOf("HYBRID") !== -1 ? (
                    <Shield color="red" letter="H" title="Hybrid Implants" />
                  ) : fit.name.indexOf("ASCENDANCY") !== -1 ? (
                    <Shield color="red" letter="W" title="Ascendancy Implants" />
                  ) : null}
                </FitCard.Content.Badges>
              </FitCard.Content>
            </a>
          </FitCard>
        </div>
      </Box>
    </>
  );
}

function ImplantOut() {
  return (
    <>
      <DisplayDOM style={{ justifyContent: "initial" }}>
        <ImplantButton name="Ascendancy" />
        <ImplantButton name="Hybrid" />
      </DisplayDOM>
    </>
  );
}

function ImplantButton({ name }) {
  const [modalOpen, setModalOpen] = React.useState(false);
  var letter = name[0];
  if (name === "Ascendancy") {
    letter = "W";
  }
  return (
    <>
      {modalOpen ? (
        <Modal open={true} setOpen={setModalOpen}>
          <Box style={{ width: "max-content" }}>
            <div style={{ display: "flex" }}>
              <Title>{name} &nbsp;</Title>
              <Shield color="red" letter={letter} h="33px" />
            </div>
            <br />
            <ImplantTable type={name} />
          </Box>
        </Modal>
      ) : null}
      <div style={{ margin: "0 0.5em 0 0" }}>
        <FitCard variant={"secondary"} size={"108px"}>
          <a onClick={(evt) => setModalOpen(true)}>
            <FitCard.Content>
              <ImplantB>
                <Shield color="red" letter={letter} h="18px" />
              </ImplantB>
              {name}
            </FitCard.Content>
          </a>
        </FitCard>
      </div>
    </>
  );
}

export { Fitout, ImplantOut };
