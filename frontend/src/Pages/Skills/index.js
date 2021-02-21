import React from "react";
import { AuthContext } from "../../Auth";
import { useLocation } from "react-router-dom";
import { Badge } from "../../Components/Badge";
import { InputGroup, Button } from "../../Components/Form";

import styled from "styled-components";

const SkillDom = {};

SkillDom.Title = styled.h1`
  font-size: 3em;
  margin-bottom: 0.5em;
`;

SkillDom.Category = styled.div`
  display: flex;
  flex-wrap: wrap;
  > * {
    flex-grow: 1;
    flex-basis: 25%;
    min-width: 280px;
  }
`;

SkillDom.Category.Name = styled.h2`
  flex-basis: 100%;
  font-size: 2em;
  font-weight: 600;
  margin-top: 10px;
`;

SkillDom.Table = styled.div`
  padding: 1em;
`;

SkillDom.Table.Name = styled.h3`
  border-bottom: solid 2px ${(props) => props.theme.colors.accent2};
  font-weight: bolder;
  padding: 0.75em;
`;

SkillDom.Table.Row = styled.div`
  display: flex;
  padding: 0.5em 0.75em 0.5em 0.75em;
  border-bottom: solid 1px ${(props) => props.theme.colors.accent2};

  &:last-child {
    border-bottom: none;
  }
  &:nth-child(odd) {
    background-color: ${(props) => props.theme.colors.accent1};
  }
  > :last-child {
    margin-left: auto;
  }
`;

const LevelIndicator = ({ current, req }) => {
  if (current === 5) {
    return <Badge variant="success">{current}</Badge>;
  }
  if (current === req - 1) {
    return (
      <Badge variant="warning">
        {current} / {req}
      </Badge>
    );
  }
  if (current < req) {
    return (
      <Badge variant="danger">
        {current} / {req}
      </Badge>
    );
  }
  return <Badge variant="secondary">{current}</Badge>;
};

function SkillTable({ group, title, current, requirements, ids }) {
  var entries = [];
  requirements.forEach((skill) => {
    if (!(group in skill)) {
      return;
    }
    var currentLevel = current[ids[skill.name]];

    entries.push(
      <SkillDom.Table.Row key={skill.name}>
        {skill.name} <LevelIndicator current={currentLevel} req={skill[group]} />
      </SkillDom.Table.Row>
    );
  });

  if (!entries.length) {
    entries.push(<em key="noskills">No skill requirements.</em>);
  }

  return (
    <SkillDom.Table>
      <SkillDom.Table.Name>{title}</SkillDom.Table.Name>
      {entries}
    </SkillDom.Table>
  );
}

export function DpsSkills({ group, mySkills }) {
  return (
    <>
      <SkillDom.Category>
        <SkillDom.Category.Name>All ships</SkillDom.Category.Name>
        <SkillTable
          title="Armor"
          group={group}
          current={mySkills.current}
          requirements={mySkills.requirements.global.armor}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Engineering"
          group={group}
          current={mySkills.current}
          requirements={mySkills.requirements.global.engineering}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Drones"
          group={group}
          current={mySkills.current}
          requirements={mySkills.requirements.global.drones}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Navigation"
          group={group}
          current={mySkills.current}
          requirements={mySkills.requirements.global.navigation}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Gunnery"
          group={group}
          current={mySkills.current}
          requirements={mySkills.requirements.global.gunnery}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Targeting"
          group={group}
          current={mySkills.current}
          requirements={mySkills.requirements.global.targeting}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Neural Enhancement"
          group={group}
          current={mySkills.current}
          requirements={mySkills.requirements.global.neural_enhancement}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Shields"
          group={group}
          current={mySkills.current}
          requirements={mySkills.requirements.global.shields}
          ids={mySkills.ids}
        />
      </SkillDom.Category>
      <SkillDom.Category>
        <SkillDom.Category.Name>Ship-specific</SkillDom.Category.Name>
        <SkillTable
          title="Vindicator"
          group={group}
          current={mySkills.current}
          requirements={mySkills.requirements.ships.Vindicator}
          ids={mySkills.ids}
        />
        {group === "gold" ? null : (
          <SkillTable
            title="Nightmare"
            group={group}
            current={mySkills.current}
            requirements={mySkills.requirements.ships.Nightmare}
            ids={mySkills.ids}
          />
        )}
        <SkillTable
          title="Paladin"
          group={group}
          current={mySkills.current}
          requirements={mySkills.requirements.ships.Paladin}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Leshak"
          group={group}
          current={mySkills.current}
          requirements={mySkills.requirements.ships.Leshak}
          ids={mySkills.ids}
        />
      </SkillDom.Category>
    </>
  );
}

export function LogiSkills({ group, mySkills }) {
  return (
    <>
      <SkillDom.Category>
        <SkillDom.Category.Name>Logistics</SkillDom.Category.Name>
        <SkillTable
          title="All ships"
          group={group}
          current={mySkills.current}
          requirements={mySkills.requirements.logi.all}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Guardian"
          group={group}
          current={mySkills.current}
          requirements={mySkills.requirements.ships.Guardian}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Oneiros"
          group={group}
          current={mySkills.current}
          requirements={mySkills.requirements.ships.Oneiros}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Nestor"
          group={group}
          current={mySkills.current}
          requirements={mySkills.requirements.ships.Nestor}
          ids={mySkills.ids}
        />
      </SkillDom.Category>
    </>
  );
}

export function Skills() {
  const [skills, setSkills] = React.useState({});
  const [group, setGroup] = React.useState("elite");
  const authContext = React.useContext(AuthContext);
  const queryParams = new URLSearchParams(useLocation().search);
  var characterId = queryParams.get("character_id") || authContext.current.id;

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
    <>
      <SkillDom.Title>Skills for {mySkills.character_name}</SkillDom.Title>
      <InputGroup style={{ marginBottom: "1em" }}>
        <Button onClick={(evt) => setGroup("min")} active={group === "min"}>
          Minimum skills
        </Button>
        <Button onClick={(evt) => setGroup("elite")} active={group === "elite"}>
          Elite
        </Button>
        <Button onClick={(evt) => setGroup("gold")} active={group === "gold"}>
          Elite GOLD
        </Button>
        <Button onClick={(evt) => setGroup("logi")} active={group === "logi"}>
          Logistics
        </Button>
      </InputGroup>
      <div style={{ marginBottom: "1em" }}>
        Legend: <Badge variant="success">Max skill</Badge>{" "}
        <Badge variant="secondary">Sufficient</Badge> <Badge variant="warning">1 below</Badge>{" "}
        <Badge variant="danger">Low skill</Badge>
      </div>
      {group === "logi" ? (
        <LogiSkills group="min" mySkills={mySkills} />
      ) : (
        <DpsSkills group={group} mySkills={mySkills} />
      )}
    </>
  );
}
