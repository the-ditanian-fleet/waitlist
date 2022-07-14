import React from "react";

import { Route } from "react-router-dom";
import { AuthContext } from "../contexts";

import { SkillRoutes } from "../Pages/Skills";
import { Plans } from "../Pages/Skills/Plans";
import { Waitlist } from "../Pages/Waitlist";
import { Xup } from "../Pages/Xup";
import { Pilot } from "../Pages/Pilot";
import { Home } from "../Pages/Home";
import { Legal } from "../Pages/Legal";
import { Fits } from "../Pages/Fits";
import { Guide, GuideIndex, BadgeIndex } from "../Pages/Guide";
import { FCRoutes } from "../Pages/FC";
import { AuthRoutes } from "../Pages/Auth";
import { ISKh, ISKhCalc } from "../Pages/ISKh";

function LoginRequired() {
  return <b>Login Required!</b>;
}

export function Routes() {
  const authContext = React.useContext(AuthContext);
  return (
    <>
      <Route exact path="/">
        <Home />
      </Route>
      <Route exact path="/legal">
        <Legal />
      </Route>
      <Route exact path="/guide">
        <GuideIndex />
      </Route>
      <Route exact path="/badges">
        <BadgeIndex />
      </Route>
      <Route exact path="/guide/:guideName">
        <Guide />
      </Route>
      <Route exact path="/isk-h/calc">
        <ISKhCalc />
      </Route>
      <Route exact path="/isk-h">
        <ISKh />
      </Route>
      <Route exact path="/fits">
        <Fits />
      </Route>
      <Route exact path="/skills/plans">
        <Plans />
      </Route>
      <SkillRoutes />
      <Route exact path="/pilot">
        <Pilot />
      </Route>
      <Route exact path="/xup">
        {authContext ? <Xup /> : <LoginRequired />}
      </Route>
      <Route exact path="/waitlist">
        {authContext ? <Waitlist /> : <LoginRequired />}
      </Route>
      {authContext && <FCRoutes />}
      <AuthRoutes />
    </>
  );
}
