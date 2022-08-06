import React from 'react';
import PropTypes from 'prop-types';
import styled, { ThemeContext } from 'styled-components';

const Avatar = styled.img`
    border-radius: 25%;
    margin-right: 10px;
    vertical-align:middle;
`;

const CharacterName = ({ avatar, avatarSize, id, name }) => {
    const themeContext = React.useContext(ThemeContext);

    const A = styled.a`
        , &:visited {
            color: ${themeContext?.colors?.text};
        }

        &:hover { 
            color: ${themeContext?.colors?.active};
            transition: ease-in-out 0.15s
        }
    `;

    return (
        <>
            { avatar && <Avatar src={`https://images.evetech.net/characters/${id}/portrait?size=${avatarSize}`} /> }
            <A href={`/fc/search?query=${name}`}>{name}</A>
        </>
    )
}

CharacterName.defaultProps = {
    avatar: true,
    avatarSize: 32,
    id: 1 // This will cause the image server to return the default avatar
}

CharacterName.propTypes = {
    avatar: PropTypes.bool,
    avatarSize: PropTypes.number,
    id: PropTypes.number,
    Name: PropTypes.string.isRequired,
}

export default CharacterName;