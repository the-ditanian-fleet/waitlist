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

function useWaitlist(waitlistId) {
  const toastContext = React.useContext(ToastContext);
  const eventContext = React.useContext(EventContext);

  const [waitlistData, setWaitlistData] = React.useState(null);

  // Heart of the logic: this function downloads the waitlist and writes into the state
  const refreshFn = React.useCallback(() => {
    if (!waitlistId) {
      setWaitlistData(null);
      return;
    }
    errorToaster(
      toastContext,
      apiCall(`/api/waitlist?waitlist_id=${waitlistId}`, {}).then(setWaitlistData)
    );
  }, [waitlistId, setWaitlistData, toastContext]);

  // Re-invoke the refresh function if our inputs have changed
  React.useEffect(() => {
    refreshFn();
  }, [refreshFn]);

  // Listen for events
  React.useEffect(() => {
    if (!eventContext) return;

    const updateFn = coalesceCalls(refreshFn, 1000 + Math.random() * 2000);
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
  }, [refreshFn, eventContext, waitlistId]);

  return [waitlistData, refreshFn];
}

export function Waitlist() {
  const authContext = React.useContext(AuthContext);
  const toastContext = React.useContext(ToastContext);
  const queryParams = new URLSearchParams(useLocation().search);
  const waitlistId = parseInt(queryParams.get("wl"));
  const [waitlistData, refreshWaitlist] = useWaitlist(waitlistId);
  const displayMode = queryParams.get("mode") || "columns";
  const history = useHistory();

  const setDisplayMode = (newMode) => {
    queryParams.set("mode", newMode);
    history.replace({
      search: queryParams.toString(),
    });
  };

  React.useEffect(() => {
    // Redirect to wl=1 if we don't have one
    if (!waitlistId) {
      history.replace({
        search: `?wl=1`,
      });
      return null;
    }
  }, [waitlistId, history]);

  if (!waitlistId) {
    return null; // Should be redirecting
  }
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
          <NavButton variant={myEntry ? null : "primary"} to={`/xup?wl=${waitlistId}`}>
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
          {authContext.access["waitlist-view"] && (
            <Button active={displayMode === "notepad"} onClick={(evt) => setDisplayMode("notepad")}>
              Notepad
            </Button>
          )}
        </InputGroup>
      </Buttons>
      {displayMode === "columns" ? (
        <ColumnWaitlist waitlist={waitlistData} onAction={refreshWaitlist} />
      ) : displayMode === "compact" ? (
        <CompactWaitlist waitlist={waitlistData} onAction={refreshWaitlist} />
      ) : displayMode === "linear" ? (
        <LinearWaitlist waitlist={waitlistData} onAction={refreshWaitlist} />
      ) : displayMode === "matrix" ? (
        <MatrixWaitlist waitlist={waitlistData} onAction={refreshWaitlist} />
      ) : displayMode === "rows" ? (
        <RowWaitlist waitlist={waitlistData} onAction={refreshWaitlist} />
      ) : displayMode === "notepad" ? (
        <NotepadWaitlist waitlist={waitlistData} onAction={refreshWaitlist} />
      ) : null}
    </>
  );
}
