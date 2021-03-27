import { Route } from "react-router-dom";

import { Skills } from "../Pages/Skills";
import { Waitlist } from "../Pages/Waitlist";
import { Fleet, FleetRegister } from "../Pages/Fleet";
import { Xup } from "../Pages/Xup";
import { Pilot } from "../Pages/Pilot";
import { Search } from "../Pages/Search";
import { Guide, GuideIndex } from "../Pages/Guide";

import { BanRoutes } from "../Pages/Bans";
import { ACLRoutes } from "../Pages/ACL";

export function Routes() {
  return (
    <>
      <Route exact path="/skills">
        <Skills />
      </Route>
      <Route exact path="/fleet">
        <Fleet />
      </Route>
      <Route exact path="/fleet/register">
        <FleetRegister />
      </Route>
      <Route exact path="/xup">
        <Xup />
      </Route>
      <Route exact path="/pilot">
        <Pilot />
      </Route>
      <Route exact path="/search">
        <Search />
      </Route>
      <Route exact path="/guide">
        <GuideIndex />
      </Route>
      <Route exact path="/guide/:guideName">
        <Guide />
      </Route>
      <Route exact path="/">
        <Waitlist />
      </Route>

      <BanRoutes />
      <ACLRoutes />
    </>
  );
}
