import { useContext } from "react";

import { Route, Switch } from "react-router-dom";
import { AuthContext } from "../contexts";

import { AuthStart, AuthCallback, AuthLogout } from "../Pages/Auth";
import { BadgeIndex, Guide, GuideIndex } from "../Pages/Guide";
import { Fits } from "../Pages/Fits";
import { FCMenu, GuideFC } from "../Pages/FC/Index";
import { Fleet, FleetRegister } from "../Pages/FC/Fleet";
import { FleetCompHistory } from "../Pages/FC/FleetCompHistory";
import { Home } from "../Pages/Home";
import { ISKh, ISKhCalc } from "../Pages/ISKh";
import { Legal } from "../Pages/Legal";
import { NoteAdd } from "../Pages/FC/NoteAdd";
import { Pilot } from "../Pages/Pilot";
import { Plans } from "../Pages/Skills/Plans";
import { Search } from "../Pages/FC/Search";
import { Skills } from "../Pages/Skills/Skills";
import { Statistics } from "../Pages/FC/Statistics";
import { Waitlist } from "../Pages/Waitlist";
import { Xup } from "../Pages/Xup";

import AnnouncementsPage from "../Pages/FC/Announcements";
import BadgesPage from "../Pages/FC/Badges";
import BansPage from "../Pages/FC/Bans";
import CommandersPage from "../Pages/FC/Commanders";

import { E401, E403, E404 } from "../Pages/Errors";

const AuthenticatedRoute = ({ component, loginRequired = false, access = null }) => {
  const authContext = useContext(AuthContext);

  if (!loginRequired && !access) {
    return component; // Page doesn't require authentication
  }

  if (!authContext) {
    return <E401 />; // User isn't authenticated
  }

  if (access && !authContext.access[access]) {
    return <E403 />; // User lacks the required permission
  }

  // All auth checks OK
  return component;
};

export function Routes() {
  return (
    <Switch>
      <Route exact path="/">
        <Home />
      </Route>

      <Route exact path="/fits">
        <Fits />
      </Route>
      <Route exact path="/isk-h">
        <ISKh />
      </Route>
      <Route exact path="/isk-h/calc">
        <ISKhCalc />
      </Route>
      <Route exact path="/pilot">
        <Pilot />
      </Route>
      <Route exact path="/skills">
        <Skills />
      </Route>
      <Route exact path="/skills/plans">
        <Plans />
      </Route>

      {/* Guides: Badges, Index, Guide Page */}
      <Route exact path="/badges">
        <BadgeIndex />
      </Route>
      <Route exact path="/guide">
        <GuideIndex />
      </Route>
      <Route exact path="/guide/:guideName">
        <Guide />
      </Route>
      <Route exact path="/legal">
        <Legal />
      </Route>

      {/* Waitlist Pages: Waitlist, XUP */}
      <Route exact path="/waitlist">
        {<AuthenticatedRoute component={<Waitlist />} loginRequired />}
      </Route>
      <Route exact path="/xup">
        {<AuthenticatedRoute component={<Xup />} loginRequired />}
      </Route>

      {/* Fleet Commander Routes */}
      <Route exact path="/fc">
        {/* 'fleet-view' allows any FC to use this route */}
        <AuthenticatedRoute component={<FCMenu />} access="fleet-view" />
      </Route>
      <Route exact path="/fc/announcements">
        <AuthenticatedRoute component={<AnnouncementsPage />} access="waitlist-tag:HQ-FC" />
      </Route>
      <Route exact path="/fc/badges">
        <AuthenticatedRoute component={<BadgesPage />} access="badges-manage" />
      </Route>
      <Route exact path="/fc/bans">
        <AuthenticatedRoute component={<BansPage />} access="bans-manage" />
      </Route>
      <Route exact path="/fc/commanders">
        <AuthenticatedRoute component={<CommandersPage />} access="commanders-view" />
      </Route>
      <Route exact path="/fc/documentation">
        <AuthenticatedRoute component={<GuideFC />} access="waitlist-tag:HQ-FC" />
      </Route>
      <Route exact path="/fc/fleet">
        <AuthenticatedRoute component={<Fleet />} access="fleet-view" />
      </Route>
      <Route exact path="/fc/fleet/register">
        <AuthenticatedRoute component={<FleetRegister />} access="fleet-view" />
      </Route>
      <Route exact path="/fc/fleet/history">
        <AuthenticatedRoute component={<FleetCompHistory />} access="fleet-history-view" />
      </Route>
      <Route exact path="/fc/notes/add">
        <AuthenticatedRoute component={<NoteAdd />} access="notes-add" />
      </Route>
      <Route exact path="/fc/search">
        <AuthenticatedRoute component={<Search />} access="waitlist-tag:HQ-FC" />
      </Route>
      <Route exact path="/fc/stats">
        <AuthenticatedRoute component={<Statistics />} access="stats-view" />
      </Route>
      <Route exact path="/fc/trainee">
        <AuthenticatedRoute component={<GuideFC />} access="waitlist-tag:TRAINEE" />
      </Route>

      {/* Auth Routes: Login, Callback, Logout */}
      <Route exact path="/auth/start">
        <AuthStart />
      </Route>
      <Route exact path="/auth/start/fc">
        <AuthStart fc={true} alt={true} />
      </Route>
      <Route exact path="/auth/start/alt">
        <AuthStart alt={true} />
      </Route>
      <Route exact path="/auth/cb">
        <AuthCallback />
      </Route>
      <Route exact path="/auth/logout">
        <AuthLogout />
      </Route>

      <Route path="*">
        <E404 />
      </Route>
    </Switch>
  );
}
