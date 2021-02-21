import React from "react";
import { ToastContext, genericCatch } from "../../Toast";
import { EventContext } from "../../Event";
import styled from "styled-components";
import _ from "lodash";
import { XCard } from "./XCard";
import { InputGroup, Button, Buttons, NavButton } from "../../Components/Form";
import { AuthContext } from "../../Auth";

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

  var myEntry = _.find(
    waitlistData.waitlist,
    (entry) => entry.character && entry.character.id === authContext.account_id
  );

  return (
    <>
      <Buttons>
        <InputGroup>
          <NavButton variant={myEntry ? null : "primary"} to="/xup">
            Join waitlist
          </NavButton>
          <Button
            variant={myEntry ? "danger" : null}
            onClick={(evt) => removeEntry(myEntry.id)}
            disabled={myEntry ? false : true}
          >
            Leave waitlist
          </Button>
        </InputGroup>
      </Buttons>
      <CompactWaitlist waitlist={waitlistData} />
    </>
  );
}

const CompactWaitlistDOM = styled.div`
  display: flex;
  em {
    font-style: italic;
  }
`;
CompactWaitlistDOM.Category = styled.div`
  flex-grow: 1;
  flex-basis: 0;
  padding: 0.5em;

  > h2 {
    font-size: 1.5em;
    margin-bottom: 0.5em;
  }
`;

function CompactWaitlist({ waitlist }) {
  var categories = [];
  var categoryIndex = {};
  _.forEach(waitlist.categories, (category, i) => {
    categories.push([category, []]);
    categoryIndex[category] = i;
  });
  _.forEach(waitlist.waitlist, (entry) => {
    _.forEach(entry.fits, (fit) => {
      const categoryI = categoryIndex[fit.category];
      categories[categoryI][1].push(<XCard key={fit.id} entry={entry} fit={fit} />);
    });
  });
  return (
    <>
      <CompactWaitlistDOM>
        {categories.map((category) => (
          <CompactWaitlistDOM.Category key={category[0]}>
            <h2>{category[0]}</h2>
            {category[1]}
            {category[1].length ? null : <em>Nobody here!</em>}
          </CompactWaitlistDOM.Category>
        ))}
      </CompactWaitlistDOM>
    </>
  );
}
