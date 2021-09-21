import React from "react";
import styled, { ThemeContext } from "styled-components";
import { ToastContext, AuthContext } from "../../contexts";
import { apiCall, errorToaster } from "../../api";
import { NavLink } from "react-router-dom";
import { TimeDisplay } from "./TimeDisplay.js";
import { Badge } from "../../Components/Badge";
import { Modal } from "../../Components/Modal";
import { FitDisplay } from "../../Components/FitDisplay";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrashAlt,
  faCheck,
  faExternalLinkAlt,
  faStream,
  faPlus,
  faExclamationTriangle,
  faInfoCircle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import _ from "lodash";

import egoldBadge from "../Guide/guides/badges/egold.png";

import { SkillDisplay } from "../../Components/SkillDisplay";
import { Box } from "../../Components/Box";
import { Title } from "../../Components/Page";
import { Button, InputGroup } from "../../Components/Form";

const tagBadges = {
  "WARPSPEED1-10": ["red", "W", "Warp Speed Implants"],
  "HYBRID1-10": ["red", "H", "Hybrid Implants"],
  "AMULET1-10": ["red", "A", "Amulet Implants"],
  ELITE: ["yellow", "E", "Elite"],
  "STARTER-SKILLS": ["neutral", "S", "Starter skills"],
  "HQ-FC": ["blue", "H", "HQ FC"],
  LOGI: ["green", "L", "Logi Specialist"],
};

async function approveFit(id) {
  return await apiCall("/api/waitlist/approve", {
    json: { id: id },
  });
}

async function rejectFit(id, review_comment) {
  return await apiCall("/api/waitlist/reject", {
    json: { id, review_comment },
  });
}

async function removeFit(id) {
  return await apiCall("/api/waitlist/remove_fit", {
    json: { id: id },
  });
}

async function invite(id, character_id) {
  return await apiCall("/api/waitlist/invite", {
    json: { id, character_id },
  });
}

async function openWindow(target_id, character_id) {
  return await apiCall(`/api/open_window`, {
    json: { target_id, character_id },
  });
}

const XCardDOM = styled.div`
  border: solid 2px ${(props) => props.theme.colors[props.variant].color};
  background-color: ${(props) => props.theme.colors[props.variant].color};
  color: ${(props) => props.theme.colors[props.variant].text};
  border-radius: 5px;
  font-size: 0.9em;
  filter: drop-shadow(0px 4px 5px ${(props) => props.theme.colors.shadow});
  min-width: 245px;

  a {
    color: inherit;
    text-decoration: none;
  }
`;
XCardDOM.Head = styled.div`
  display: flex;
  padding: 0.2em 0.2em 0.3em 0.5em;
  align-items: center;
  a {
    font-weight: 600;
  }
`;
XCardDOM.Head.Badges = styled.div`
  margin-left: auto;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  > * {
    margin-left: 0.25em;
  }
  > *:last-child {
    margin-left: 0.5em;
  }
  > span {
    display: flex;
    align-items: center;
  }
  img {
    height: 1.3em;
  }
`;
XCardDOM.Content = styled.div`
  display: flex;
  align-items: center;
  background-color: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
  img {
    margin-right: 0.5em;
    align-self: flex-start;
  }
  a {
    cursor: pointer;
  }
`;
XCardDOM.Footer = styled.div`
  display: flex;
  background-color: ${(props) => props.theme.colors.accent1};
  color: ${(props) => props.theme.colors.text};
  text-align: center;
  a:hover {
    background-color: ${(props) => props.theme.colors.accent2};
    cursor: pointer;
  }
  > * {
    flex-grow: 1;
    flex-basis: 0;
  }
`;
XCardDOM.ReviewComment = styled.div`
  padding: 0.5em;
  margin: 0.5em;
  width: 100%;
  text-align: center;
  background-color: ${(props) => props.theme.colors.secondary.color};
  border-radius: 5px;
  color: ${(props) => props.theme.colors.secondary.text};
`;

