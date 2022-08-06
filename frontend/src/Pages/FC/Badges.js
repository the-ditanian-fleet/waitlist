import React from 'react';
import { Route } from 'react-router-dom';
import { AuthContext } from '../../contexts';
import { Button } from '../../Components/Form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import styled, { ThemeContext } from 'styled-components';

const BadgesPage = () => {
    const authContext = React.useContext(AuthContext);

    return authContext && authContext.access["badges-manage"] ? ( 
        <Route exact path="/fc/badges">
            <View />
        </Route>
    ) 
    : <></>;
}

export default BadgesPage;

const Header = styled.div`
    padding-bottom: 10px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-content: space-between;
`;

const View = () => {
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
            <Header>
                <h1 style={{fontSize: '32px'}}>Specialist Badges</h1>
                <Button variant={"primary"} disabled>
                    <FontAwesomeIcon fixedWidth icon={faPlus} style={{ marginRight: '10px'}} />
                    Assign Badge
                </Button>
            </Header>
            
            <p style={{ marginBottom: '10px' }}>You can find the badge guide <A href="/badges">here</A>.</p>
        </>
    )
}