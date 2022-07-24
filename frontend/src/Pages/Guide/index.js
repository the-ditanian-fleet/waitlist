import React from "react";
import { NavLink, useParams } from "react-router-dom";
import { Content, PageTitle } from "../../Components/Page";
import styled from "styled-components";
import { ToastContext } from "../../contexts";
import { BadgeData } from "./Badges";
import { errorToaster } from "../../api";
import { Markdown } from "../../Components/Markdown";
import { Card, CardArray, CardMargin } from "../../Components/Card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAnchor,
  faBinoculars,
  faFistRaised,
  faGraduationCap,
  faHeart,
  faIdBadge,
  faBook,
  faInfo,
  faLevelUpAlt,
  faSignInAlt,
  faUserGraduate,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

const guideData = {};
function importAll(r) {
  r.keys().forEach((key) => (guideData[key] = r(key)));
}
importAll(require.context("./guides", true, /\.(md|jpg|png)$/));

const GuideContent = styled(Content)`
  max-width: 800px;
`;

export function Guide() {
  const toastContext = React.useContext(ToastContext);
  const { guideName } = useParams();
  const [loadedData, setLoadedData] = React.useState(null);
  const guidePath = `./${guideName}`;
  const filename = `${guidePath}/guide.md`;

  React.useEffect(() => {
    setLoadedData(null);
    if (!(filename in guideData)) return;

    errorToaster(
      toastContext,
      fetch(guideData[filename].default)
        .then((response) => response.text())
        .then(setLoadedData)
    );
  }, [toastContext, filename]);

  const resolveImage = (name) => {
    const originalName = `${guidePath}/${name}`;
    if (originalName in guideData) {
      return guideData[originalName].default;
    }
    return name;
  };

  if (!guideData[filename]) {
    return (
      <>
        <strong>Not found!</strong> The guide could not be loaded.
      </>
    );
  }

  if (!loadedData) {
    return (
      <>
        <em>Loading...</em>
      </>
    );
  }

  return (
    <GuideContent style={{ maxWidth: "800px" }}>
      <Markdown transformImageUri={resolveImage} transformLinkUri={null}>
        {loadedData}
      </Markdown>
    </GuideContent>
  );
}

function GuideCard({ icon, slug, name, children }) {
  return (
    <CardMargin>
      <NavLink style={{ textDecoration: "inherit", color: "inherit" }} exact to={`${slug}`}>
        <Card
          title={
            <>
              <FontAwesomeIcon fixedWidth icon={icon} /> {name}
            </>
          }
        >
          <p>{children}</p>
        </Card>
      </NavLink>
    </CardMargin>
  );
}

export function GuideIndex() {
  return (
    <>
      <PageTitle>Guides</PageTitle>
      <CardArray>
        <GuideCard slug="/guide/newbro" name="New-Bro guide" icon={faGraduationCap}>
          Haven&apos;t flown with TDF yet? Read this first!
        </GuideCard>
        <GuideCard slug="/guide/xup" name="First Fleet guide" icon={faSignInAlt}>
          What to do before joining your first fleet, how to join your first fleet, and how not to
          die during your first fleet.
        </GuideCard>
        <GuideCard slug="/guide/anchoring" name="Anchoring" icon={faAnchor}>
          Where should you park your ship?
        </GuideCard>
        <GuideCard slug="/guide/roles" name="Roles" icon={faUsers}>
          What is my purpose? Learn the roles here.
        </GuideCard>
        <GuideCard slug="/guide/upgrade" name="Upgrading" icon={faLevelUpAlt}>
          TDF expects you to upgrade. What is the policy and the recommended way to do it?
        </GuideCard>
        <GuideCard slug="/skills/plans" name="Skill Plans" icon={faBook}>
          Skill plans for anyone with doubts what to skill first.
        </GuideCard>
        <GuideCard slug="/guide/logi" name="Logistics guide" icon={faHeart}>
          Logistics are in charge of keeping the fleet alive. How do we do this?
        </GuideCard>
        <GuideCard slug="/guide/bastion" name="Using Bastion" icon={faFistRaised}>
          The Bastion Module offers a great damage increase, but it has to be used safely. Learn
          how!
        </GuideCard>
        <GuideCard slug="/badges" name="Information about badges" icon={faIdBadge}>
          What are all these badges I see?
        </GuideCard>
        <GuideCard slug="/guide/tips" name="General tips" icon={faInfo}>
          Contains advice on item variants, implants, remaps, accelerators, abyssals and usefull
          links.
        </GuideCard>
        <GuideCard slug="/guide/scouting" name="Scouting guide" icon={faBinoculars}>
          Scouts give the FC information on what&apos;s happening elsewhere. Learn how to perform
          this role!
        </GuideCard>
        <GuideCard slug="/guide/fctraining" name="Becoming an FC" icon={faUserGraduate}>
          Do you want to join the TDF team?
        </GuideCard>
      </CardArray>
    </>
  );
}

export function BadgeIndex() {
  return <BadgeData />;
}
