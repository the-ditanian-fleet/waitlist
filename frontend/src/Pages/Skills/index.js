import React from "react";
import { AuthContext, ToastContext } from "../../contexts";
import { apiCall, errorToaster } from "../../api";
import { useLocation, useHistory } from "react-router-dom";
import { Badge } from "../../Components/Badge";
import { PageTitle } from "../../Components/Page";
import { InputGroup, Button, Buttons } from "../../Components/Form";

import styled from "styled-components";
import _ from "lodash";

const SkillDom = {};

SkillDom.Category = styled.div`
  display: flex;
  flex-wrap: wrap;
  > * {
    flex-grow: 0;
    flex-basis: 25%;
    min-width: 280px;
  }
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

const categoryOrder = [
  "Tank",
  "Engineering",
  "Drones",
  "Navigation",
  "Gunnery",
  "Targeting",
  "Neural Enhancement",
  "Spaceship Command",
];
const knownCategories = new Set(categoryOrder);

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

function SkillTable({ title, current, requirements, ids, category }) {
  var entries = [];
  category.forEach((skillId) => {
    if (!(skillId in requirements)) {
      return;
    }
    const skill = requirements[skillId];

    entries.push(
      <SkillDom.Table.Row key={skillId}>
        {ids[skillId]} <LevelIndicator current={current[skillId]} skill={skill} />
      </SkillDom.Table.Row>
    );
  });

  if (!entries.length) {
    return null;
  }

  return (
    <SkillDom.Table>
      <SkillDom.Table.Name>{title}</SkillDom.Table.Name>
      {entries}
    </SkillDom.Table>
  );
}

export function SkillList({ mySkills, shipName }) {
  const ids = _.invert(mySkills.ids);

  if (!(shipName in mySkills.requirements)) {
    return <em>No skill information found</em>;
  }

  const categories = [...categoryOrder];
  _.forEach(_.keys(mySkills.categories), (categoryName) => {
    if (!knownCategories.has(categoryName)) {
      categories.push(categoryName);
    }
  });

  return (
    <>
      <SkillDom.Category>
        {categories.map((category) => (
          <SkillTable
            key={category}
            title={category}
            current={mySkills.current}
            requirements={mySkills.requirements[shipName]}
            category={mySkills.categories[category]}
            ids={ids}
          />
        ))}
      </SkillDom.Category>
    </>
  );
}

export function Skills() {
  const [skills, setSkills] = React.useState({});
  const toastContext = React.useContext(ToastContext);
  const authContext = React.useContext(AuthContext);
  const queryParams = new URLSearchParams(useLocation().search);
  const history = useHistory();

  var characterId = queryParams.get("character_id") || authContext.current.id;
  var ship = queryParams.get("ship") || "Vindicator";

  const setShip = (newShip) => {
    queryParams.set("ship", newShip);
    history.push({
      search: queryParams.toString(),
    });
  };

  React.useEffect(() => {
    var loadId = characterId; // Shadow
    errorToaster(
      toastContext,
      apiCall("/api/skills?character_id=" + loadId, {}).then((charSkills) =>
        setSkills({ [loadId]: charSkills })
      )
    );
  }, [toastContext, characterId]);

  if (!(characterId in skills)) {
    return <p>Loading skill information</p>;
  }

  var mySkills = skills[characterId];
  return (
    <>
      <PageTitle>Skills for {mySkills.character_name}</PageTitle>
      <Buttons style={{ marginBottom: "1em" }}>
        <InputGroup>
          <Button active={ship === "Vindicator"} onClick={(evt) => setShip("Vindicator")}>
            Vindicator
          </Button>
          <Button active={ship === "Nightmare"} onClick={(evt) => setShip("Nightmare")}>
            Nightmare
          </Button>
          <Button active={ship === "Paladin"} onClick={(evt) => setShip("Paladin")}>
            Paladin
          </Button>
          <Button active={ship === "Kronos"} onClick={(evt) => setShip("Kronos")}>
            Kronos
          </Button>
          <Button active={ship === "Leshak"} onClick={(evt) => setShip("Leshak")}>
            Leshak
          </Button>
        </InputGroup>
        <InputGroup>
          <Button active={ship === "Oneiros"} onClick={(evt) => setShip("Oneiros")}>
            Oneiros
          </Button>
          <Button active={ship === "Guardian"} onClick={(evt) => setShip("Guardian")}>
            Guardian
          </Button>
          <Button active={ship === "Nestor"} onClick={(evt) => setShip("Nestor")}>
            Nestor
          </Button>
        </InputGroup>
      </Buttons>
      <div style={{ marginBottom: "1em" }}>
        Legend: <Badge variant="danger">Starter</Badge> <Badge variant="warning">Basic</Badge>{" "}
        <Badge variant="secondary">Elite</Badge> <Badge variant="success">Elite GOLD</Badge>
      </div>
      <SkillList mySkills={mySkills} shipName={ship} />
    </>
  );
}
