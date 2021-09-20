import React from "react";
import { AuthContext } from "../../contexts";
import { useLocation, useHistory, NavLink } from "react-router-dom";
import { PageTitle } from "../../Components/Page";
import { useApi } from "../../api";

import { SkillDisplay } from "../../Components/SkillDisplay";

export function Skills() {
  const authContext = React.useContext(AuthContext);
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

  return (
    <>
      <PageTitle>{basicInfo ? `Skills for ${basicInfo.name}` : "Skills"}</PageTitle>
      <SkillDisplay characterId={characterId} ship={ship} setShip={setShip} />
      <p>
        <NavLink exact to="/skills/plans" style={{ color: "inherit" }}>
          Skill plans
        </NavLink>
      </p>
    </>
  );
}
