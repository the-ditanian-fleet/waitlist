import React from "react";

import { Route } from "react-router-dom";
import { AuthContext } from "../contexts";

import { Skills } from "../Pages/Skills";
import { Waitlist } from "../Pages/Waitlist";
import { Xup, XupCheck } from "../Pages/Xup";
import { Pilot } from "../Pages/Pilot";
import { Home } from "../Pages/Home";
import { Guide, GuideIndex } from "../Pages/Guide";

import { FCRoutes } from "../Pages/FC";
import { AuthRoutes } from "../Pages/Auth";

export function Routes() {
  const authContext = React.useContext(AuthContext);
  return (
    <>
      <Route exact path="/">
        <Home />
      </Route>
      <Route exact path="/guide">
        <GuideIndex />
      </Route>
      <Route exact path="/guide/:guideName">
        <Guide />
      </Route>
      {authContext && (
        <>
          <Route exact path="/skills">
            <Skills />
          </Route>
          <Route exact path="/xup">
            <Xup />
          </Route>
          <Route exact path="/xup/check">
            <XupCheck />
          </Route>
          <Route exact path="/pilot">
            <Pilot />
          </Route>
          <Route exact path="/waitlist">
            <Waitlist />
          </Route>

          <FCRoutes />
        </>
      )}

      <AuthRoutes />
    </>
  );
}
