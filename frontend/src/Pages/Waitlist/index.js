import React from "react";
import { ToastContext, genericCatch } from "../../Toast";
import { EventContext } from "../../Event";
import styled from "styled-components";
import _ from "lodash";
import { XCard } from "./XCard";
import { InputGroup, Button, Buttons, NavButton } from "../../Components/Form";
import { AuthContext } from "../../Auth";
import { NotepadWaitlist } from "./NotepadWaitlist";

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

const ColumnWaitlistDOM = styled.div`
  display: flex;
  em {
    font-style: italic;
  }
`;
ColumnWaitlistDOM.Category = styled.div`
  flex-grow: 1;
  flex-basis: 0;
  padding: 0.5em;

  > h2 {
    font-size: 1.5em;
    margin-bottom: 0.5em;
  }
  > div {
    margin-bottom: 1.5em;
  }
`;

function ColumnWaitlist({ waitlist }) {
  var categories = [];
  var categoryIndex = {};
  _.forEach(waitlist.categories, (category, i) => {
    categories.push([category, []]);
    categoryIndex[category] = i;
  });
  _.forEach(waitlist.waitlist, (entry) => {
    _.forEach(entry.fits, (fit) => {
      const categoryI = categoryIndex[fit.category];
      categories[categoryI][1].push(
        <div key={fit.id}>
          <XCard entry={entry} fit={fit} />
        </div>
      );
    });
  });
  return (
    <>
      <ColumnWaitlistDOM>
        {categories.map((category) => (
          <ColumnWaitlistDOM.Category key={category[0]}>
            <h2>{category[0]}</h2>
            {category[1]}
            {category[1].length ? null : <em>Nobody here!</em>}
          </ColumnWaitlistDOM.Category>
        ))}
      </ColumnWaitlistDOM>
    </>
  );
}

const CompactWaitlistDOM = styled.div`
  display: flex;
  flex-wrap: wrap;
  > div {
    padding: 0.5em;
  }
`;

function CompactWaitlist({ waitlist }) {
  var allCards = [];
  _.forEach(waitlist.waitlist, (entry) => {
    _.forEach(entry.fits, (fit) => {
      allCards.push(
        <div key={fit.id}>
          <XCard entry={entry} fit={fit} />
        </div>
      );
    });
  });

  return <CompactWaitlistDOM>{allCards}</CompactWaitlistDOM>;
}

const LinearWaitlistDOM = styled.div``;
LinearWaitlistDOM.Entry = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 1em;
  > div {
    padding: 0.5em;
  }
`;

function LinearWaitlist({ waitlist }) {
  return (
    <LinearWaitlistDOM>
      {waitlist.waitlist.map((entry) => (
        <LinearWaitlistDOM.Entry key={entry.id}>
          {entry.fits.map((fit) => (
            <div key={fit.id}>
              <XCard fit={fit} entry={entry} />
            </div>
          ))}
        </LinearWaitlistDOM.Entry>
      ))}
    </LinearWaitlistDOM>
  );
}

const MatrixWaitlistDOM = styled.table`
  width: 100%;
  table-layout: fixed;
  text-align: left;

  > thead > tr > th {
    width: 1%;
    > h2 {
      font-size: 1.5em;
    }
  }
  th,
  td {
    padding: 0.5em;
  }
`;

function MatrixWaitlist({ waitlist }) {
  var categories = [];
  var categoryIndex = {};
  _.forEach(waitlist.categories, (category, i) => {
    categories.push([category, []]);
    categoryIndex[category] = i;
  });

  return (
    <MatrixWaitlistDOM>
      <thead>
        <tr>
          {categories.map((category) => (
            <th key={category[0]}>
              <h2>{category[0]}</h2>
            </th>
          ))}
        </tr>
        {waitlist.waitlist.map((entry) => {
          var byCategory = categories.map((cat) => []);
          _.forEach(entry.fits, (fit) => {
            byCategory[categoryIndex[fit.category]].push(
              <div key={fit.id}>
                <XCard fit={fit} entry={entry} />
              </div>
            );
          });
          return (
            <tr key={entry.id}>
              {byCategory.map((fits, i) => (
                <td key={i}>{fits}</td>
              ))}
            </tr>
          );
        })}
      </thead>
    </MatrixWaitlistDOM>
  );
}

const RowWaitlistDOM = styled.div`
  overflow-x: auto;

  em {
    font-style: italic;
  }
  > div > h2 {
    padding: 0.333em 0 0 0.333em;
    font-size: 1.5em;
  }
`;
RowWaitlistDOM.Category = styled.div`
  padding: 0.5em 0.5em;
  display: flex;

  > div {
    margin: 0 0.75em;
  }
`;

function RowWaitlist({ waitlist }) {
  var categories = [];
  var categoryIndex = {};
  _.forEach(waitlist.categories, (category, i) => {
    categories.push([category, []]);
    categoryIndex[category] = i;
  });
  _.forEach(waitlist.waitlist, (entry) => {
    _.forEach(entry.fits, (fit) => {
      const categoryI = categoryIndex[fit.category];
      categories[categoryI][1].push(
        <div key={fit.id}>
          <XCard key={fit.id} entry={entry} fit={fit} />
        </div>
      );
    });
  });
  return (
    <>
      <RowWaitlistDOM>
        {categories.map((category) => (
          <div key={category[0]}>
            <h2>{category[0]}</h2>
            <RowWaitlistDOM.Category>
              {category[1]}
              {category[1].length ? null : <em>Nobody here!</em>}
            </RowWaitlistDOM.Category>
          </div>
        ))}
      </RowWaitlistDOM>
    </>
  );
}
