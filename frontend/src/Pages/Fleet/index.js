import React from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../../Auth";
import { genericCatch, ToastContext, toastHttp } from "../../Toast";

async function setWaitlistOpen(waitlistId, isOpen) {
  return await fetch("/api/waitlist/set_open", {
    method: "POST",
    body: JSON.stringify({ waitlist_id: waitlistId, open: isOpen }),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function Fleet() {
  const [fleets, setFleets] = React.useState(null);
  const toastContext = React.useContext(ToastContext);

  React.useEffect(() => {
    fetch("/api/fleet/status")
      .then((response) => response.json())
      .then(setFleets)
      .catch(genericCatch(toastContext));
  }, [toastContext]);

  React.useEffect(() => {
    // FCs will need this, request it now
    if (window.Notification && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <>
      <div className="buttons">
        <NavLink className="button" to="/fleet/register">
          Configure fleet
        </NavLink>
        <NavLink className="button" to="/auth/start/fc">
          ESI re-auth as FC
        </NavLink>
        <button
          className="button is-success"
          onClick={() => setWaitlistOpen(1, true).then(toastHttp(toastContext))}
        >
          Open waitlist
        </button>
        <button
          className="button"
          onClick={() => setWaitlistOpen(1, false).then(toastHttp(toastContext))}
        >
          Close waitlist
        </button>
      </div>
      <div className="content">
        <p>
          <em>Xifon needs more time to build this page.</em> Anyway, it works. Make sure you re-auth
          via ESI, then create an in-game fleet with your comp. Click the &quot;Configure
          fleet&quot; button, and select the five squads that the tool will invite people into. Then
          open the waitlist, allowing people to X up. Whenever you&apos;re done with fleet, remove
          all entries manually (sorry!) and close the waitlist.
        </p>
        <p>
          To hand over the fleet, transfer the star (Boss role). Then the new FC should go via
          &quot;Configure fleet&quot; again, as if it was a new fleet.
        </p>
      </div>
      {!fleets
        ? null
        : fleets.fleets.map((fleet) => (
            <div key={fleet.id}>
              STATUS: Fleet {fleet.id}, boss {fleet.boss.name}
            </div>
          ))}
    </>
  );
}

async function registerFleet({ fleetInfo, categoryMatches, authContext }) {
  return await fetch("/api/fleet/register", {
    method: "POST",
    body: JSON.stringify({
      character_id: authContext.id,
      assignments: categoryMatches,
      fleet_id: fleetInfo.fleet_id,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function FleetRegister() {
  const authContext = React.useContext(AuthContext);
  const toastContext = React.useContext(ToastContext);
  const [fleetInfo, setFleetInfo] = React.useState(null);
  const [categories, setCategories] = React.useState(null);
  const [categoryMatches, setCategoryMatches] = React.useState({});

  React.useEffect(() => {
    fetch("/api/fleet/info?character_id=" + authContext.id)
      .then((response) => response.json())
      .then(setFleetInfo)
      .catch(genericCatch(toastContext));

    fetch("/api/categories")
      .then((response) => response.json())
      .then(setCategories)
      .catch(genericCatch(toastContext));
  }, [authContext.id, toastContext]);

  if (!fleetInfo || !categories) {
    return <em>Loading fleet information...</em>;
  }

  if (!fleetInfo.is_fleet_boss) {
    return <span>You must be the Fleet&apos;s Boss to claim a fleet!</span>;
  }

  return (
    <>
      <CategoryMatcher
        categories={categories}
        wings={fleetInfo.wings}
        value={categoryMatches}
        onChange={setCategoryMatches}
      />
      <button
        className="button is-success"
        onClick={(evt) =>
          registerFleet({ authContext, fleetInfo, categoryMatches }).then(
            toastHttp(toastContext),
            genericCatch(toastContext)
          )
        }
      >
        Continue
      </button>
    </>
  );
}

function CategoryMatcher({ categories, wings, onChange, value }) {
  var flatSquads = [];
  wings.forEach((wing) => {
    wing.squads.forEach((squad) => {
      flatSquads.push({
        name: `${wing.name} - ${squad.name}`,
        id: `${wing.id},${squad.id}`,
      });
    });
  });

  var catDom = [];
  for (const [catID, catName] of Object.entries(categories)) {
    var squadSelection = flatSquads.map((squad) => (
      <option key={squad.id} value={squad.id}>
        {squad.name}
      </option>
    ));
    catDom.push(
      <div key={catID} className="field">
        <label className="label">{catName}</label>
        <div className="control">
          <div className="select">
            <select
              value={value[catID]}
              onChange={(evt) => onChange({ ...value, [catID]: evt.target.value.split(",") })}
            >
              <option></option>
              {squadSelection}
            </select>
          </div>
        </div>
      </div>
    );
  }
  return <b>{catDom}</b>;
}
