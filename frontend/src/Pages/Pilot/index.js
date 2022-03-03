import React from "react";
import { AuthContext } from "../../contexts";
import { useLocation } from "react-router-dom";
import { PageTitle, Title } from "../../Components/Page";
import { PilotHistory } from "./PilotHistory";
import { useApi } from "../../api";
import { ActivitySummary } from "./ActivitySummary";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { tagBadges, Shield } from "../Waitlist/XCard";
import {
  faClipboard,
  faGraduationCap,
  faPen,
  faPlane,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import styled from "styled-components";
import { InputGroup, NavButton } from "../../Components/Form";
import { Row, Col } from "react-awesome-styled-grid";
import _ from "lodash";

const FilterButtons = styled.span`
  font-size: 0.75em;
  margin-left: 2em;

  a {
    cursor: pointer;
    padding: 0 0.2em;
  }
`;

function PilotTags({ tags }) {
  var tagImages = [];
  _.forEach(tags, (tag) => {
    if (tag in tagBadges) {
      tagImages.push(
        <div style={{ marginRight: "0.2em" }}>
          <Shield
            key={tag}
            color={tagBadges[tag][0]}
            letter={tagBadges[tag][1]}
            title={tagBadges[tag][2]}
            h="40px"
          />
        </div>
      );
    }
  });
  return <div style={{ display: "flex", marginBottom: "0.6em" }}>{tagImages}</div>;
}

export function Pilot() {
  const authContext = React.useContext(AuthContext);
  const queryParams = new URLSearchParams(useLocation().search);

  var characterId = queryParams.get("character_id") || authContext.current.id;
  const [filter, setFilter] = React.useState(null);
  const [basicInfo] = useApi(`/api/pilot/info?character_id=${characterId}`);
  const [fleetHistory] = useApi(`/api/history/fleet?character_id=${characterId}`);
  const [xupHistory] = useApi(`/api/history/xup?character_id=${characterId}`);
  const [skillHistory] = useApi(`/api/history/skills?character_id=${characterId}`);
  const [notes] = useApi(
    authContext.access["notes-view"] ? `/api/notes?character_id=${characterId}` : null
  );
  return (
    <>
      <div style={{ display: "flex", alignItems: "Center" }}>
        <PageTitle style={{ marginRight: "0.2em" }}>{basicInfo && basicInfo.name}</PageTitle>
        <PilotTags tags={basicInfo && basicInfo.tags} />
        <div style={{ marginLeft: "auto" }}>
          <img
            src={`https://images.evetech.net/characters/${characterId}/portrait?size=256`}
            style={{ borderRadius: "5px", height: "128px" }}
            alt=""
          />
        </div>
      </div>
      <InputGroup>
        {authContext.access["notes-add"] && (
          <NavButton to={`/fc/notes/add?character_id=${characterId}`}>Write note</NavButton>
        )}
        {authContext.access["bans-manage"] && (
          <NavButton to={`/fc/bans/add?kind=character&id=${characterId}`}>Ban</NavButton>
        )}
      </InputGroup>
      <Row>
        <Col xs={4} md={6}>
          <Title>
            History
            <FilterButtons>
              <a onClick={(evt) => setFilter(null)} style={{ marginRight: "0.5em" }}>
                <FontAwesomeIcon fixedWidth icon={faTimes} />
              </a>
              <a onClick={(evt) => setFilter("skill")}>
                <FontAwesomeIcon fixedWidth icon={faGraduationCap} />
              </a>
              <a onClick={(evt) => setFilter("fit")}>
                <FontAwesomeIcon fixedWidth icon={faPen} />
              </a>
              <a onClick={(evt) => setFilter("fleet")}>
                <FontAwesomeIcon fixedWidth icon={faPlane} />
              </a>
              {authContext.access["notes-view"] && (
                <a onClick={(evt) => setFilter("note")}>
                  <FontAwesomeIcon fixedWidth icon={faClipboard} />
                </a>
              )}
            </FilterButtons>
          </Title>

          <PilotHistory
            filter={filter ? (type) => type === filter : null}
            fleetHistory={fleetHistory && fleetHistory.activity}
            xupHistory={xupHistory && xupHistory.xups}
            skillHistory={skillHistory && skillHistory.history}
            notes={notes && notes.notes}
          />
        </Col>
        <Col xs={4} md={2}>
          <Title>Time in fleet</Title>
          <ActivitySummary summary={fleetHistory && fleetHistory.summary} />
        </Col>
      </Row>
    </>
  );
}
