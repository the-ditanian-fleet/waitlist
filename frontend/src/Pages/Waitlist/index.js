import React from "react";
import Xup from "./xup";
import "./waitlist.scss";
import { ToastContext, genericCatch, toastHttp } from "../../Toast";
import { AuthContext } from "../../Auth";
import { EventContext } from "../../Event";
import { NavLink } from "react-router-dom";
import { TimeDisplay } from "./TimeDisplay.js";

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

async function removeEntry(id) {
  const result = await fetch("/api/waitlist/remove_x", {
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

function coalesceCalls(func, wait) {
  var timer = null;
  var nextCall = null;

  return function () {
    if (timer) {
      nextCall = [this, arguments];
      return;
    }

    timer = setInterval(function () {
      if (nextCall) {
        var context = nextCall[0];
        var args = nextCall[1];
        nextCall = null;
        func.apply(context, args);
      } else {
        clearInterval(timer);
        timer = null;
      }
    }, wait);
    func.apply(this, arguments);
  };
}

function XFit({ entry, fit, onAction }) {
  const toastContext = React.useContext(ToastContext);
  const authContext = React.useContext(AuthContext);
  var charName = fit.character ? fit.character.name : "Name hidden";
  var fitDescription;
  if (fit.dna && fit.hull) {
    fitDescription = (
      <span>
        <a href={"fitting:" + fit.dna}>
          <img
            src={"https://imageserver.eveonline.com/Type/" + fit.hull.id + "_64.png"}
            alt={fit.hull.name}
          />{" "}
          {charName}&apos;s {fit.hull.name}
        </a>
        {` (${fit.category})`}
      </span>
    );
  } else if (fit.hull) {
    fitDescription = (
      <span>
        <img
          src={"https://imageserver.eveonline.com/Type/" + fit.hull.id + "_64.png"}
          alt={fit.hull.name}
        />{" "}
        {charName}&apos;s {fit.hull.name}
        {` (${fit.category})`}
      </span>
    );
  } else {
    fitDescription = (
      <span>
        <img src={"https://imageserver.eveonline.com/Type/28606_64.png"} alt="" /> {charName}&apos;s
        ship
        {` (${fit.category})`}
      </span>
    );
  }

  return (
    <div className="waitlist-row">
      <div className="buttons are-small waitlist-buttons is-pulled-right">
        {entry.can_manage ? (
          <>
            {fit.approved ? (
              <button
                className="button"
                onClick={(evt) =>
                  invite(fit.id, authContext.current.id)
                    .then(toastHttp(toastContext, null))
                    .then(onAction)
                }
              >
                Invite
              </button>
            ) : (
              <button
                className="button"
                onClick={(evt) =>
                  approveFit(fit.id).then(onAction).catch(genericCatch(toastContext))
                }
              >
                Approve
              </button>
            )}
            <NavLink className="button" to={`/skills?character_id=${fit.character.id}`}>
              Skills
            </NavLink>
          </>
        ) : null}
        {!entry.can_remove ? null : (
          <button
            className="delete"
            onClick={(evt) => removeFit(fit.id).then(onAction).catch(genericCatch(toastContext))}
          >
            Delete
          </button>
        )}
      </div>
      {fitDescription}
      {fit.tags
        ? fit.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))
        : null}
    </div>
  );
}

function XEntry({ entry, i, onAction }) {
  const toastContext = React.useContext(ToastContext);
  const authContext = React.useContext(AuthContext);
  var fits = [];

  entry.fits.forEach((fit) => {
    fits.push(<XFit key={fit.id} entry={entry} fit={fit} onAction={onAction} />);
  });

  var isSelf = entry.character && entry.character.id === authContext.account_id;
  var needsApproval = entry.can_manage && entry.fits.filter((fit) => !fit.approved).length;

  var charLink = entry.character ? (
    <span>
      {i}
      {". "}
      <a href={"char:" + entry.character.id}>{entry.character.name}</a>
      {entry.can_manage ? (
        <>
          {" ("}
          <button
            className="button-link"
            onClick={(evt) =>
              openWindow(entry.character.id, authContext.current.id).then(
                toastHttp(toastContext, null)
              )
            }
          >
            Open
          </button>
          {")"}
        </>
      ) : null}
    </span>
  ) : (
    <span>
      {i}
      {". "}Name hidden
    </span>
  );

  return (
    <article
      className={"message is-small " + (isSelf ? "is-success" : needsApproval ? "is-warning" : "")}
    >
      <div className="message-header">
        {charLink}
        <div>
          <TimeDisplay relativeTo={entry.joined_at} />
          {entry.can_remove ? (
            <button
              className="delete is-small"
              onClick={(evt) =>
                removeEntry(entry.id).then(onAction).catch(genericCatch(toastContext))
              }
            ></button>
          ) : null}
        </div>
      </div>
      <div className="message-body waitlist-body">{fits}</div>
    </article>
  );
}

export function Waitlist() {
  const toastContext = React.useContext(ToastContext);
  const eventContext = React.useContext(EventContext);
  const [waitlistId, _setWaitlistId] = React.useState(1); //eslint-disable-line
  const [waitlistData, setWaitlistData] = React.useState(null);
  const updateAndSet = React.useCallback(() => {
    fetch("/api/waitlist?waitlist_id=" + waitlistId)
      .then((response) => response.json())
      .then(setWaitlistData, genericCatch(toastContext));
  }, [waitlistId, setWaitlistData, toastContext]);

  React.useEffect(() => {
    updateAndSet();
  }, [updateAndSet]);

  React.useEffect(() => {
    if (!eventContext) return;

    const updateFn = coalesceCalls(updateAndSet, 1000 + Math.random() * 2000);
    const handleEvent = function (event) {
      var data = JSON.parse(event.data);
      if (data.waitlist_id === waitlistId) {
        updateFn();
      }
    };
    eventContext.addEventListener("waitlist_update", handleEvent);
    eventContext.addEventListener("open", updateFn);
    return function () {
      eventContext.removeEventListener("waitlist_update", handleEvent);
      eventContext.removeEventListener("open", updateFn);
    };
  }, [updateAndSet, eventContext, waitlistId]);

  if (waitlistData === null) {
    return <em>Loading waitlist information.</em>;
  }
  if (!waitlistData.open) {
    return <em>The waitlist is currently closed.</em>;
  }

  var waitlist = [];
  var i = 0;
  waitlistData.waitlist.forEach((entry) => {
    i++;
    waitlist.push(<XEntry key={entry.id} entry={entry} i={i} onAction={updateAndSet} />);
  });

  if (!waitlistData.waitlist.length) {
    waitlist = <p>The waitlist is currently empty.</p>;
  }

  return (
    <div className="page-waitlist">
      <div className="columns">
        <div className="column">
          <Xup onAction={updateAndSet} />
        </div>
        <div className="column">{waitlist}</div>
      </div>
    </div>
  );
}
