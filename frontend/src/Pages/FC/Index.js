import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Content, PageTitle } from "../../Components/Page";
import { AuthContext, ToastContext } from "../../contexts";
import { Card, CardArray, CardMargin } from "../../Components/Card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { errorToaster } from "../../api";
import { Markdown } from "../../Components/Markdown";
import styled from "styled-components";
import {
  faGraduationCap,
  faBiohazard,
  faChartLine,
  faShieldAlt,
  faUserShield,
  faBullhorn,
  faBan,
} from "@fortawesome/free-solid-svg-icons";
import { replaceTitle, parseMarkdownTitle, usePageTitle } from "../../Util/title";

const guideData = {};
function importAll(r) {
  r.keys().forEach((key) => (guideData[key] = r(key)));
}
importAll(require.context("./guides", true, /\.(md|jpg|png)$/));

const GuideContent = styled(Content)`
  max-width: 800px;
`;

function getSecondPart(str) {
  return str.split("/").pop();
}

export function GuideFC() {
  const toastContext = React.useContext(ToastContext);
  const guideName = useLocation();
  const loc = getSecondPart(guideName.pathname);
  const [loadedData, setLoadedData] = React.useState(null);
  const guidePath = `./${loc}`;
  const filename = `${guidePath}/guide.md`;

  React.useEffect(() => {
    setLoadedData(null);
    if (!(filename in guideData)) return;
    const title = document.title;

    errorToaster(
      toastContext,
      fetch(guideData[filename].default)
        .then((response) => response.text())
        .then((data) => {
          setLoadedData(data);
          replaceTitle(parseMarkdownTitle(data));
        })
    );
    return () => (document.title = title);
  }, [toastContext, filename]);

  const resolveImage = (name) => {
    const originalName = `${guidePath}/${name}`;
    if (originalName in guideData) {
      return guideData[originalName].default;
    }
    return name;
  };

  if (!guideData[filename]) {
    return <div>client : a{loc}a</div>;
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
      <NavLink style={{ textDecoration: "inherit", color: "inherit" }} exact to={`/fc/${slug}`}>
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

export function FCMenu() {
  const authContext = React.useContext(AuthContext);
  usePageTitle("FC Menu");
  return (
    <>
      <PageTitle>FC Dashboard</PageTitle>
      <CardArray>
        {authContext && authContext.access["waitlist-tag:HQ-FC"] && (
          <GuideCard slug="announcements" name="Announcements" icon={faBullhorn} />
        )}
        {authContext && authContext.access["bans-manage"] && (
          <GuideCard slug="bans" name="Bans" icon={faBan} />
        )}
        {authContext && authContext.access["badges-manage"] && (
          <GuideCard slug="badges" name="Badges" icon={faShieldAlt} />
        )}
        {authContext && authContext.access["access-manage"] && (
          <GuideCard slug="commanders" name="Commanders" icon={faUserShield} />
        )}
        {authContext &&
          authContext.access["fleet-view"] && ( //fleet view should be any fc
            <GuideCard slug="trainee" name="FC Training" icon={faGraduationCap} />
          )}
        {authContext &&
          authContext.access["search"] && ( //any full FC
            <GuideCard slug="documentation" name="FC Documentation" icon={faBiohazard} />
          )}
        {authContext && authContext.access["stats-view"] && (
          <GuideCard slug="stats" name="Statistics" icon={faChartLine} />
        )}
      </CardArray>
    </>
  );
}
