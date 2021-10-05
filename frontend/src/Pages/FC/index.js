import React from "react";
import { Route } from "react-router-dom";
import { AuthContext } from "../../contexts";
import { BanRoutes } from "./Bans";
import { ACLRoutes } from "./ACL";
import { Fleet, FleetRegister } from "./Fleet";
import { Search } from "./Search";
import { Statistics } from "./Statistics";
import { FleetCompHistory } from "./FleetCompHistory";
import { NoteAdd } from "./NoteAdd";
import { FCMenu, GuideFC } from "./FCMenu";

export function FCRoutes() {
  const authContext = React.useContext(AuthContext);
  return (
    <>
      <BanRoutes />
      <ACLRoutes />

      <Route exact path="/fc">
        <FCMenu />
      </Route>
      <Route exact path="/fc/stats">
        <Statistics />
      </Route>
      <Route exact path="/fc/fleet">
        <Fleet />
      </Route>
      <Route exact path="/fc/fleet/register">
        <FleetRegister />
      </Route>
      <Route exact path="/fc/search">
        <Search />
      </Route>
      <Route exact path="/fc/fleet-comp-history">
        <FleetCompHistory />
      </Route>
      <Route exact path="/fc/notes/add">
        <NoteAdd />
      </Route>
      {authContext.access["stats-view"] && (
        <Route exact path="/fc/documentation">
          <GuideFC />
        </Route>
      )}
      {authContext.access["fleet-view"] && (
        <Route exact path="/fc/trainee">
          <GuideFC />
        </Route>
      )}
    </>
  );
}
