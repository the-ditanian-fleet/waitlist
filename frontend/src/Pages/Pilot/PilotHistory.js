import _ from "lodash";
import styled from "styled-components";

import { FitEntry, SkillEntry, FleetEntry } from "./Entry";

const Group = styled.div`
  margin-bottom: 2em;
`;

function CombinedDisplay({ fleetHistory, xupHistory, skillHistory }) {
  var everything = [];

  // Add xups
  var i = 0;
  for (const entry of xupHistory || []) {
    i++;
    everything.push({
      time: entry.logged_at,
      type: "fit",
      entry,
      key: `fit-${i}`,
    });
  }

  // Add fleet activity
  i = 0;
  for (const entry of fleetHistory || []) {
    i++;
    everything.push({
      time: entry.logged_at,
      endTime: entry.logged_at + entry.time_in_fleet,
      type: "fleet",
      entry,
      key: `fleet-${i}`,
    });
  }

  // Add skills
  i = 0;
  for (const entry of skillHistory || []) {
    i++;
    everything.push({
      time: entry.logged_at,
      type: "skill",
      entry,
      key: `skill-${i}`,
    });
  }

  // Sort
  everything = _.sortBy(everything, ["time"]);

  // Create groups with entries
  var groups = [];
  var thisGroup = null;
  var maxTime = null;
  for (const { time, entry, type, endTime, key } of everything) {
    if (thisGroup === null || maxTime < time) {
      thisGroup = [];
      groups.push({ key: time, group: thisGroup });
    }

    // Consider it a new group after three hours of inactivity.
    // Why three? Well, nobody should be on the waitlist for that long, but an hour is possible.
    maxTime = (endTime || time) + 3 * 3600;

    if (type === "fit") {
      thisGroup.push(<FitEntry key={key} {...entry} />);
    } else if (type === "fleet") {
      thisGroup.push(<FleetEntry key={key} {...entry} />);
    } else if (type === "skill") {
      thisGroup.push(<SkillEntry key={key} {...entry} />);
    }
  }

  // Reverse everything and create final result
  var result = [];
  groups.reverse();
  for (const { group, key } of groups) {
    group.reverse();
    result.push(<Group key={key}>{group}</Group>);
  }

  // Just in case someone has nothing
  if (!result.length) {
    return (
      <div>
        <em>No logged history</em>
      </div>
    );
  }

  // Done!
  return <div>{result}</div>;
}

export function PilotHistory({ fleetHistory, xupHistory, skillHistory }) {
  return (
    <CombinedDisplay
      fleetHistory={fleetHistory}
      xupHistory={xupHistory}
      skillHistory={skillHistory}
    />
  );
}
