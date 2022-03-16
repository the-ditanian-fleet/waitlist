import { NavLink } from "react-router-dom";
import { AuthContext } from "../contexts";
import logoImage from "./logo.png";
import styled from "styled-components";
import { InputGroup, Select, NavButton, AButton } from "../Components/Form";
import { EventNotifier } from "../Components/Event";
import { ThemeSelect } from "../Components/ThemeSelect";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { NavLinks, MobileNav } from "./Navigation";

const NavBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 1em;
  margin-bottom: 1em;
  @media (max-width: 480px) {
    padding: 0.2em;
  }
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
NavBar.Main = styled.div`
  display: flex;
  flex-wrap: wrap;
  @media (max-width: 480px) {
    display: none;
  }
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
            <NavBar.Main>
              <NavLinks whoami={whoami} />
            </NavBar.Main>
            <NavBar.End>
              {whoami && (
                <>
                  <InputGroup style={{ marginRight: "2em" }}>
                    <MobileNav whoami={whoami} />
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
                </>
              )}
              <InputGroup>
                <AButton title="Discord" href="https://discord.gg/YTysdbb">
                  <FontAwesomeIcon icon={faDiscord} />
                </AButton>
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
