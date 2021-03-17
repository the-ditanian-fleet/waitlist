import React from "react";
import styled from "styled-components";
import { ToastContext, AuthContext } from "../../contexts";
import { apiCall, errorToaster } from "../../api";
import { NavLink } from "react-router-dom";
import { TimeDisplay } from "./TimeDisplay.js";
import { Badge } from "../../Components/Badge";
import { Box } from "../../Components/Box";
import { Modal } from "../../Components/Modal";
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

import wBadge from "../Guide/guides/badges/w.png";
import hBadge from "../Guide/guides/badges/h.png";
import aBadge from "../Guide/guides/badges/a.png";
import eBadge from "../Guide/guides/badges/e.png";
import egoldBadge from "../Guide/guides/badges/egold.png";
import alphaBadge from "../Guide/guides/badges/alpha.png";

const tagBadges = {
  "WARPSPEED1-10": [wBadge, "Warp Speed Implants"],
  "HYBRID1-10": [hBadge, "Hybrid Implants"],
  "AMULET1-10": [aBadge, "Amulet Implants"],
  ELITE: [eBadge, "Elite"],
  "ELITE-GOLD": [egoldBadge, "Elite GOLD"],
  "NO-MINSKILLS": [alphaBadge, "Below minimum skills"],
};

async function approveFit(id) {
  return await apiCall("/api/waitlist/approve", {
    json: { id: id },
  });
}

