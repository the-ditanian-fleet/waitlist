import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { useParams, NavLink } from "react-router-dom";
import { Content } from "../../Components/Page";
import styled from "styled-components";
import { ToastContext } from "../../contexts";
import { errorToaster } from "../../api";

const guideData = {};
function importAll(r) {
  r.keys().forEach((key) => (guideData[key] = r(key)));
}
importAll(require.context("./guides", true, /\.(md|jpg|png)$/));

const GuideContent = styled(Content)`
  max-width: 800px;

  img {
    max-width: 100%;
  }
`;

export function Guide() {
  const toastContext = React.useContext(ToastContext);
  const { guideName } = useParams();
  const [loadedData, setLoadedData] = React.useState(null);
  const guidePath = `./${guideName}`;
  const filename = `${guidePath}/guide.md`;

  React.useEffect(() => {
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
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        transformImageUri={resolveImage}
        transformLinkUri={null}
      >
        {loadedData}
      </ReactMarkdown>
    </GuideContent>
  );
}

export function GuideIndex() {
  return (
    <Content>
      <h1>Guides</h1>
      <p>
        <NavLink exact to="/guide/newbro">
          New-Bro guide
        </NavLink>
      </p>
      <p>
        <NavLink exact to="/guide/xup">
          First Fleet guide
        </NavLink>
      </p>
      <p>
        <NavLink exact to="/guide/dps">
          Anchoring
        </NavLink>
      </p>
      <p>
        <NavLink exact to="/guide/upgrade">
          Upgrading
        </NavLink>
      </p>
      <p>
        <NavLink exact to="/guide/logi">
          Logistics guide
        </NavLink>
      </p>
      <p>
        <NavLink exact to="/guide/bastion">
          Using Bastion
        </NavLink>
      </p>
      <p>
        <NavLink exact to="/guide/badges">
          Information about badges
        </NavLink>
      </p>
      <p>
        <NavLink exact to="/guide/tips">
          General tips
        </NavLink>
      </p>
      <p>
        <NavLink exact to="/guide/rules">
          TDF rules
        </NavLink>
      </p>
      <p>
        <NavLink exact to="/guide/scouting">
          Scouting guide
        </NavLink>
      </p>
    </Content>
  );
}
