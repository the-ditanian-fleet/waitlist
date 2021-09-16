import React from "react";
import { NavLink } from "react-router-dom";
import { Content } from "../../Components/Page";
import { AuthContext } from "../../contexts";

export function FCMenu() {
  const authContext = React.useContext(AuthContext);

  return (
    <Content>
      {authContext && authContext.access["fleet-view"] && (
        <p>
          <NavLink exact to="/fc/fleet">
            Fleet setup
          </NavLink>
        </p>
      )}
      {authContext && authContext.access["search"] && (
        <p>
          <NavLink exact to="/fc/search">
            Search pilot
          </NavLink>
        </p>
      )}
      {authContext && authContext.access["bans-view"] && (
        <p>
          <NavLink exact to="/fc/bans">
            Bans
          </NavLink>
        </p>
      )}
      {authContext && authContext.access["access-view"] && (
        <p>
          <NavLink exact to="/fc/acl">
            ACL
          </NavLink>
        </p>
      )}
      {authContext && authContext.access["stats-view"] && (
        <p>
          <NavLink exact to="/fc/stats">
            Statistics
          </NavLink>
        </p>
      )}
    </Content>
  );
}
