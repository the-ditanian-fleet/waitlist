import { NavLink } from "react-router-dom";
import { AuthContext } from "../contexts";
import logoImage from "./logo.png";
import styled from "styled-components";
import { InputGroup, Select, NavButton } from "../Components/Form";
import { EventNotifier } from "../Components/Event";
import { ThemeSelect } from "../Components/ThemeSelect";

const NavBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 1em;
  margin-bottom: 1em;
`;

NavBar.LogoLink = styled(NavLink).attrs((props) => ({
  activeClassName: "active",
}))`
  margin-right: 2em;
  flex-grow: 0;
  line-height: 0;
`;
NavBar.Logo = styled.img`
  width: 150px;
  filter: ${(props) => props.theme.logo.filter};
`;
NavBar.Menu = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  flex-grow: 1;
`;
NavBar.Link = styled(NavLink).attrs((props) => ({
  activeClassName: "active",
}))`
  padding: 1em;
  color: ${(props) => props.theme.colors.accent4};
  text-decoration: none;
  &:hover {
    color: ${(props) => props.theme.colors.text};
    background-color: ${(props) => props.theme.colors.accent1};
  }
  &.active {
    color: ${(props) => props.theme.colors.active};
  }
`;
NavBar.End = styled.div`
  margin-left: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
`;

export function Menu({ onChangeCharacter, theme, setTheme }) {
  return (
    <AuthContext.Consumer>
      {(whoami) => (
        <NavBar>
          <NavBar.LogoLink to="/">
            <NavBar.Logo src={logoImage} alt="The Ditanian Fleet" />
          </NavBar.LogoLink>
          <NavBar.Menu>
            {whoami && (
              <>
                <NavBar.Link exact to="/waitlist">
                  Waitlist
                </NavBar.Link>
                <NavBar.Link exact to="/skills">
                  Skills
                </NavBar.Link>
                <NavBar.Link exact to="/pilot">
                  Pilot
                </NavBar.Link>
              </>
            )}
            <NavBar.Link exact to="/guide">
              Guides
            </NavBar.Link>
            {whoami && whoami.access["fleet-view"] && (
              <NavBar.Link exact to="/fc/fleet">
                Fleet
              </NavBar.Link>
            )}
            {whoami && whoami.access["search"] && (
              <NavBar.Link exact to="/fc/search">
                Search
              </NavBar.Link>
            )}
            {whoami && whoami.access["bans-view"] && (
              <NavBar.Link exact to="/fc/bans">
                Bans
              </NavBar.Link>
            )}
            {whoami && whoami.access["access-view"] && (
              <NavBar.Link exact to="/fc/acl">
                ACL
              </NavBar.Link>
            )}
            {whoami && whoami.access["stats-view"] && (
              <NavBar.Link exact to="/fc/stats">
                Statistics
              </NavBar.Link>
            )}
            <NavBar.End>
              {whoami && (
                <InputGroup style={{ marginRight: "2em" }}>
                  <Select
                    value={whoami.current.id}
                    onChange={(evt) =>
                      onChangeCharacter && onChangeCharacter(parseInt(evt.target.value))
                    }
                  >
                    {whoami.characters.map((character) => (
                      <option key={character.id} value={character.id}>
                        {character.name}
                      </option>
                    ))}
                  </Select>
                  <NavButton exact to="/auth/start/alt">
                    +
                  </NavButton>
                </InputGroup>
              )}
              <InputGroup>
                <EventNotifier />
                <ThemeSelect theme={theme} setTheme={setTheme} />
                {whoami ? (
                  <NavButton exact to="/auth/logout" variant="secondary">
                    Log out
                  </NavButton>
                ) : (
                  <NavButton exact to="/auth/start" variant="primary">
                    Log in
                  </NavButton>
                )}
              </InputGroup>
            </NavBar.End>
          </NavBar.Menu>
        </NavBar>
      )}
    </AuthContext.Consumer>
  );
}
