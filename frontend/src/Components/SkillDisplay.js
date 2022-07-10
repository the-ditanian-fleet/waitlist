import { useApi } from "../api";
import { Badge } from "./Badge";
import { InputGroup, Button, Buttons } from "./Form";
import { Col, Row } from "react-awesome-styled-grid";
import { InfoNote } from "./NoteBox";

import styled from "styled-components";
import _ from "lodash";

const SkillDom = {};

SkillDom.Table = styled.div`
  margin-bottom: 2em;
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

const SkillHeader = styled.div`
  height: 36px;
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

function SkillTable({ title, current, requirements, ids, category, filterMin }) {
  var entries = [];
  category.forEach((skillId) => {
    if (!(skillId in requirements)) {
      return;
    }
    const skill = requirements[skillId];
    if (filterMin) {
      if (!skill.min) return;
      if (skill.min <= current[skillId]) {
        return;
      }
    }

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
    <Col xs={4} sm={4} md={2}>
      <SkillDom.Table>
        <SkillDom.Table.Name>{title}</SkillDom.Table.Name>
        {entries}
      </SkillDom.Table>
    </Col>
  );
}

export function SkillList({ mySkills, shipName, filterMin }) {
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
      <Row>
        {categories.map((category) => (
          <SkillTable
            key={category}
            title={category}
            current={mySkills.current}
            requirements={mySkills.requirements[shipName]}
            category={mySkills.categories[category]}
            ids={ids}
            filterMin={filterMin}
          />
        ))}
      </Row>
    </>
  );
}

export function Legend() {}

export function SkillDisplay({ characterId, ship, setShip = null, filterMin = false }) {
  const [skills] = useApi(`/api/skills?character_id=${characterId}`);

  return (
    <>
      {setShip != null && (
        <Buttons style={{ marginBottom: "1em" }}>
          <InputGroup>
            <Button active={ship === "Vindicator"} onClick={(evt) => setShip("Vindicator")}>
              Vindicator
            </Button>
            <Button active={ship === "Kronos"} onClick={(evt) => setShip("Kronos")}>
              Kronos
            </Button>
            <Button active={ship === "Nightmare"} onClick={(evt) => setShip("Nightmare")}>
              Nightmare
            </Button>
            <Button active={ship === "Paladin"} onClick={(evt) => setShip("Paladin")}>
              Paladin
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
          <InputGroup>
            <Button active={ship === "Eos"} onClick={(evt) => setShip("Eos")}>
              Eos
            </Button>
            <Button active={ship === "Damnation"} onClick={(evt) => setShip("Damnation")}>
              Damnation
            </Button>
          </InputGroup>
        </Buttons>
      )}

      <div style={{ marginBottom: "1em" }}>
        Legend: <Badge variant="danger">Starter</Badge> <Badge variant="warning">Basic</Badge>{" "}
        <Badge variant="secondary">Elite</Badge> <Badge variant="success">Elite GOLD</Badge>
      </div>
      <SkillHeader>
        {ship === "Nestor" || ship === "Guardian" || ship === "Oneiros" ? (
          <InfoNote>Basic tier skills are required for logistics.</InfoNote>
        ) : null}
      </SkillHeader>
      {skills ? (
        <SkillList mySkills={skills} shipName={ship} filterMin={filterMin} />
      ) : (
        <p>Loading skill information</p>
      )}
    </>
  );
}
