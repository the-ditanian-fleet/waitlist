import React from "react";
import { AuthContext } from "../../contexts";
import { useLocation, useHistory } from "react-router-dom";
import { PageTitle, Content } from "../../Components/Page";
import { useApi } from "../../api";
import { usePageTitle } from "../../Util/title";

import { SkillDisplay } from "../../Components/SkillDisplay";

export function Skills() {
  const authContext = React.useContext(AuthContext);
  if (!authContext) {
    return (
      <Content>
        <b>Login Required!</b>
        <p>
          This page will show tables with TDF related skills comparing to your current skills with a
          color indicating the progres tier that skill is at.
        </p>
      </Content>
    );
  }
  return <SkillsAuth authContext={authContext} />;
}

function SkillsAuth({ authContext }) {
  const queryParams = new URLSearchParams(useLocation().search);
  const history = useHistory();

  var characterId = queryParams.get("character_id") || authContext.current.id;
  var ship = queryParams.get("ship") || "Vindicator";

  const [basicInfo] = useApi(`/api/pilot/info?character_id=${characterId}`);

  const setShip = (newShip) => {
    queryParams.set("ship", newShip);
    history.push({
      search: queryParams.toString(),
    });
  };

  usePageTitle(`${ship} Skills`);
  return (
    <>
      <PageTitle>{basicInfo ? `Skills for ${basicInfo.name}` : "Skills"}</PageTitle>
      <SkillDisplay characterId={characterId} ship={ship} setShip={setShip} />
    </>
  );
}
