import React from "react";
import { AuthContext } from "../../contexts";
import { useLocation } from "react-router-dom";
import { PageTitle, Title } from "../../Components/Page";
import { PilotHistory } from "./PilotHistory";
import { useApi } from "../../api";
import { ActivitySummary } from "./ActivitySummary";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGraduationCap, faPen, faPlane, faTimes } from "@fortawesome/free-solid-svg-icons";
import styled from "styled-components";

const FilterButtons = styled.span`
  font-size: 0.75em;
  margin-left: 2em;

  a {
    cursor: pointer;
    padding: 0 0.2em;
  }
`;

export function Pilot() {
  const authContext = React.useContext(AuthContext);
  const queryParams = new URLSearchParams(useLocation().search);

  var characterId = queryParams.get("character_id") || authContext.current.id;
  const [filter, setFilter] = React.useState(null);
  const [basicInfo] = useApi(`/api/pilot/info?character_id=${characterId}`);
  const [fleetHistory] = useApi(`/api/history/fleet?character_id=${characterId}`);
  const [xupHistory] = useApi(`/api/history/xup?character_id=${characterId}`);
  const [skillHistory] = useApi(`/api/history/skills?character_id=${characterId}`);

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <PageTitle>{basicInfo && basicInfo.name}</PageTitle>
        <div style={{ marginLeft: "auto" }}>
          <img
            src={`https://imageserver.eveonline.com/Character/${characterId}_128.jpg`}
            style={{ borderRadius: "5px" }}
            alt=""
          />
        </div>
      </div>
      <div style={{ display: "flex" }}>
        <div style={{ flex: 3, padding: "0.5em" }}>
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
            </FilterButtons>
          </Title>

          <PilotHistory
            filter={filter ? (type) => type === filter : null}
            fleetHistory={fleetHistory && fleetHistory.activity}
            xupHistory={xupHistory && xupHistory.xups}
            skillHistory={skillHistory && skillHistory.history}
          />
        </div>
        <div style={{ flex: 1, padding: "0.5em" }}>
          <Title>Time in fleet</Title>
          <ActivitySummary summary={fleetHistory && fleetHistory.summary} />
        </div>
      </div>
    </>
  );
}
