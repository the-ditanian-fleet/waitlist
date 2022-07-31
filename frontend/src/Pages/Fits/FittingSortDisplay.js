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
import { BadgeDOM, BadgeModal } from "../../Components/Badge";
import hbadge from "../Guide/badges/h.png";
import wbadge from "../Guide/badges/w.png";

export const FitCard = styled.div`
  border: solid 2px ${(props) => props.theme.colors.accent2};
  background-color: ${(props) => props.theme.colors.background};
  border-radius: 5px;
  font-size: 0.9em;
  filter: drop-shadow(0px 3px 4px ${(props) => props.theme.colors.shadow});
  width: 380px;
  a {
  }
  &:hover:not(:disabled):not(.static) {
    border-color: ${(props) => props.theme.colors.accent3};
    cursor: pointer;
  }
  @media (max-width: 480px) {
    width: 100%;
  }
`;

FitCard.Content = styled.div`
  display: flex;
  align-items: center;
  
  color: ${(props) => props.theme.colors.text};
  p {
	  @media (max-width: 480px) {
		  font-size: 3.1vw;
		}
		
	}
  
  
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
  align-items: center;
  > * {
  }
  > *:last-child {
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
    font-size: 1em;
    > *:last-child {
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

function Fitout({ data, tier }) {
  var dps = [];
  var logi = [];
  var logiid = [];
  var notes = {};
  var fitnote;
  var ships;
  if (tier === "Antigank") {
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
      if (!(tier !== "Antigank" && ship.name.toLowerCase().indexOf("antigank") !== -1)) {
        const id = ship.dna.split(":", 1)[0];
        if (ship.name in notes) {
          fitnote = notes[ship.name];
        } else {
          fitnote = null;
        }
        if (logiid.includes(parseInt(id))) {
          logi.push(<ShipDisplay key={ship.name} fit={ship} id={id} note={fitnote} />);
        } else {
          dps.push(<ShipDisplay key={ship.name} fit={ship} id={id} note={fitnote} />);
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
          {dps.length !== 0 && (
            <>
              <Title>DPS</Title>
              <DisplayDOM>{dps}</DisplayDOM>
            </>
          )}
          <br />
          {logi.length !== 0 && (
            <>
              <Title>LOGISTICS</Title>
              <DisplayDOM>{logi}</DisplayDOM>
            </>
          )}
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
      <Box mpadding={"0.2em"} style={{ margin: "0.5em 0" }}>
        <FitCard variant={"input"}>
          <a onClick={(evt) => setModalOpen(true)}>
            <FitCard.Content>
              <img
                style={{ height: "64px" }}
                src={`https://images.evetech.net/types/${id}/icon`}
                alt={fit.name}
              />
              <p>{fit.name}</p>
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
          <Box style={{ width: "100%" }}>
            <BadgeModal style={{ width: "100%" }}>
              <BadgeModal.Title>
                <div>
                  <img src={img} alt={name} style={{ width: "1.8em", marginRight: "0.5em" }} />
                </div>
                <Title>{name} &nbsp;</Title>
              </BadgeModal.Title>
            </BadgeModal>
            <b>Only visible on waitlist X-UP. </b>
            <br />
            <br />
            <ImplantTable type={name} />
          </Box>
        </Modal>
      ) : null}

      <BadgeDOM>
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
