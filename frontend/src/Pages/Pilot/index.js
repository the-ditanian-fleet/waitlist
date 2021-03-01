import React from "react";
import { AuthContext } from "../../Auth";
import { useLocation } from "react-router-dom";
import { PageTitle, Title } from "../../Components/Page";
import { SkillHistory } from "./SkillHistory";
import { FitHistory } from "./FitHistory";

export function Pilot() {
  const authContext = React.useContext(AuthContext);
  const queryParams = new URLSearchParams(useLocation().search);
  var characterId = queryParams.get("character_id") || authContext.current.id;

  const [basicInfo, setBasicInfo] = React.useState(null);

  React.useEffect(() => {
    fetch("/api/pilot/info?character_id=" + characterId)
      .then((response) => response.json())
      .then(setBasicInfo);
  }, [characterId]);

  if (!basicInfo) {
    return <em>Loading pilot information...</em>;
  }

  return (
    <>
      <PageTitle>{basicInfo.name}</PageTitle>
      <div style={{ display: "flex" }}>
        <div style={{ flexBasis: "250px", flexGrow: 1, padding: "1em" }}>
          <Title>Fit history</Title>
          <FitHistory characterId={basicInfo.id} />
        </div>
        <div style={{ flexBasis: "250px", flexGrow: 1, padding: "1em" }}>
          <Title>Skill log</Title>
          <SkillHistory characterId={basicInfo.id} />
        </div>
      </div>
    </>
  );
}
