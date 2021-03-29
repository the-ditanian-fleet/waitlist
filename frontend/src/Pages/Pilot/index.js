import React from "react";
import { AuthContext, ToastContext } from "../../contexts";
import { useLocation } from "react-router-dom";
import { PageTitle, Title } from "../../Components/Page";
import { SkillHistory } from "./SkillHistory";
import { FitHistory } from "./FitHistory";
import { apiCall, errorToaster } from "../../api";

export function Pilot() {
  const authContext = React.useContext(AuthContext);
  const toastContext = React.useContext(ToastContext);
  const queryParams = new URLSearchParams(useLocation().search);
  var characterId = queryParams.get("character_id") || authContext.current.id;

  const [basicInfo, setBasicInfo] = React.useState(null);

  React.useEffect(() => {
    setBasicInfo(null);
    errorToaster(
      toastContext,
      apiCall("/api/pilot/info?character_id=" + characterId, {}).then(setBasicInfo)
    );
  }, [toastContext, characterId]);

  if (!basicInfo) {
    return <em>Loading pilot information...</em>;
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <PageTitle>{basicInfo.name}</PageTitle>
        <div style={{ marginLeft: "auto" }}>
          <img
            src={`https://imageserver.eveonline.com/Character/${characterId}_128.jpg`}
            style={{ borderRadius: "5px" }}
            alt=""
          />
        </div>
      </div>
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
