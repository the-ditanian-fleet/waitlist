import React from "react";
import styled from "styled-components";
import { ToastContext, genericCatch, toastHttp } from "../../Toast";
import { AuthContext } from "../../Auth";
import { NavLink } from "react-router-dom";
import { TimeDisplay } from "./TimeDisplay.js";
import { Badge } from "../../Components/Badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrashAlt,
  faCheck,
  faExternalLinkAlt,
  faStream,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

async function approveFit(id) {
  const result = await fetch("/api/waitlist/approve", {
    method: "POST",
    body: JSON.stringify({ id: id }),
    headers: { "Content-Type": "application/json" },
  });
  return await result.text();
}

async function removeFit(id) {
  const result = await fetch("/api/waitlist/remove_fit", {
    method: "POST",
    body: JSON.stringify({ id: id }),
    headers: { "Content-Type": "application/json" },
  });
  return await result.text();
}

async function invite(id, character_id) {
  return await fetch("/api/waitlist/invite", {
    method: "POST",
    body: JSON.stringify({ id, character_id }),
    headers: { "Content-Type": "application/json" },
  });
}

async function openWindow(target_id, character_id) {
  return await fetch(`/api/open_window`, {
    method: "POST",
    body: JSON.stringify({ target_id, character_id }),
    headers: { "Content-Type": "application/json" },
  });
}

const XCardDOM = styled.div`
  border: solid 2px ${(props) => props.theme.colors[props.variant].color};
  background-color: ${(props) => props.theme.colors[props.variant].color};
  color: ${(props) => props.theme.colors[props.variant].text};
  border-radius: 5px;
  font-size: 0.9em;
  box-shadow: 0px 3px 10px 5px ${(props) => props.theme.colors.shadow};
  margin-bottom: 1.5em;

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

function ShipDisplay({ fit }) {
  const namePrefix = fit.character ? `${fit.character.name}'s ` : "";
  if (fit.dna && fit.hull) {
    return (
      <>
        <a style={{ flexShrink: 1 }} href={"fitting:" + fit.dna}>
          <img
            style={{ height: "40px" }}
            src={"https://imageserver.eveonline.com/Type/" + fit.hull.id + "_64.png"}
            alt={fit.hull.name}
          />
        </a>
        <a style={{ flexShrink: 1 }} href={"fitting:" + fit.dna}>
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

  return (
    <XCardDOM variant={isSelf ? "success" : needsApproval ? "warning" : "secondary"}>
      <XCardDOM.Head>
        {entry.character ? (
          <a href={"char:" + entry.character.id}>{accountName}</a>
        ) : (
          <span>{accountName}</span>
        )}
        <XCardDOM.Head.Badges>
          <TimeDisplay relativeTo={entry.joined_at} />
        </XCardDOM.Head.Badges>
      </XCardDOM.Head>
      <XCardDOM.Content>
        <ShipDisplay fit={fit} />
      </XCardDOM.Content>
      <XCardDOM.Content>
        {fit.tags && fit.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
      </XCardDOM.Content>
      <XCardDOM.Footer>
        {entry.can_remove ? (
          <a
            title="Remove x-up"
            onClick={(evt) => removeFit(fit.id).then(onAction).catch(genericCatch(toastContext))}
          >
            <FontAwesomeIcon icon={faTrashAlt} />
          </a>
        ) : null}

        {entry.can_manage ? (
          <>
            <a
              title="Open in-game profile"
              onClick={(evt) =>
                openWindow(entry.character.id, authContext.current.id).then(
                  toastHttp(toastContext, null)
                )
              }
            >
              <FontAwesomeIcon icon={faExternalLinkAlt} />
            </a>
            <NavLink title="Show skills" to={"/skills?character_id=" + fit.character.id}>
              <FontAwesomeIcon icon={faStream} />
            </NavLink>
            {fit.approved ? (
              <a
                title="Invite"
                onClick={(evt) =>
                  invite(fit.id, authContext.current.id)
                    .then(toastHttp(toastContext, null))
                    .then(onAction)
                }
              >
                <FontAwesomeIcon icon={faPlus} />
              </a>
            ) : (
              <a
                title="Approve"
                onClick={(evt) =>
                  approveFit(fit.id).then(onAction).catch(genericCatch(toastContext))
                }
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
