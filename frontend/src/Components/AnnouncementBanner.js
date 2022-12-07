import React, { useEffect, useReducer, useRef } from "react";
import styled from "styled-components";
import { apiCall } from "../api";
import { AuthContext, EventContext } from "../contexts";
import { useHistory } from "react-router-dom";
import { options } from "../Pages/FC/announcements/page-options";
import { CharacterName } from "./EntityLinks";
import { timeTillNow } from "../Util/time";

const AnnouncementBar = styled.div`
  background: ${(props) => props.theme.colors.secondary.color};
  box-shadow: 0px 3px ${(props) => props.theme.colors.shadow};
  color: ${(props) => props.theme.colors.text};
  margin-bottom: 3.5px;
  padding: 12px;
  position: relative;

  &[data-alert="true"] {
    background: ${(props) => props.theme.colors.danger.color};
    color: ${(props) => props.theme.colors.danger.text};
  }

  small {
    font-style: italic;
    font-size: small;
  }

  .close {
    position: absolute;
    right: 15px;
    top: 15px;
    width: 32px;
    height: 32px;
    opacity: 0.6;
  }
  .close:hover {
    opacity: 1;
    transition: ease-in-out 0.2s;
    cursor: pointer;
  }
  .close:before,
  .close:after {
    position: absolute;
    left: 15px;
    content: " ";
    height: 15px;
    width: 2px;
    background-color: ${(props) => props.theme.colors.secondary.text};
  }
  .close:before {
    transform: rotate(45deg);
  }
  .close:after {
    transform: rotate(-45deg);
  }
`;

const useInterval = (callback, delay) => {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

const AnnouncementBanner = () => {
  const authContext = React.useContext(AuthContext);
  const eventContext = React.useContext(EventContext);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const [announcments, setAnnouncments] = React.useState([]);
  const [ignoreIds, setIgnoreIds] = React.useState([]);
  const [pathname, setPathname] = React.useState(window.location.pathname);

  // Forces the UI to re-render when React-Router changes the page
  // this allows us to display/filter out announcements appropriately
  const history = useHistory();
  useEffect(() => {
    return history.listen((location) => setPathname(location?.pathname));
  }, [history]);

  // Update announcements when a payload is received from the SSE server
  const handleAnnouncment = (evt) => {
    setAnnouncments(JSON.parse(evt.data) ?? []);
  };

  useEffect(() => {
    if (!eventContext) {
      return;
    }

    eventContext.addEventListener("announcment;new", handleAnnouncment);
    eventContext.addEventListener("announcment;updated", handleAnnouncment);
    return () => {
      eventContext.removeEventListener("announcment;new", handleAnnouncment);
      eventContext.removeEventListener("announcment;updated", handleAnnouncment);
    };
  }, [eventContext]);

  // Allow users to dismiss an announcement for thirty days
  const handleClose = (id) => {
    let ignore = JSON.parse(window.localStorage.getItem("ignore-announcements")) ?? {};
    for (const [key, value] in ignore) {
      if (value < new Date()) {
        delete ignore[key];
      }
    }
    if (!(id in ignore)) {
      ignore[id] = new Date().setDate(new Date().getDate() + 30);
    }
    window.localStorage.setItem("ignore-announcements", JSON.stringify(ignore));
    setIgnoreIds(ignore);
  };

  useEffect(() => {
    async function fetchData() {
      setIgnoreIds(JSON.parse(window.localStorage.getItem("ignore-announcements")) ?? {});
      setAnnouncments(await apiCall(`/api/v2/announcements`, {}));
    }
    fetchData();
  }, []);

  useInterval(() => forceUpdate(), 1000 * 60);

  return announcments.length === 0 ? null : (
    <div style={{ marginBottom: "10px" }}>
      {announcments.map((announcment, key) => {
        if (announcment.id in ignoreIds) {
          // user has closed this announcment,
          // so we shouldn't render it anymore.
          return null;
        }

        const display_on_pages = announcment?.pages ? JSON.parse(announcment.pages) : [];

        // If the announcment has been limited to specific pages we need to check we are on an approved page
        // If we aren't, then we do not render the announcment.
        if (display_on_pages.length > 0) {
          let relevantFilters = options.filter((f) =>
            display_on_pages.includes(f.name.toLowerCase())
          );

          let render = false;
          relevantFilters.forEach((rf) => {
            if (pathname.startsWith(rf.value.toLowerCase())) {
              render = true;
            }
          });

          if (!render) return null;
        }

        const created_at = new Date(announcment.created_at * 1000);

        return (
          <AnnouncementBar key={key} data-alert={announcment.is_alert}>
            <CharacterName
              {...announcment.created_by}
              noLink={!authContext?.access["waitlist-tag:HQ-FC"]}
            />
            , {timeTillNow(created_at)}
            <span className="close" onClick={() => handleClose(announcment.id)} />
            <p style={{ paddingLeft: "42px" }}>{announcment.message}</p>
            {authContext && authContext.access["waitlist-tag:HQ-FC"] && (
              <small style={{ paddingLeft: "42px" }}>
                Displayed on:&nbsp;
                {display_on_pages.length > 0 ? display_on_pages.join(", ") : "all pages"}.
              </small>
            )}
          </AnnouncementBar>
        );
      })}
    </div>
  );
};

export default AnnouncementBanner;
