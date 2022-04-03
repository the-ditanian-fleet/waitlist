import { Route } from "react-router";
import { Skills } from "./Skills";

export function SkillRoutes() {
  return (
    <>
      <Route exact path="/skills">
        <Skills />
      </Route>
    </>
  );
}
