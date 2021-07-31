import React from "react";
import { AuthContext, ToastContext } from "../../contexts";
import { Confirm } from "../../Components/Modal";
import { Button, Buttons, InputGroup, NavButton, Select } from "../../Components/Form";
import { Content, Title } from "../../Components/Page";
import { apiCall, errorToaster, toaster, useApi } from "../../api";
import { Cell, CellHead, Row, Table, TableBody, TableHead } from "../../Components/Table";
import _ from "lodash";

async function setWaitlistOpen(waitlistId, isOpen) {
  return await apiCall("/api/waitlist/set_open", {
    json: { waitlist_id: waitlistId, open: isOpen },
  });
}

async function emptyWaitlist(waitlistId) {
  return await apiCall("/api/waitlist/empty", {
    json: { waitlist_id: waitlistId },
  });
}

async function closeFleet(characterId) {
  return await apiCall("/api/fleet/close", {
    json: { character_id: characterId },
  });
}

export function Fleet() {
  const [fleetCloseModalOpen, setFleetCloseModalOpen] = React.useState(false);
  const [emptyWaitlistModalOpen, setEmptyWaitlistModalOpen] = React.useState(false);
  const authContext = React.useContext(AuthContext);
  const toastContext = React.useContext(ToastContext);
  const [fleets] = useApi("/api/fleet/status");

  React.useEffect(() => {
    // FCs will need this, request it now
    if (window.Notification && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <>
      <Buttons>
        <NavButton to="/fc/fleet/register">Configure fleet</NavButton>
        <NavButton to="/auth/start/fc">ESI re-auth as FC</NavButton>
        <InputGroup>
          <Button variant="success" onClick={() => toaster(toastContext, setWaitlistOpen(1, true))}>
            Open waitlist
          </Button>
          <Button onClick={() => toaster(toastContext, setWaitlistOpen(1, false))}>
            Close waitlist
          </Button>
          <Button onClick={() => setEmptyWaitlistModalOpen(true)}>Empty waitlist</Button>
        </InputGroup>
        <Button variant="danger" onClick={() => setFleetCloseModalOpen(true)}>
          Kick everyone from fleet
        </Button>
      </Buttons>
      <Content>
        <p>
          <em>Xifon needs more time to build this page.</em> Anyway, it works. Make sure you re-auth
          via ESI, then create an in-game fleet with your comp. Click the &quot;Configure
          fleet&quot; button, and select the five squads that the tool will invite people into. Then
          open the waitlist, allowing people to X up.
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
      {authContext.access["fleet-comp-history"] && (
        <Buttons>
          <NavButton to="/fc/fleet-comp-history">Fleet comp history</NavButton>
        </Buttons>
      )}

      <FleetMembers />
      <Confirm
        open={fleetCloseModalOpen}
        setOpen={setFleetCloseModalOpen}
        title="Kick everyone from fleet"
        onConfirm={(evt) =>
          toaster(toastContext, closeFleet(authContext.current.id)).finally(() =>
            setFleetCloseModalOpen(false)
          )
        }
      >
        Are you sure?
      </Confirm>
      <Confirm
        open={emptyWaitlistModalOpen}
        setOpen={setEmptyWaitlistModalOpen}
        title="Empty waitlist"
        onConfirm={(evt) =>
          toaster(toastContext, emptyWaitlist(1)).finally(() => setEmptyWaitlistModalOpen(false))
        }
      >
        Are you sure?
      </Confirm>
    </>
  );
}

async function registerFleet({ fleetInfo, categoryMatches, authContext }) {
  return await apiCall("/api/fleet/register", {
    json: {
      character_id: authContext.current.id,
      assignments: categoryMatches,
      fleet_id: fleetInfo.fleet_id,
    },
  });
}

function FleetMembers() {
  const authContext = React.useContext(AuthContext);
  const [fleetMembers, setFleetMembers] = React.useState(null);
  const characterId = authContext.current.id;

  React.useEffect(() => {
    setFleetMembers(null);
    apiCall("/api/fleet/members?character_id=" + characterId, {})
      .then(setFleetMembers)
      .catch((err) => setFleetMembers(null)); // What's error handling?
  }, [characterId]);

  if (!fleetMembers) {
    return null;
  }

  var summary = {};
  if (fleetMembers) {
    fleetMembers.members.forEach((member) => {
      if (!summary[member.ship.name]) summary[member.ship.name] = 0;
      summary[member.ship.name]++;
    });
  }

  return (
    <>
      <Title>Fleet composition</Title>
      <Table>
        <TableHead>
          <Row>
            <CellHead>Ship</CellHead>
            <CellHead>#</CellHead>
          </Row>
        </TableHead>
        <TableBody>
          {_.sortBy(_.entries(summary), [1]).map(([shipName, count]) => (
            <Row key={shipName}>
              <Cell>{shipName}</Cell>
              <Cell>{count}</Cell>
            </Row>
          ))}
        </TableBody>
      </Table>
      <Title>Members</Title>
      <Table fullWidth>
        <TableBody>
          {fleetMembers &&
            fleetMembers.members.map((member) => (
              <Row key={member.id}>
                <Cell>{member.name}</Cell>
                <Cell>{member.ship.name}</Cell>
                <Cell>
                  <NavButton to={"/skills?character_id=" + member.id}>Skills</NavButton>
                  <NavButton to={"/pilot?character_id=" + member.id}>Information</NavButton>
                </Cell>
              </Row>
            ))}
        </TableBody>
      </Table>
    </>
  );
}

function detectSquads({ matches, categories, wings }) {
  var newMatches = { ...matches };
  var hadChanges = false;
  for (const category of categories) {
    if (!(category.id in matches)) {
      for (const wing of wings) {
        if (wing.name.match(/on\s+grid/i)) {
          for (const squad of wing.squads) {
            if (
              squad.name.toLowerCase().includes(category.name.toLowerCase()) ||
              squad.name.toLowerCase().includes(category.id.toLowerCase())
            ) {
              newMatches[category.id] = [wing.id, squad.id];
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
    setFleetInfo(null);
    errorToaster(
      toastContext,
      apiCall("/api/fleet/info?character_id=" + characterId, {}).then(setFleetInfo)
    );

    setCategories(null);
    errorToaster(
      toastContext,
      apiCall("/api/categories", {}).then((data) => setCategories(data.categories))
    );
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
      <Button
        variant="primary"
        onClick={(evt) =>
          toaster(toastContext, registerFleet({ authContext, fleetInfo, categoryMatches }))
        }
      >
        Continue
      </Button>
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
  for (const category of categories) {
    var squadSelection = flatSquads.map((squad) => (
      <option key={squad.id} value={squad.id}>
        {squad.name}
      </option>
    ));
    catDom.push(
      <p key={category.id}>
        <label className="label">
          {category.name}
          <br />
        </label>
        <Select
          value={value[category.id]}
          onChange={(evt) =>
            onChange({
              ...value,
              [category.id]: evt.target.value.split(",").map((i) => parseInt(i)),
            })
          }
        >
          <option></option>
          {squadSelection}
        </Select>
      </p>
    );
  }
  return <Content>{catDom}</Content>;
}
