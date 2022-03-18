import React from "react";
import { useLocation } from "react-router-dom";
import { Modal } from "../Components/Modal";
import { Box } from "../Components/Box";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import { MobileButton } from "../Components/Form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";

const Links = styled(NavLink).attrs((props) => ({
  activeClassName: "active",
}))`
  padding: 1em;
  color: ${(props) => props.theme.colors.accent4};
  text-decoration: none;
  &:hover {
    color: ${(props) => props.theme.colors.text};
    background-color: ${(props) => props.theme.colors.accent1};
    border-radius: 2px;
  }
  &.active {
    color: ${(props) => props.theme.colors.active};
  }
  @media (max-width: 480px) {
    &.active {
      background-color: ${(props) => props.theme.colors.accent1};
      border-radius: 4px;
    }
  }
`;

const MobileButtonDOM = styled.div`
  * {
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
  }
`;

export function MobileNav({ whoami }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  React.useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <>
      <Modal open={isOpen} setOpen={setIsOpen}>
        <Box>
          <MobileButtonDOM>
            <NavLinks whoami={whoami} />
          </MobileButtonDOM>
        </Box>
      </Modal>
      <MobileButton onClick={(evt) => setIsOpen(true)}>
        <FontAwesomeIcon icon={faBars} />
      </MobileButton>
    </>
  );
}

export function NavLinks({ whoami }) {
  return (
    <>
      {whoami && (
        <>
          <Links exact to="/waitlist">
            Waitlist
          </Links>
          <Links exact to="/skills">
            Skills
          </Links>
          <Links exact to="/pilot">
            Pilot
          </Links>
        </>
      )}
      <Links exact to="/guide">
        Guides
      </Links>
      <Links exact to="/fits">
        Fits
      </Links>
      <Links exact to="/isk-h/calc">
        ISK/h calc
      </Links>
      {whoami && whoami.access["fleet-view"] && (
        <Links exact to="/fc/fleet">
          Fleet
        </Links>
      )}
      {whoami && whoami.access["fleet-view"] && (
        <Links exact to="/fc">
          FC
        </Links>
      )}
      {whoami && whoami.access["search"] && (
        <Links exact to="/fc/search">
          Search
        </Links>
      )}
    </>
  );
}
