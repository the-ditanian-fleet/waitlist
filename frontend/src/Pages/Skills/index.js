import React from "react";
import { AuthContext } from "../../Auth";
import { useLocation } from "react-router-dom";
import { Badge } from "../../Components/Badge";
import { PageTitle } from "../../Components/Page";

import styled from "styled-components";

const SkillDom = {};

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

const LevelIndicator = ({ current, skill }) => {
  if (current === 5) {
    return <Badge variant="success">{current}</Badge>;
  }

  var nextLevel = null;

  for (const [group, variant] of [
    ["gold", "success"],
    ["elite", "secondary"],
    ["min", "warning"],
  ]) {
    if (group in skill) {
      if (current >= skill[group]) {
        return (
          <Badge variant={variant}>
            {current}
            {nextLevel}
          </Badge>
        );
      }
      nextLevel = ` / ${skill[group]}`;
    }
  }

  for (const [group, variant] of [
    ["min", "danger"],
    ["elite", "warning"],
    ["gold", "secondary"],
  ]) {
    if (group in skill) {
      return (
        <Badge variant={variant}>
          {current}
          {nextLevel}
        </Badge>
      );
    }
  }

  return null;
};

function SkillTable({ title, current, requirements, ids }) {
  var entries = [];
  requirements.forEach((skill) => {
    var currentLevel = current[ids[skill.name]];

    entries.push(
      <SkillDom.Table.Row key={skill.name}>
        {skill.name} <LevelIndicator current={currentLevel} skill={skill} />
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

export function DpsSkills({ mySkills }) {
  return (
    <>
      <SkillDom.Category>
        <SkillDom.Category.Name>All ships</SkillDom.Category.Name>
        <SkillTable
          title="Armor"
          current={mySkills.current}
          requirements={mySkills.requirements.global.armor}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Engineering"
          current={mySkills.current}
          requirements={mySkills.requirements.global.engineering}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Drones"
          current={mySkills.current}
          requirements={mySkills.requirements.global.drones}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Gunnery"
          current={mySkills.current}
          requirements={mySkills.requirements.global.gunnery}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Navigation"
          current={mySkills.current}
          requirements={mySkills.requirements.global.navigation}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Neural Enhancement"
          current={mySkills.current}
          requirements={mySkills.requirements.global.neural_enhancement}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Targeting"
          current={mySkills.current}
          requirements={mySkills.requirements.global.targeting}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Shields"
          current={mySkills.current}
          requirements={mySkills.requirements.global.shields}
          ids={mySkills.ids}
        />
      </SkillDom.Category>
      <SkillDom.Category>
        <SkillDom.Category.Name>Ship-specific</SkillDom.Category.Name>
        <SkillTable
          title="Paladin"
          current={mySkills.current}
          requirements={mySkills.requirements.ships.Paladin}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Nightmare"
          current={mySkills.current}
          requirements={mySkills.requirements.ships.Nightmare}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Leshak"
          current={mySkills.current}
          requirements={mySkills.requirements.ships.Leshak}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Vindicator"
          current={mySkills.current}
          requirements={mySkills.requirements.ships.Vindicator}
          ids={mySkills.ids}
        />
      </SkillDom.Category>
    </>
  );
}

export function LogiSkills({ mySkills }) {
  return (
    <>
      <SkillDom.Category>
        <SkillDom.Category.Name>Logistics</SkillDom.Category.Name>
        <SkillTable
          title="All ships"
          current={mySkills.current}
          requirements={mySkills.requirements.logi.all}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Guardian"
          current={mySkills.current}
          requirements={mySkills.requirements.ships.Guardian}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Oneiros"
          current={mySkills.current}
          requirements={mySkills.requirements.ships.Oneiros}
          ids={mySkills.ids}
        />
        <SkillTable
          title="Nestor"
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
      <PageTitle>Skills for {mySkills.character_name}</PageTitle>
      <div style={{ marginBottom: "1em" }}>
        Legend: <Badge variant="danger">Starter</Badge> <Badge variant="warning">Basic</Badge>{" "}
        <Badge variant="secondary">Elite</Badge> <Badge variant="success">Elite GOLD</Badge>
      </div>
      <DpsSkills mySkills={mySkills} />
      <LogiSkills mySkills={mySkills} />
    </>
  );
}
