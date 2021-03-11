import React from "react";
import { AuthContext } from "../../Auth";
import { genericCatch, ToastContext, toastHttp } from "../../Toast";
import { Confirm } from "../../Components/Modal";
import { Button, Buttons, NavButton } from "../../Components/Form";
import { Content } from "../../Components/Page";

async function setWaitlistOpen(waitlistId, isOpen) {
  return await fetch("/api/waitlist/set_open", {
    method: "POST",
    body: JSON.stringify({ waitlist_id: waitlistId, open: isOpen }),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function closeFleet(characterId) {
  return await fetch("/api/fleet/close", {
    method: "POST",
    body: JSON.stringify({ character_id: characterId }),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function Fleet() {
  const [fleets, setFleets] = React.useState(null);
  const [fleetCloseModalOpen, setFleetCloseModalOpen] = React.useState(false);
  const authContext = React.useContext(AuthContext);
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
      <Buttons>
        <NavButton to="/fleet/register">Configure fleet</NavButton>
        <NavButton to="/auth/start/fc">ESI re-auth as FC</NavButton>
        <Button
          variant="success"
          onClick={() => setWaitlistOpen(1, true).then(toastHttp(toastContext))}
        >
          Open waitlist
        </Button>
        <Button onClick={() => setWaitlistOpen(1, false).then(toastHttp(toastContext))}>
          Close waitlist
        </Button>
        <Button variant="danger" onClick={(evt) => setFleetCloseModalOpen(true)}>
          Kick everyone from fleet
        </Button>
      </Buttons>
      <Content>
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
        {!fleets
          ? null
          : fleets.fleets.map((fleet) => (
              <div key={fleet.id}>
                STATUS: Fleet {fleet.id}, boss {fleet.boss.name}
              </div>
            ))}
      </Content>
      <FleetMembers />
      <Confirm
        open={fleetCloseModalOpen}
        setOpen={setFleetCloseModalOpen}
        title="Kick everyone from fleet"
        onConfirm={(evt) =>
          closeFleet(authContext.current.id)
            .then(toastHttp(toastContext), genericCatch(toastContext))
            .finally(() => setFleetCloseModalOpen(false))
        }
      >
        Are you sure?
      </Confirm>
    </>
  );
}

async function registerFleet({ fleetInfo, categoryMatches, authContext }) {
  return await fetch("/api/fleet/register", {
    method: "POST",
    body: JSON.stringify({
      character_id: authContext.current.id,
      assignments: categoryMatches,
      fleet_id: fleetInfo.fleet_id,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function FleetMembers() {
  const authContext = React.useContext(AuthContext);
  const toastContext = React.useContext(ToastContext);
  const [fleetMembers, setFleetMembers] = React.useState(null);
  const characterId = authContext.current.id;

  React.useEffect(() => {
    fetch("/api/fleet/members?character_id=" + characterId)
      .then((response) => response.json())
      .then(setFleetMembers)
      .catch((err) => setFleetMembers(null)); // What's error handling?
  }, [toastContext, characterId]);

  if (!fleetMembers) {
    return null;
  }

  return (
    <>
      <h3 className="title">Current fleet</h3>
      <table style={{ width: "100%" }}>
        <tbody>
          {fleetMembers &&
            fleetMembers.members.map((member) => (
              <tr key={member.id}>
                <td>{member.name}</td>
                <td>{member.ship.name}</td>
                <td>
                  <NavButton to={"/skills?character_id=" + member.id}>Skills</NavButton>
                  <NavButton to={"/pilot?character_id=" + member.id}>Information</NavButton>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  );
}

function detectSquads({ matches, categories, wings }) {
  var newMatches = { ...matches };
  var hadChanges = false;
  for (const [catID, catName] of Object.entries(categories)) {
    if (!(catID in matches)) {
      for (const wing of wings) {
        if (wing.name.match(/on\s+grid/i)) {
          for (const squad of wing.squads) {
            if (
              squad.name.toLowerCase().includes(catName.toLowerCase()) ||
              squad.name.toLowerCase().includes(catID.toLowerCase())
            ) {
              newMatches[catID] = `${wing.id},${squad.id}`;
              hadChanges = true;
            }
          }
        }
      }
    }
  }
  if (hadChanges) {
    return newMatches;
  }
  return null;
}

export function FleetRegister() {
  const authContext = React.useContext(AuthContext);
  const toastContext = React.useContext(ToastContext);
  const [fleetInfo, setFleetInfo] = React.useState(null);
  const [categories, setCategories] = React.useState(null);
  const [categoryMatches, setCategoryMatches] = React.useState({});

  const characterId = authContext.current.id;
  React.useEffect(() => {
    fetch("/api/fleet/info?character_id=" + characterId)
      .then((response) => response.json())
      .then(setFleetInfo)
      .catch(genericCatch(toastContext));

    fetch("/api/categories")
      .then((response) => response.json())
      .then(setCategories)
      .catch(genericCatch(toastContext));
  }, [characterId, toastContext]);

  React.useEffect(() => {
    if (!categories || !fleetInfo) return;

    var newMatches = detectSquads({
      matches: categoryMatches,
      categories,
      wings: fleetInfo.wings,
    });
    if (newMatches) {
      setCategoryMatches(newMatches);
    }
  }, [fleetInfo, categories, categoryMatches, setCategoryMatches]);

  if (!fleetInfo || !categories) {
    return <em>Loading fleet information...</em>;
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
