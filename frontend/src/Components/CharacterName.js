import PropTypes from "prop-types";
import styled from "styled-components";

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
`;

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

CharacterName.defaultProps = {
  avatar: true,
  avatarSize: 32,
  id: 1, // This will cause the image server to return the default avatar
  noLink: false,
};

CharacterName.propTypes = {
  avatar: PropTypes.bool,
  avatarSize: PropTypes.number,
  id: PropTypes.number,
  name: PropTypes.string.isRequired,
  noLink: PropTypes.bool,
};

export default CharacterName;
