import { Route } from "react-router-dom";

import { BanRoutes } from "./Bans";
import { ACLRoutes } from "./ACL";
import { Fleet, FleetRegister } from "./Fleet";
import { Search } from "./Search";
import { Statistics } from "./Statistics";
import { FleetCompHistory } from "./FleetCompHistory";
import { NoteAdd } from "./NoteAdd";
import { FCMenu } from "./FCMenu";

export function FCRoutes() {
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
    </>
  );
}
