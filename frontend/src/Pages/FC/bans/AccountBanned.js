import { faBan, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import styled from "styled-components";
import { AuthContext } from "../../../contexts";
import { diffForHumans, formatDate } from "../../../Util/time";
import img from './dead.jpg';

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

const BannedPage = styled.div`
  svg:first-of-type {
    font-size: 50px;
    display: block;
    margin: 10vh auto 20px auto;
  }
  h1 {
    font-size: 1.6em;
    text-align: center;
    margin-bottom: 12px;
  }
  p {
    display: block;
    margin: 0 auto 15px auto;
    margin-left: auto;
    margin-right: auto;
    width: auto;
    max-width: 500px;
    text-align: center;
  }
`;

const PermaBannedCharacter = styled.div`
  position: absolute;
  height: 100vh;
  width: 100vw;
  top: 0;
  left: 0;
  z-index: 10;
  background: url(${img}) no-repeat;
  background-size: cover;
  h1 {
    text-align: center;
    margin-top: 30vh;
    font-size: revert;
    font-weight: bolder;
  }
  p {
    text-align: center;
    max-width: 300px;
    margin-left: auto;
    margin-right: auto;
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

const AccountBannedPage = ({ ban }) => {
  const Permanent = ({ category, reason }) => {
    return category === "Corporation" || category === "Alliance" ? (
      <BannedPage>
        <FontAwesomeIcon fixedWidth icon={faBan} />
        <h1>Access is Denied!</h1>
        <p>Because your {category.toLowerCase()} has been permanently banned.</p>
        { reason && ( <p>{reason}</p> )}
      </BannedPage>
    ) : (
      <PermaBannedCharacter>
        <h1>You&lsquo;ve Been Banned!</h1>
        <p>We&lsquo;d let you login, but you are as dead to us as the corpse in this image. Think this was a mistake? Contact leadership.</p>
        { reason && ( <p style={{ paddingTop: "20px", maxWidth: "700px" }}>{reason}</p> )}
      </PermaBannedCharacter>
    );
  }

  const Temporary = ({ category, expires_at, reason }) => {
    return (
      <BannedPage>
        <FontAwesomeIcon fixedWidth icon={faExclamationTriangle} />
        <h1>Your Waitlist Account Has Been Suspended!</h1>
        <p>Type: {category.toLowerCase()}, expires in: {diffForHumans(new Date(expires_at * 1000))}.</p>
        { reason && ( <p>{reason}</p> )}
      </BannedPage>
    );
  };

  return ban?.expires_at ? <Temporary {...ban} /> : <Permanent {...ban} />;
}

export {
  AccountBannedPage,
  AccountBannedBanner,
};