import React from "react";
import { AuthContext, ToastContext, EventContext } from "../../contexts";
import { apiCall, errorToaster } from "../../api";
import { useLocation, useHistory } from "react-router-dom";
import { InputGroup, Button, Buttons, NavButton } from "../../Components/Form";
import {
  ColumnWaitlist,
  CompactWaitlist,
  LinearWaitlist,
  MatrixWaitlist,
  RowWaitlist,
  NotepadWaitlist,
} from "./displaymodes";
import _ from "lodash";

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
  return await apiCall("/api/waitlist/remove_x", {
    json: { id },
  });
}

export function Waitlist() {
  const authContext = React.useContext(AuthContext);
  const toastContext = React.useContext(ToastContext);
  const eventContext = React.useContext(EventContext);
  const [waitlistId, _setWaitlistId] = React.useState(1); //eslint-disable-line
  const [waitlistData, setWaitlistData] = React.useState(null);
  const queryParams = new URLSearchParams(useLocation().search);
  const displayMode = queryParams.get("mode") || "columns";
  const history = useHistory();

  const updateAndSet = React.useCallback(() => {
    errorToaster(
      toastContext,
      apiCall("/api/waitlist?waitlist_id=" + waitlistId, {}).then(setWaitlistData)
    );
  }, [waitlistId, setWaitlistData, toastContext]);

  const setDisplayMode = (newMode) => {
    queryParams.set("mode", newMode);
    history.replace({
      search: queryParams.toString(),
    });
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
            onClick={(evt) => errorToaster(toastContext, removeEntry(myEntry.id))}
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
        <ColumnWaitlist waitlist={waitlistData} onAction={updateAndSet} />
      ) : displayMode === "compact" ? (
        <CompactWaitlist waitlist={waitlistData} onAction={updateAndSet} />
      ) : displayMode === "linear" ? (
        <LinearWaitlist waitlist={waitlistData} onAction={updateAndSet} />
      ) : displayMode === "matrix" ? (
        <MatrixWaitlist waitlist={waitlistData} onAction={updateAndSet} />
      ) : displayMode === "rows" ? (
        <RowWaitlist waitlist={waitlistData} onAction={updateAndSet} />
      ) : displayMode === "notepad" ? (
        <NotepadWaitlist waitlist={waitlistData} onAction={updateAndSet} />
      ) : null}
    </>
  );
}
