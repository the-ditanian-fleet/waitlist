import React from "react";
import { ToastContext, genericCatch } from "../../Toast";
import { EventContext } from "../../Event";
import _ from "lodash";
import { InputGroup, Button, Buttons, NavButton } from "../../Components/Form";
import { AuthContext } from "../../Auth";
import {
  ColumnWaitlist,
  CompactWaitlist,
  LinearWaitlist,
  MatrixWaitlist,
  RowWaitlist,
  NotepadWaitlist,
} from "./displaymodes";

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

async function removeEntry(id) {
  const result = await fetch("/api/waitlist/remove_x", {
    method: "POST",
    body: JSON.stringify({ id: id }),
    headers: { "Content-Type": "application/json" },
  });
  return await result.text();
}

export function Waitlist() {
  const authContext = React.useContext(AuthContext);
  const toastContext = React.useContext(ToastContext);
  const eventContext = React.useContext(EventContext);
  const [waitlistId, _setWaitlistId] = React.useState(1); //eslint-disable-line
  const [waitlistData, setWaitlistData] = React.useState(null);
  const [displayMode, writeDisplayMode] = React.useState(
    (window.localStorage && window.localStorage.getItem("waitlistMode")) || "columns"
  );
  const updateAndSet = React.useCallback(() => {
    fetch("/api/waitlist?waitlist_id=" + waitlistId)
      .then((response) => response.json())
      .then(setWaitlistData, genericCatch(toastContext));
  }, [waitlistId, setWaitlistData, toastContext]);

  const setDisplayMode = (newMode) => {
    if (window.localStorage) {
      window.localStorage.setItem("waitlistMode", newMode);
    }
    writeDisplayMode(newMode);
  };

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

  var myEntry = _.find(
    waitlistData.waitlist,
    (entry) => entry.character && entry.character.id === authContext.account_id
  );

  return (
    <>
      <Buttons>
        <InputGroup>
          <NavButton variant={myEntry ? null : "primary"} to="/xup">
            {myEntry ? "Update fit(s)" : "Join waitlist"}
          </NavButton>
          <Button
            variant={myEntry ? "danger" : null}
            onClick={(evt) => removeEntry(myEntry.id)}
            disabled={myEntry ? false : true}
          >
            Leave waitlist
          </Button>
        </InputGroup>
        <InputGroup>
          <Button active={displayMode === "columns"} onClick={(evt) => setDisplayMode("columns")}>
            Columns
          </Button>
          <Button active={displayMode === "matrix"} onClick={(evt) => setDisplayMode("matrix")}>
            Matrix
          </Button>
          <Button active={displayMode === "compact"} onClick={(evt) => setDisplayMode("compact")}>
            Compact
          </Button>
          <Button active={displayMode === "linear"} onClick={(evt) => setDisplayMode("linear")}>
            Linear
          </Button>
          <Button active={displayMode === "rows"} onClick={(evt) => setDisplayMode("rows")}>
            Rows
          </Button>
          {authContext.is_admin ? (
            <Button active={displayMode === "notepad"} onClick={(evt) => setDisplayMode("notepad")}>
              Notepad
            </Button>
          ) : null}
        </InputGroup>
      </Buttons>
      {displayMode === "columns" ? (
        <ColumnWaitlist waitlist={waitlistData} />
      ) : displayMode === "compact" ? (
        <CompactWaitlist waitlist={waitlistData} />
      ) : displayMode === "linear" ? (
        <LinearWaitlist waitlist={waitlistData} />
      ) : displayMode === "matrix" ? (
        <MatrixWaitlist waitlist={waitlistData} />
      ) : displayMode === "rows" ? (
        <RowWaitlist waitlist={waitlistData} />
      ) : displayMode === "notepad" ? (
        <NotepadWaitlist waitlist={waitlistData} />
      ) : null}
    </>
  );
}
