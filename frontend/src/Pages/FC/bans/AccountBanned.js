import { faBan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import styled from "styled-components";
import { AuthContext } from "../../../contexts";
import { diffForHumans, formatDate } from "../../../Util/time";

const Banner = styled.div`
  margin: 0 0 0.5em;
  display: flex;
  background-color: ${(props) => props.theme.colors.secondary.color};
  color: ${(props) => props.theme.colors.secondary.text};
  width: 100%;
  filter: drop-shadow(0px 4px 5px ${(props) => props.theme.colors.shadow});
  padding: 0.1em 0.5em 0.5em;
  align-items: center;
  word-break: break-word;

  svg {
    font-size: 32px;
    margin: 5px 5px 5px 5px;
    flex-shrink: 1;
  }

  div {
    flex-grow: 3;

    h3 {
      font-size: 1.5em;
      font-weight: 600;
    }
  }

  a {
    color: white;
  }
`;

const AccountBannedBanner = ({ bans }) => {
  const authContext = React.useContext(AuthContext);
  const ban = Array.isArray(bans) && bans.length > 0 ? bans[0] : null;

  return !(authContext.access["bans-manage"] && ban) ? null : (
    <Banner>
      <FontAwesomeIcon fixedWidth icon={faBan} />
      <div>
        <h3>{ban?.entity?.category} Suspended</h3>
        <p>Issued on: {formatDate(new Date(ban.issued_at * 1000))} by {ban?.issued_by?.name}.</p>
        {ban?.revoked_at && (
          <>
            Expires in&nbsp;
            <span title={formatDate(new Date(ban.revoked_at * 1000))}>
              {diffForHumans(new Date(ban.revoked_at * 1000))}
            </span>.
          </>
        )}
        
        <p>{ban?.reason}</p>
      </div>
    </Banner>
  );
};

export {
  // AccountBannedPage,
  AccountBannedBanner,
};