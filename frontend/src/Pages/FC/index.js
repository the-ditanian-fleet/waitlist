import { Route } from "react-router-dom";

import { BanRoutes } from "./Bans";
import { ACLRoutes } from "./ACL";
import { Fleet, FleetRegister } from "./Fleet";
import { Search } from "./Search";
import { Statistics } from "./Statistics";

export function FCRoutes() {
  return (
    <>
      <BanRoutes />
      <ACLRoutes />

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
    </>
  );
}
