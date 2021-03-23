import { NavLink } from "react-router-dom";
import { AuthContext } from "../contexts";
import logoImage from "./logo.png";
import styled from "styled-components";
import { InputGroup, Button, Select, NavButton } from "../Components/Form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { EventNotifier } from "../Components/Event";

const NavBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 1em;
  margin-bottom: 1em;
`;
NavBar.Logo = styled.img`
  width: 150px;
  filter: ${(props) => props.theme.logo.filter};
  margin-right: 2em;
  flex-grow: 0;
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
          <NavBar.Logo src={logoImage} alt="The Ditanian Fleet" />
          <NavBar.Menu>
            <NavBar.Link exact to="/">
              Waitlist
            </NavBar.Link>
            <NavBar.Link exact to="/skills">
              Skills
            </NavBar.Link>
            <NavBar.Link exact to="/guide">
              Guides
            </NavBar.Link>
            {whoami.access["fleet-view"] && (
              <NavBar.Link exact to="/fleet">
                Fleet
              </NavBar.Link>
            )}
            {whoami.access["search"] && (
              <NavBar.Link exact to="/search">
                Search
              </NavBar.Link>
            )}
            <NavBar.End>
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
              <InputGroup>
                <EventNotifier />
                <Button onClick={(evt) => setTheme(theme === "dark" ? "light" : "dark")}>
                  <FontAwesomeIcon fixedWidth icon={theme === "dark" ? faMoon : faSun} />
                </Button>
                <NavButton exact to="/auth/logout" variant="secondary">
                  Log out
                </NavButton>
              </InputGroup>
            </NavBar.End>
          </NavBar.Menu>
        </NavBar>
      )}
    </AuthContext.Consumer>
  );
}
