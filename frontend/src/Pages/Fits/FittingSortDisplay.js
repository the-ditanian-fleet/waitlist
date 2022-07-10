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
import { Markdown } from "../../Components/Markdown";
import hbadge from "../Guide/badges/h.png";
import wbadge from "../Guide/badges/w.png";

export const FitCard = styled.div`
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
  width: 100%;
  @media (max-width: 480px) {
    justify-content: center;
  }
`;

export const BadgeDOM = styled.div`
  margin: 0em 0.5em 0.5em 0;
  border: solid 2px ${(props) => props.theme.colors[props.variant || "secondary"].color};
  border-radius: 5px;
  font-size: 1em;
  filter: drop-shadow(0px 3px 4px ${(props) => props.theme.colors.shadow});
  width: 180px;
  height: 2.6em;
  a {
  }
  &:hover:not(:disabled):not(.static) {
    border-color: ${(props) => props.theme.colors.accent3};
    cursor: pointer;
  }
  @media (max-width: 480px) {
    width: 100%;
    font-size: 0.75em;
    height: 4em;
    margin: 0em 0.5em 1em 0;
  }
`;
BadgeDOM.Content = styled.div`
  display: flex;
  height: 100%;
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
BadgeDOM.Icon = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-right: 0.2em;
  width: fit-content;
  padding: 0em 0.4em 0em;
  @media (max-width: 480px) {
    font-size: 1.3em;
  }
`;

const ModalDOM = styled.div`
  @media (max-width: 480px) {
    width: 100%;
  }
`;
ModalDOM.Title = styled.div`
  border-bottom: 3px solid;
  padding-bottom: 5px;
  margin-bottom: 1em;
  display: flex;
  border-color: ${(props) => props.theme.colors.accent3};
`;

function Fitout({ data, tier }) {
  var dps = [];
  var logi = [];
  var logiid = [];
  var notes = {};
  var fitnote;
  var ships;
  if (tier === "Nogank") {
    ships = data.fittingdata;
  } else {
    ships = _.sortBy(data.fittingdata, function (item) {
      return item.name.indexOf("HYBRID");
    });
  }

  _.forEach(data.rules, (ship) => {
    logiid.push(ship);
  });
  _.forEach(data.notes, (note) => {
    notes[note.name] = note.description;
  });

  ships.forEach((ship) => {
    if (
      ship.dna &&
      ship.name &&
      ((tier === "Other" && ship.name.split("_").length === 2) ||
        ship.name.toLowerCase().indexOf(tier.toLowerCase()) !== -1)
    ) {
      if (!(tier !== "Nogank" && ship.name.toLowerCase().indexOf("nogank") !== -1)) {
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
    }
  });
  if (tier === "Other") {
    return (
      <>
        <div>
          <div style={{ padding: "1em 0 0.4em" }}>
            <p>These ships are never used as main characters in fleet.</p>
          </div>
          <Title>Secondary Support Ships</Title>
          <DisplayDOM>{dps}</DisplayDOM>
        </div>
      </>
    );
  } else {
    return (
      <>
        <div>
          <div style={{ padding: "1em 0 0.4em" }}>
            {tier in notes ? <Markdown>{notes[tier]}</Markdown> : <br />}
          </div>
          <Title>DPS</Title>
          <DisplayDOM>{dps}</DisplayDOM>
          <br />
          <Title>LOGISTICS</Title>
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
            {note ? (
              <Note variant={"secondary"}>
                <Markdown>{note}</Markdown>
              </Note>
            ) : null}
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
        <ImplantButton name="Ascendancy" img={wbadge} />
        <ImplantButton name="Hybrid" img={hbadge} />
      </DisplayDOM>
    </>
  );
}

function ImplantButton({ name, img }) {
  const [modalOpen, setModalOpen] = React.useState(false);
  return (
    <>
      {modalOpen ? (
        <Modal open={true} setOpen={setModalOpen}>
          <Box style={{ width: "max-content" }}>
            <ModalDOM>
              <ModalDOM.Title>
                <div>
                  <img src={img} alt={name} style={{ width: "1.8em", marginRight: "0.5em" }} />
                </div>
                <Title>{name} &nbsp;</Title>
              </ModalDOM.Title>
            </ModalDOM>
            <b>Only visible on waitlist X-UP. </b>
            <br />
            <br />
            <ImplantTable type={name} />
          </Box>
        </Modal>
      ) : null}

      <BadgeDOM variant={"secondary"}>
        <a onClick={(evt) => setModalOpen(true)}>
          <BadgeDOM.Content>
            <BadgeDOM.Icon>
              <img src={img} alt={name} style={{ width: "1.5em" }} />
            </BadgeDOM.Icon>
            {name}
          </BadgeDOM.Content>
        </a>
      </BadgeDOM>
    </>
  );
}

export { Fitout, ImplantOut };
