import React from "react";
import { AuthContext } from "../../contexts";
import { useLocation } from "react-router-dom";
import { PageTitle, Title, Content } from "../../Components/Page";
import CharacterBadgeModal from "../FC/badges/CharacterBadgeModal";
import { PilotHistory } from "./PilotHistory";
import { useApi } from "../../api";
import { ActivitySummary } from "./ActivitySummary";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import BadgeIcon, { icons } from "../../Components/Badge";
import {
  faBan,
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
import CommanderModal from "../FC/commanders/CommanderModal";
import { AccountBannedBanner } from "../FC/bans/AccountBanned";

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
    if (tag in icons) {
      tagImages.push(
        <div key={tag} style={{ marginRight: "0.2em" }}>
          <BadgeIcon type={tag} height="40px" />
        </div>
      );
    }
  });
  return <div style={{ display: "flex", marginBottom: "0.6em" }}>{tagImages}</div>;
}

export function Pilot() {
  const authContext = React.useContext(AuthContext);
  if (!authContext) {
    return (
      <Content>
        <b>Login Required!</b>
        <p>
          This page will you your own TDF Fleet statistics like x-up&apos;s, fleet times and skill
          changes.
        </p>
      </Content>
    );
  }
  return <PilotDisplay authContext={authContext} />;
}

function PilotDisplay({ authContext }) {
  const queryParams = new URLSearchParams(useLocation().search);

  var characterId = queryParams.get("character_id") || authContext.current.id;
  const [ filter, setFilter ] = React.useState(null);
  const [ basicInfo, refreshBasicInfo ] = useApi(`/api/pilot/info?character_id=${characterId}`);
  const [ fleetHistory ] = useApi(`/api/history/fleet?character_id=${characterId}`);
  const [ banHistory ] = useApi(`/api/v2/bans/${characterId}`);
  const [ xupHistory ] = useApi(`/api/history/xup?character_id=${characterId}`);
  const [ skillHistory ] = useApi(`/api/history/skills?character_id=${characterId}`);
  const [ notes ] = useApi(
    authContext.access["notes-view"] ? `/api/notes?character_id=${characterId}` : null
  );

  return (
    <>
      { authContext.access["bans-manage"] && <AccountBannedBanner bans={banHistory} /> }

      <div style={{ display: "flex", alignItems: "Center", flexWrap: "wrap" }}>
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
      {authContext.account_id !== characterId && (
        <InputGroup style={{ marginBottom: "20px" }}>
          {authContext.access["notes-add"] && (
            <NavButton to={`/fc/notes/add?character_id=${characterId}`}>Write note</NavButton>
          )}
          {authContext.access["access-manage"] && (
            <CommanderModal
              character={basicInfo ?? { id: parseInt(characterId), name: "" }}
              isRevokeable
              handleRefresh={refreshBasicInfo}
            />
          )}
          {authContext.access["badges-manage"] && (
            <CharacterBadgeModal
              character={basicInfo ?? { id: parseInt(characterId), name: "" }}
              refreshData={refreshBasicInfo}
            />
          )}
        </InputGroup>
      )}
      <Row>
        <Col xs={4} md={6}>
          <Title>
            History
            <FilterButtons>
              <a onClick={(evt) => setFilter(null)} style={{ marginRight: "0.5em" }} title="Clear Filters">
                <FontAwesomeIcon fixedWidth icon={faTimes} />
              </a>
              <a onClick={(evt) => setFilter("skill")} title="Skill History">
                <FontAwesomeIcon fixedWidth icon={faGraduationCap} />
              </a>
              <a onClick={(evt) => setFilter("fit")} title="X-UP History">
                <FontAwesomeIcon fixedWidth icon={faPen} />
              </a>
              <a onClick={(evt) => setFilter("fleet")} title="Fleet History">
                <FontAwesomeIcon fixedWidth icon={faPlane} />
              </a>
              {authContext.access["notes-view"] && (
                <a onClick={(evt) => setFilter("note")} title="Pilot Notes">
                  <FontAwesomeIcon fixedWidth icon={faClipboard} />
                </a>
              )}
              {authContext.access["bans-manage"] && (
                <a onClick={(evt) => setFilter("ban")} title="Character Ban History">
                  <FontAwesomeIcon fixedWidth icon={faBan} />
                </a>
              )}
            </FilterButtons>
          </Title>

          <PilotHistory
            filter={filter ? (type) => type === filter : null}
            banHistory={banHistory}
            fleetHistory={fleetHistory && fleetHistory.activity}
            skillHistory={skillHistory && skillHistory.history}
            xupHistory={xupHistory && xupHistory.xups}            
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
