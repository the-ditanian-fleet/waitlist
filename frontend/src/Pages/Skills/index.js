import React from "react";
import { AuthContext } from "../../Auth";
import { useLocation } from "react-router-dom";

function SkillTable({ group, title, current, requirements, ids }) {
  var entries = [];
  requirements.forEach((skill) => {
    if (!(group in skill)) {
      return;
    }
    var currentLevel = current[ids[skill.name]];
    var indicator;
    if (currentLevel === 5) {
      indicator = (
        <span style={{ float: "right" }} className="tag is-success">
          {currentLevel}
        </span>
      );
    } else if (currentLevel === skill[group] - 1) {
      indicator = (
        <span style={{ float: "right" }} className="tag is-warning">
          {currentLevel} / {skill[group]}
        </span>
      );
    } else if (currentLevel < skill[group]) {
      indicator = (
        <span style={{ float: "right" }} className="tag is-danger">
          {currentLevel} / {skill[group]}
        </span>
      );
    } else {
      indicator = (
        <span style={{ float: "right" }} className="tag">
          {currentLevel}
        </span>
      );
    }
    entries.push(
      <tr key={skill.name}>
        <td>
          {indicator}
          {skill.name}
        </td>
      </tr>
    );
  });

  return (
    <div className="column">
      <table className="table is-striped">
        <thead>
          <tr>
            <th>{title}</th>
          </tr>
        </thead>
        <tbody>{entries}</tbody>
      </table>
    </div>
  );
}

export function DpsSkills({ group, mySkills }) {
  return (
    <>
      <h3 className="subtitle is-3">All ships</h3>
      <div className="columns">
        <div className="column">
          <SkillTable
            title="Armor"
            group={group}
            current={mySkills.current}
            requirements={mySkills.requirements.global.armor}
            ids={mySkills.ids}
          />
        </div>
        <div className="column">
          <SkillTable
            title="Engineering"
            group={group}
            current={mySkills.current}
            requirements={mySkills.requirements.global.engineering}
            ids={mySkills.ids}
          />
        </div>
        <div className="column">
          <SkillTable
            title="Drones"
            group={group}
            current={mySkills.current}
            requirements={mySkills.requirements.global.drones}
            ids={mySkills.ids}
          />
        </div>
        <div className="column">
          <SkillTable
            title="Navigation"
            group={group}
            current={mySkills.current}
            requirements={mySkills.requirements.global.navigation}
            ids={mySkills.ids}
          />
        </div>
      </div>
      <div className="columns">
        <div className="column">
          <SkillTable
            title="Gunnery"
            group={group}
            current={mySkills.current}
            requirements={mySkills.requirements.global.gunnery}
            ids={mySkills.ids}
          />
        </div>
        <div className="column">
          <SkillTable
            title="Targeting"
            group={group}
            current={mySkills.current}
            requirements={mySkills.requirements.global.targeting}
            ids={mySkills.ids}
          />
        </div>
        <div className="column">
          <SkillTable
            title="Neural Enhancement"
            group={group}
            current={mySkills.current}
            requirements={mySkills.requirements.global.neural_enhancement}
            ids={mySkills.ids}
          />
        </div>
        <div className="column">
          <SkillTable
            title="Shields"
            group={group}
            current={mySkills.current}
            requirements={mySkills.requirements.global.shields}
            ids={mySkills.ids}
          />
        </div>
      </div>
      <h3 className="subtitle is-3">Ship-specific</h3>
      <div className="columns">
        <div className="column">
          <SkillTable
            title="Vindicator"
            group={group}
            current={mySkills.current}
            requirements={mySkills.requirements.ships.Vindicator}
            ids={mySkills.ids}
          />
        </div>
        <div className="column">
          <SkillTable
            title="Nightmare"
            group={group}
            current={mySkills.current}
            requirements={mySkills.requirements.ships.Nightmare}
            ids={mySkills.ids}
          />
        </div>
        <div className="column">
          <SkillTable
            title="Paladin"
            group={group}
            current={mySkills.current}
            requirements={mySkills.requirements.ships.Paladin}
            ids={mySkills.ids}
          />
        </div>
        <div className="column">
          <SkillTable
            title="Leshak"
            group={group}
            current={mySkills.current}
            requirements={mySkills.requirements.ships.Leshak}
            ids={mySkills.ids}
          />
        </div>
      </div>
    </>
  );
}

export function LogiSkills({ group, mySkills }) {
  return (
    <>
      <h3 className="subtitle is-3">Logistics</h3>
      <div className="columns">
        <div className="column">
          <SkillTable
            title="All ships"
            group={group}
            current={mySkills.current}
            requirements={mySkills.requirements.logi.all}
            ids={mySkills.ids}
          />
        </div>
        <div className="column">
          <SkillTable
            title="Guardian"
            group={group}
            current={mySkills.current}
            requirements={mySkills.requirements.ships.Guardian}
            ids={mySkills.ids}
          />
        </div>
        <div className="column">
          <SkillTable
            title="Oneiros"
            group={group}
            current={mySkills.current}
            requirements={mySkills.requirements.ships.Oneiros}
            ids={mySkills.ids}
          />
        </div>
        <div className="column">
          <SkillTable
            title="Nestor"
            group={group}
            current={mySkills.current}
            requirements={mySkills.requirements.ships.Nestor}
            ids={mySkills.ids}
          />
        </div>
      </div>
    </>
  );
}

export function Skills() {
  const [skills, setSkills] = React.useState({});
  const [group, setGroup] = React.useState("elite");
  const authContext = React.useContext(AuthContext);
  const queryParams = new URLSearchParams(useLocation().search);
  var characterId = queryParams.get("character_id") || authContext.id;

  React.useEffect(() => {
    var loadId = characterId; // Shadow
    fetch("/api/skills?character_id=" + loadId)
      .then((response) => response.json())
      .then((charSkills) => setSkills({ [loadId]: charSkills }));
  }, [characterId]);

  if (!(characterId in skills)) {
    return <p>Loading skill information</p>;
  }

  var mySkills = skills[characterId];
  return (
    <div className="content">
      <h1 className="title is-1">Skills for {mySkills.character_name}</h1>
      <div className="buttons has-addons">
        <button
          onClick={(evt) => setGroup("min")}
          className={"button " + (group === "min" ? "is-active" : "")}
        >
          Minimum skills
        </button>
        <button
          onClick={(evt) => setGroup("elite")}
          className={"button " + (group === "elite" ? "is-active" : "")}
        >
          Elite
        </button>
        <button
          onClick={(evt) => setGroup("logi")}
          className={"button " + (group === "logi" ? "is-active" : "")}
        >
          Logistics
        </button>
      </div>
      <div className="block">
        {"Legend: "}
        <span className="tag is-success">
          Max skill
        </span> <span className="tag">Sufficient</span>{" "}
        <span className="tag is-warning">1 below</span>{" "}
        <span className="tag is-danger">Low skill</span>
      </div>
      {group === "logi" ? (
        <LogiSkills group="min" mySkills={mySkills} />
      ) : (
        <DpsSkills group={group} mySkills={mySkills} />
      )}
    </div>
  );
}
