import React from "react";
import { AuthContext, ToastContext, EventContext } from "../../contexts";
import { apiCall, errorToaster, useApi } from "../../api";
import { InputGroup, Button, Buttons, NavButton } from "../../Components/Form";
import {
  ColumnWaitlist,
  CompactWaitlist,
  LinearWaitlist,
  MatrixWaitlist,
  RowWaitlist,
  NotepadWaitlist,
  CategoryHeading,
} from "./displaymodes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faColumns } from "@fortawesome/free-solid-svg-icons";
import _ from "lodash";
import { useQuery } from "../../Util/query";

function coalesceCalls(func, wait) {
  var nextCall = null;
  var timer = null;

  const timerFn = function () {
    timer = setTimeout(timerFn, wait);

    if (nextCall) {
      const [context, args] = nextCall;
      nextCall = null;
      func.apply(context, args);
    }
  };

  // Splay the initial timer, after that use a constant time interval
  timer = setTimeout(timerFn, wait * Math.random());

  return [
    function () {
      nextCall = [this, arguments];
    },
    function () {
      clearTimeout(timer);
    },
  ];
}

async function removeEntry(id) {
  return await apiCall("/api/waitlist/remove_x", {
    json: { id },
  });
}

function useWaitlist(waitlistId) {
  const eventContext = React.useContext(EventContext);

  const [waitlistData, refreshFn] = useApi(
    waitlistId ? `/api/waitlist?waitlist_id=${waitlistId}` : null
  );

  // Listen for events
  React.useEffect(() => {
    if (!eventContext) return;

    const [updateFn, clearUpdateFn] = coalesceCalls(refreshFn, 2000);
    const handleEvent = function (event) {
      var data = JSON.parse(event.data);
      if (data.waitlist_id === waitlistId) {
        updateFn();
      }
    };
    eventContext.addEventListener("waitlist_update", handleEvent);
    eventContext.addEventListener("open", updateFn);
    return function () {
      clearUpdateFn();
      eventContext.removeEventListener("waitlist_update", handleEvent);
      eventContext.removeEventListener("open", updateFn);
    };
  }, [refreshFn, eventContext, waitlistId]);

  return [waitlistData, refreshFn];
}

function useFleetComposition() {
  const authContext = React.useContext(AuthContext);
  const eventContext = React.useContext(EventContext);
  const [fleetMembers, setFleetMembers] = React.useState(null);

  const refreshFn = React.useCallback(() => {
    if (!authContext.access["fleet-view"]) {
      setFleetMembers(null);
      return;
    }
    apiCall(`/api/fleet/members?character_id=${authContext.current.id}`, {}).then(
      setFleetMembers,
      () => setFleetMembers(null)
    );
  }, [authContext, setFleetMembers]);

  React.useEffect(() => {
    refreshFn();
  }, [refreshFn]);

  React.useEffect(() => {
    if (!eventContext) return;

    const [updateFn, clearUpdateFn] = coalesceCalls(refreshFn, 2000);
    eventContext.addEventListener("comp_update", updateFn);
    eventContext.addEventListener("open", updateFn);
    return function () {
      clearUpdateFn();
      eventContext.removeEventListener("comp_update", updateFn);
      eventContext.removeEventListener("open", updateFn);
    };
  }, [refreshFn, eventContext]);

  return fleetMembers;
}

export function Waitlist() {
  const authContext = React.useContext(AuthContext);
  const toastContext = React.useContext(ToastContext);
  const [query, setQuery] = useQuery();
  const [altCol, setAltCol] = React.useState(
    window.localStorage && window.localStorage.getItem("AltColumn")
      ? window.localStorage.getItem("AltColumn") === "true"
      : false
  );
  const waitlistId = parseInt(query.wl);
  const [waitlistData, refreshWaitlist] = useWaitlist(waitlistId);
  const fleetComposition = useFleetComposition();
  const displayMode = query.mode || "columns";

  const setDisplayMode = (newMode) => {
    setQuery("mode", newMode);
  };
  React.useEffect(() => {
    // Redirect to wl=1 if we don't have one
    if (!waitlistId) {
      setQuery("wl", 1);
      return null;
    }
  }, [waitlistId, setQuery]);

  if (!waitlistId) {
    return null; // Should be redirecting
  }

  if (waitlistData === null) {
    return <em>Loading waitlist information.</em>;
  }
  if (!waitlistData.open) {
    return <em>The waitlist is currently closed.</em>;
  }
  const handleChange = () => {
    setAltCol(!altCol);
    if (window.localStorage) {
      window.localStorage.setItem("AltColumn", !altCol);
    }
  };

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
        {displayMode === "columns" && (
          <Button onClick={handleChange}>
            <FontAwesomeIcon icon={faColumns} />
          </Button>
        )}
        {!altCol && (
          <CategoryHeading name="Alts" fleetComposition={fleetComposition} altCol={altCol} />
        )}
      </Buttons>

      {displayMode === "columns" ? (
        <ColumnWaitlist
          waitlist={waitlistData}
          onAction={refreshWaitlist}
          fleetComposition={fleetComposition}
          altCol={altCol}
        />
      ) : displayMode === "compact" ? (
        <CompactWaitlist waitlist={waitlistData} onAction={refreshWaitlist} />
      ) : displayMode === "linear" ? (
        <LinearWaitlist waitlist={waitlistData} onAction={refreshWaitlist} />
      ) : displayMode === "matrix" ? (
        <MatrixWaitlist
          waitlist={waitlistData}
          onAction={refreshWaitlist}
          fleetComposition={fleetComposition}
        />
      ) : displayMode === "rows" ? (
        <RowWaitlist
          waitlist={waitlistData}
          onAction={refreshWaitlist}
          fleetComposition={fleetComposition}
        />
      ) : displayMode === "notepad" ? (
        <NotepadWaitlist waitlist={waitlistData} onAction={refreshWaitlist} />
      ) : null}
    </>
  );
}
