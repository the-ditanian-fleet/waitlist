import React from "react";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";
import styled from "styled-components";
import { apiCall, errorToaster } from "../api";
import { AuthContext, ToastContext } from "../contexts";

const Avatar = styled.img`
  border-radius: 25%;
  margin-right: 10px;
  vertical-align: middle;

  @media (max-width: 450px) {
    display: none;
  }
`;

const A = styled.a`
  color: ${(props) => props.theme.colors.highlight.text};
  text-decoration: none;
  &:hover {
    cursor: pointer;
    color: ${(props) => props.theme.colors.highlight.active};
    transition: ease-in-out 0.15s;
  }

  & + svg {
    margin-left: 5px;
    font-size: small;
  }
`;

const ShowInfo = (id, whoami, toastContext) => {
  console.log(whoami);
  errorToaster(
    toastContext,
    apiCall(`/api/open_window`, {
      method: "POST",
      json: {
        character_id: whoami.id,
        target_id: id,
      },
    })
  );
};

const CharacterName = ({ avatar, avatarSize, id, name, noLink }) => {
  return (
    <>
      {avatar && (
        <Avatar
          src={`https://images.evetech.net/characters/${id}/portrait?size=${avatarSize}`}
          loading="lazy"
        />
      )}
      {!noLink ? <A href={`/fc/search?query=${name}`}>{name}</A> : name}
    </>
  );
};

const CorporationName = ({ avatar, avatarSize, id, name, noLink }) => {
  const toastContext = React.useContext(ToastContext);
  const authContext = React.useContext(AuthContext);

  return (
    <>
      {avatar && (
        <Avatar
          src={`https://images.evetech.net/corporations/${id}/logo?size=${avatarSize}`}
          loading="lazy"
        />
      )}
      {!noLink ? (
        <>
          <A href="#" onClick={() => ShowInfo(id, authContext.current, toastContext)}>
            {name}
          </A>
          <FontAwesomeIcon fixedWidth icon={faExternalLinkAlt} />
        </>
      ) : (
        name
      )}
    </>
  );
};

const AllianceName = ({ avatar, avatarSize, id, name, noLink }) => {
  const toastContext = React.useContext(ToastContext);
  const authContext = React.useContext(AuthContext);

  return (
    <>
      {avatar && (
        <Avatar
          src={`https://images.evetech.net/alliances/${id}/logo?size=${avatarSize}`}
          loading="lazy"
        />
      )}
      {!noLink ? (
        <>
          <A href="#" onClick={() => ShowInfo(id, authContext.current, toastContext)}>
            {name}
          </A>
          <FontAwesomeIcon fixedWidth icon={faExternalLinkAlt} />
        </>
      ) : (
        name
      )}
    </>
  );
};

[CharacterName, AllianceName, CorporationName].forEach((type) => {
  type.defaultProps = {
    avatar: true,
    avatarSize: 32,
    id: 1, // This will cause the image server to return the default avatar
    noLink: false,
  };

  type.propTypes = {
    avatar: PropTypes.bool,
    avatarSize: PropTypes.number,
    id: PropTypes.number,
    name: PropTypes.string.isRequired,
    noLink: PropTypes.bool,
  };
});

export { AllianceName, CharacterName, CorporationName };