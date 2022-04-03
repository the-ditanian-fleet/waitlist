import React from "react";
import { toaster, useApi } from "../../api";
import { AuthContext, ToastContext } from "../../contexts";
import _ from "lodash";
import { Content, PageTitle } from "../../Components/Page";
import { Table, Row, Cell, TableHead, TableBody, CellHead } from "../../Components/Table";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faPaste } from "@fortawesome/free-solid-svg-icons";
import { Button, Buttons } from "../../Components/Form";
import { Row as GridRow, Col } from "react-awesome-styled-grid";

import skillqueueImage from "./skillqueue.png";
import { Modal } from "../../Components/Modal";
import styled from "styled-components";
import { useQuery } from "../../Util/query";
import { Card, CardMargin, CardArray } from "../../Components/Card";
import { NavLink } from "react-router-dom";

export function Plans() {
  const authContext = React.useContext(AuthContext);
  if (!authContext) {
    return (
      <Content>
        <p>Login Required!</p>
        <p>
          This page will show copyable skill plan tables comparing to your current skills with
          checkmarks next to already completed skills.
        </p>
      </Content>
    );
  }
  return <PlanDisplay authContext={authContext} />;
}

function PlanDisplay({ authContext }) {
  const [{ plan }] = useQuery();

  const [plans] = useApi("/api/skills/plans");
  const [mySkills] = useApi(`/api/skills?character_id=${authContext.current.id}`);

  if (!plans || !mySkills) {
    return <em>Loading...</em>;
  }

  if (plan) {
    const planObj = _.find(plans.plans, (elmt) => elmt.source.name === plan);
    if (!planObj) {
      return <em>Plan not found</em>;
    }
    return <ShowPlan plan={planObj} mySkills={mySkills} />;
  }

  return <PlanList plans={plans.plans} mySkills={mySkills} />;
}

function romanNumeral(i) {
  if (i === 1) return "I";
  if (i === 2) return "II";
  if (i === 3) return "III";
  if (i === 4) return "IV";
  if (i === 5) return "V";
  throw new Error("Unlikely skill numeral");
}

function copyablePlan(levels, lookup) {
  return levels
    .map(([skillId, level]) => `${lookup[skillId] || "MISSING SKILL"} ${romanNumeral(level)}`)
    .join("\n");
}

function ShowPlan({ plan, mySkills }) {
  const toastContext = React.useContext(ToastContext);
  const [howtoModal, setHowtoModal] = React.useState(false);

  var skillList = [];
  var lookup = _.invert(mySkills.ids);
  _.forEach(plan.levels, ([skillId, level]) => {
    const skillName = lookup[skillId];
    const trainedLevel = mySkills.current[skillId];

    skillList.push(
      <Row key={`${skillId} ${level}`}>
        <Cell>
          {skillName || "MISSING SKILL"} {romanNumeral(level)}
        </Cell>
        <Cell>{trainedLevel >= level ? <FontAwesomeIcon icon={faCheck} /> : null}</Cell>
      </Row>
    );
  });

  return (
    <GridRow>
      <Col xs={4} md={4}>
        <Buttons>
          <NavLink
            exact
            to={`/skills/plans`}
            style={{ textDecoration: "inherit", color: "inherit" }}
          >
            <Button>Back</Button>
          </NavLink>
        </Buttons>
        <Content>
          <h2>{plan.source.name}</h2>
          <p>{plan.source.description}</p>
          <div style={{ marginTop: "2em" }}>
            {plan.ships.map((ship) => (
              <img
                key={ship.id}
                src={`https://images.evetech.net/types/${ship.id}/render?size=128`}
                style={{ maxWidth: "128px", margin: "0.5em" }}
                alt={ship.name}
                title={ship.name}
              />
            ))}
          </div>
        </Content>
      </Col>
      <Col xs={4} md={4}>
        <p style={{ marginBottom: "1em" }}>
          <Button
            onClick={(evt) => {
              toaster(
                toastContext,
                navigator.clipboard
                  .writeText(copyablePlan(plan.levels, lookup))
                  .then((success) => "Copied to clipboard")
              );
            }}
          >
            <FontAwesomeIcon icon={faPaste} />
          </Button>{" "}
          <a
            style={{ textDecoration: "underline", cursor: "pointer" }}
            onClick={(evt) => setHowtoModal(true)}
          >
            How do I use this?
          </a>
        </p>
        <Table>
          <TableHead>
            <Row>
              <CellHead>Skill</CellHead>
              <CellHead></CellHead>
            </Row>
          </TableHead>
          <TableBody>{skillList}</TableBody>
        </Table>
      </Col>

      <Modal open={howtoModal} setOpen={setHowtoModal}>
        <img alt="Explanation for using the skill queue" src={skillqueueImage} />
      </Modal>
    </GridRow>
  );
}

const CardImages = styled.div`
  border: solid 2px ${(props) => props.theme.colors["secondary"].color};
  line-height: 0;
  padding: 0.1em;
  justify-content: center;
  border-radius: 5px;
  max-width: fit-content;
  img {
    margin: 1px;
    border-radius: 3px;
    max-width: 31px;
  }
`;

function PlanList({ plans, mySkills }) {
  return (
    <>
      <PageTitle>Skill plans</PageTitle>
      <CardArray>
        {plans.map((plan) => (
          <CardMargin key={plan.source.name}>
            <NavLink
              exact
              to={`/skills/plans?plan=${plan.source.name}`}
              style={{ textDecoration: "inherit", color: "inherit" }}
            >
              <Card title={plan.source.name}>
                <CardImages>
                  {plan.ships.map((ship) => (
                    <img
                      key={ship.id}
                      src={`https://images.evetech.net/types/${ship.id}/icon?size=64`}
                      alt={ship.name}
                      title={ship.name}
                    />
                  ))}
                </CardImages>
                <p>{plan.source.description}</p>
              </Card>
            </NavLink>
          </CardMargin>
        ))}
      </CardArray>
    </>
  );
}