function ShipDisplay({ fit, onAction }) {
  const authContext = React.useContext(AuthContext);
  const toastContext = React.useContext(ToastContext);
  const [modalOpen, setModalOpen] = React.useState(false);

  const namePrefix = fit.character ? `${fit.character.name}'s ` : "";
  if (fit.dna && fit.hull) {
    return (
      <>
        {modalOpen ? (
          <Modal open={true} setOpen={setModalOpen}>
            <Box>
              {authContext.access["waitlist-manage"] && (
                <InputGroup style={{ marginBottom: "1em" }}>
                  <Button
                    variant="success"
                    onClick={(evt) => {
                      setModalOpen(false);
                      errorToaster(toastContext, approveFit(fit.id)).then(onAction);
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={(evt) => {
                      var rejectionReason = prompt(
                        "Why is the fit being rejected? (Will be displayed to pilot)"
                      );
                      if (rejectionReason) {
                        setModalOpen(false);
                        errorToaster(toastContext, rejectFit(fit.id, rejectionReason)).then(
                          onAction
                        );
                      }
                    }}
                  >
                    Reject
                  </Button>
                </InputGroup>
              )}

              <FitDisplay fit={fit} />
              {fit.tags.includes("STARTER-SKILLS") ? (
                <>
                  <Title>Starter skills</Title>
                  <SkillDisplay
                    characterId={fit.character.id}
                    ship={fit.hull.name}
                    filterMin={true}
                  />
                </>
              ) : null}
            </Box>
          </Modal>
        ) : null}
        <a onClick={(evt) => setModalOpen(true)}>
          <img
            style={{ height: "40px" }}
            src={`https://images.evetech.net/types/${fit.hull.id}/icon?size=64`}
            alt={fit.hull.name}
          />
        </a>
        <a style={{ flexShrink: 1 }} onClick={(evt) => setModalOpen(true)}>
          {namePrefix}
          {fit.hull.name}
        </a>
      </>
    );
  } else if (fit.hull) {
    return (
      <>
        <img
          style={{ height: "40px" }}
          src={`https://images.evetech.net/types/${fit.hull.id}/icon?size=64`}
          alt={fit.hull.name}
        />
        <span>
          {namePrefix}
          {fit.hull.name}
        </span>
      </>
    );
  } else {
    return (
      <>
        <img
          style={{ height: "40px" }}
          src={`https://images.evetech.net/types/28606/icon?size=64`}
          alt=""
        />
        <span>{namePrefix}Ship</span>
      </>
    );
  }
}

function SkillButton({ characterId, ship }) {
  const [onScreen, setOnScreen] = React.useState(false);
  const [chosenShip, setChosenShip] = React.useState(ship);

  return (
    <>
      <a title="Show skills" onClick={(evt) => setOnScreen(true)}>
        <FontAwesomeIcon icon={faStream} />
      </a>
      {onScreen && (
        <Modal open={true} setOpen={setOnScreen}>
          <Box>
            <SkillDisplay characterId={characterId} ship={chosenShip} setShip={setChosenShip} />
          </Box>
        </Modal>
      )}
    </>
  );
}

function Shield({ color, letter, title }) {
  const theme = React.useContext(ThemeContext);

  return (
    <span title={title}>
      <svg
        style={{ height: "1.2em", filter: `drop-shadow(0px 1px 1px ${theme.colors.shadow})` }}
        viewBox="0 0 26.5 27.8"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          <path
            style={{ fill: theme.colors.tdfShields[color] }}
            d="m 13.229167,0 c 0,0 6.085417,0.79375 13.229167,3.96875 0,0 -0.79375,10.054167 -3.961217,15.955009 -2.275956,4.239997 -6.622116,7.857491 -9.26795,7.857491 M 13.229167,0 C 13.229167,0 7.14375,0.79375 0,3.96875 c 0,0 0.79375,10.054167 3.9612174,15.955009 2.2759552,4.239997 6.6221156,7.857491 9.2679496,7.857491"
          />
          <text
            style={{
              fontSize: "1.3em",
              fontWeight: "700",
              textAnchor: "middle",
              fill: theme.colors.tdfShields.text,
              textRendering: "geometricPrecision",
            }}
            x="13.25"
            y="20.5"
          >
            {letter}
          </text>
        </g>
      </svg>
    </span>
  );
}

export function XCard({ entry, fit, onAction }) {
  const authContext = React.useContext(AuthContext);
  const toastContext = React.useContext(ToastContext);

  const accountName = entry.character ? entry.character.name : "Name hidden";
  var isSelf = entry.character && entry.character.id === authContext.account_id;
  var tagText = [];
  var tagImages = [];
  _.forEach(fit.tags || [], (tag) => {
    if (tag === "ELITE-GOLD") {
      tagImages.push(<img key={tag} src={egoldBadge} alt={"Elite GOLD"} title={"Elite GOLD"} />);
    } else if (tag in tagBadges) {
      tagImages.push(
        <Shield
          key={tag}
          color={tagBadges[tag][0]}
          letter={tagBadges[tag][1]}
          title={tagBadges[tag][2]}
        />
      );
    } else {
      tagText.push(tag);
    }
  });

  const approvalFlag = fit.approved ? null : (
    <span title="Pending approval">
      <FontAwesomeIcon icon={faExclamationTriangle} />
    </span>
  );

  return (
    <XCardDOM
      variant={
        fit.approved
          ? isSelf
            ? "success"
            : "secondary"
          : fit.approved
          ? "secondary"
          : fit.review_comment
          ? "danger"
          : isSelf || authContext.access["waitlist-view"]
          ? "warning"
          : "secondary"
      }
    >
      <XCardDOM.Head>
        <span>{accountName}</span>
        <XCardDOM.Head.Badges>
          {tagImages}
          {approvalFlag}
          <TimeDisplay relativeTo={entry.joined_at} />
        </XCardDOM.Head.Badges>
      </XCardDOM.Head>
      <XCardDOM.Content>
        <ShipDisplay fit={fit} onAction={onAction} />
      </XCardDOM.Content>
      <XCardDOM.Content>
        {tagText.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </XCardDOM.Content>
      {fit.review_comment ? (
        <XCardDOM.Content>
          <XCardDOM.ReviewComment>{fit.review_comment}</XCardDOM.ReviewComment>
        </XCardDOM.Content>
      ) : null}
      <XCardDOM.Footer>
        {entry.can_remove ? (
          <a
            title="Remove x-up"
            onClick={(evt) => errorToaster(toastContext, removeFit(fit.id)).then(onAction)}
          >
            <FontAwesomeIcon icon={faTrashAlt} />
          </a>
        ) : null}
        {authContext.access["waitlist-view"] && (
          <a
            title="Open in-game profile"
            onClick={(evt) =>
              errorToaster(toastContext, openWindow(fit.character.id, authContext.current.id))
            }
          >
            <FontAwesomeIcon icon={faExternalLinkAlt} />
          </a>
        )}
        {authContext.access["skill-view"] && (
          <SkillButton characterId={fit.character.id} ship={fit.hull.name} />
        )}
        {authContext.access["pilot-view"] && (
          <NavLink title="Pilot information" to={"/pilot?character_id=" + fit.character.id}>
            <FontAwesomeIcon icon={faInfoCircle} />
          </NavLink>
        )}
        {_.isFinite(fit.hours_in_fleet) ? (
          <span title="Hours in fleet">{fit.hours_in_fleet}h</span>
        ) : null}
        {authContext.access["waitlist-manage"] && (
          <a
            title="Reject"
            onClick={(evt) => {
              var rejectionReason = prompt(
                "Why is the fit being rejected? (Will be displayed to pilot)"
              );
              if (rejectionReason) {
                errorToaster(toastContext, rejectFit(fit.id, rejectionReason)).then(onAction);
              }
            }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </a>
        )}
        {authContext.access["fleet-invite"] && fit.approved && (
          <a
            title="Invite"
            onClick={(evt) =>
              errorToaster(toastContext, invite(fit.id, authContext.current.id)).then(onAction)
            }
          >
            <FontAwesomeIcon icon={faPlus} />
          </a>
        )}
        {authContext.access["waitlist-manage"] && !fit.approved && (
          <a
            title="Approve"
            onClick={(evt) => errorToaster(toastContext, approveFit(fit.id)).then(onAction)}
          >
            <FontAwesomeIcon icon={faCheck} />
          </a>
        )}
      </XCardDOM.Footer>
    </XCardDOM>
  );
}
