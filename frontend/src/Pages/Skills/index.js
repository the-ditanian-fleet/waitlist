import { Route } from "react-router";
import { Skills } from "./Skills";
import { Plans } from "./Plans";

export function SkillRoutes() {
  return (
    <>
      <Route exact path="/skills">
        <Skills />
      </Route>
      <Route exact path="/skills/plans">
        <Plans />
      </Route>
    </>
  );
}