async function rejectFit(id, reject_reason) {
  return await apiCall("/api/waitlist/reject", {
    json: { id, reject_reason },
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
  box-shadow: 0px 3px 10px 5px ${(props) => props.theme.colors.shadow};
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
  img {
    height: 1.5em;
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
XCardDOM.Rejection = styled.div`
  padding: 0.5em;
  margin: 0.5em;
  width: 100%;
  text-align: center;
  background-color: ${(props) => props.theme.colors.danger.color};
  border-radius: 5px;
  color: ${(props) => props.theme.colors.danger.text};
`;

function FitDisplay({ name, dna }) {
  React.useEffect(() => {
    if (window.eveui) {
      window.eveui.expand();
    }
  });

  return (
    <div>
      <a data-eveui-expand href={`fitting:${dna}`}>
        {name}
      </a>
    </div>
  );
}

function ImplantDisplay({ implants }) {
  const podDna = implants.map((implant) => `${implant};1`).join(":");
  return <FitDisplay name="Capsule" dna={`670:${podDna}::`} />;
}

const FitAnalysisDOM = styled.div`
  margin-bottom: 1em;

  h2 {
    font-size: 1.5em;
  }
  strong {
    font-weight: bold;
  }
`;

function FitAnalysis({ source }) {
  if (!source) {
    return (
      <FitAnalysisDOM>
        <h2>UNKNOWN_FIT</h2>
      </FitAnalysisDOM>
    );
  }

  const idLookup = source._ids || {};
  const analysis = [];
  _.forEach(source.missing || {}, (count, itemId) => {
    analysis.push(
      <p key={itemId}>
        Missing <strong>{idLookup[itemId]}</strong>: {count}
      </p>
    );
  });
  _.forEach(source.extra, (count, itemId) => {
    analysis.push(
      <p key={itemId}>
        Extra <strong>{idLookup[itemId]}</strong>: {count}
      </p>
    );
  });
  _.forEach(source.downgraded || {}, (downgrades, originalItem) => {
    _.forEach(downgrades, (count, newItem) => {
      analysis.push(
        <p key={`${originalItem} ${newItem}`}>
          Downgraded <strong>{idLookup[originalItem]}</strong> to{" "}
          <strong>{idLookup[newItem]}</strong>: {count}
        </p>
      );
    });
  });
  return (
    <FitAnalysisDOM>
      {source.name ? <h2>{source.name}</h2> : <h2>UNKNOWN_FIT</h2>}
      {analysis}
    </FitAnalysisDOM>
  );
}

function ShipDisplay({ fit }) {
  const [modalOpen, setModalOpen] = React.useState(false);

  const namePrefix = fit.character ? `${fit.character.name}'s ` : "";
  if (fit.dna && fit.hull) {
    return (
      <>
        {modalOpen ? (
          <Modal open={true} setOpen={setModalOpen}>
            <Box>
              <FitAnalysis source={fit.fit_analysis} />
              <div style={{ display: "flex" }}>
                <FitDisplay name={`${namePrefix} ${fit.hull.name}`} dna={fit.dna} />
                {fit.implants ? <ImplantDisplay implants={fit.implants} /> : null}
              </div>
            </Box>
          </Modal>
        ) : null}
        <a onClick={(evt) => setModalOpen(true)}>
          <img
            style={{ height: "40px" }}
            src={"https://imageserver.eveonline.com/Type/" + fit.hull.id + "_64.png"}
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
          src={"https://imageserver.eveonline.com/Type/" + fit.hull.id + "_64.png"}
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
          src={"https://imageserver.eveonline.com/Type/28606_64.png"}
          alt=""
        />
        <span>{namePrefix}Ship</span>
      </>
    );
  }
}

export function XCard({ entry, fit, onAction }) {
  const authContext = React.useContext(AuthContext);
  const toastContext = React.useContext(ToastContext);

  const accountName = entry.character ? entry.character.name : "Name hidden";
  var isSelf = entry.character && entry.character.id === authContext.account_id;
  var needsApproval = entry.can_manage && !fit.approved;
  var tagText = [];
  var tagImages = [];
  _.forEach(fit.tags || [], (tag) => {
    if (tag in tagBadges) {
      tagImages.push(
        <img key={tag} src={tagBadges[tag][0]} alt={tagBadges[tag][1]} title={tagBadges[tag][1]} />
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
        fit.reject_reason ? "danger" : isSelf ? "success" : needsApproval ? "warning" : "secondary"
      }
    >
      <XCardDOM.Head>
        {entry.character ? (
          <a href={"char:" + entry.character.id}>{accountName}</a>
        ) : (
          <span>{accountName}</span>
        )}
        <XCardDOM.Head.Badges>
          {tagImages}
          {approvalFlag}
          <TimeDisplay relativeTo={entry.joined_at} />
        </XCardDOM.Head.Badges>
      </XCardDOM.Head>
      <XCardDOM.Content>
        <ShipDisplay fit={fit} />
      </XCardDOM.Content>
      <XCardDOM.Content>
        {tagText.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </XCardDOM.Content>
      {fit.reject_reason ? (
        <XCardDOM.Content>
          <XCardDOM.Rejection>{fit.reject_reason}</XCardDOM.Rejection>
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

        {entry.can_manage ? (
          <>
            <a
              title="Open in-game profile"
              onClick={(evt) =>
                errorToaster(toastContext, openWindow(entry.character.id, authContext.current.id))
              }
            >
              <FontAwesomeIcon icon={faExternalLinkAlt} />
            </a>
            <NavLink
              title="Show skills"
              to={`/skills?character_id=${fit.character.id}&ship=${fit.hull.name}`}
            >
              <FontAwesomeIcon icon={faStream} />
            </NavLink>
            <NavLink title="Pilot information" to={"/pilot?character_id=" + fit.character.id}>
              <FontAwesomeIcon icon={faInfoCircle} />
            </NavLink>
            {_.isFinite(fit.hours_in_fleet) ? (
              <span title="Hours in fleet">{fit.hours_in_fleet}h</span>
            ) : null}
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
            {fit.approved ? (
              <a
                title="Invite"
                onClick={(evt) =>
                  errorToaster(toastContext, invite(fit.id, authContext.current.id)).then(onAction)
                }
              >
                <FontAwesomeIcon icon={faPlus} />
              </a>
            ) : (
              <a
                title="Approve"
                onClick={(evt) => errorToaster(toastContext, approveFit(fit.id)).then(onAction)}
              >
                <FontAwesomeIcon icon={faCheck} />
              </a>
            )}
          </>
        ) : null}
      </XCardDOM.Footer>
    </XCardDOM>
  );
}
