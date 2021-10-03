import React from "react";
import { NavLink } from "react-router-dom";
import { PageTitle } from "../../Components/Page";
import { AuthContext } from "../../contexts";
//import styled from "styled-components";
//import { ToastContext } from "../../contexts";
//import { errorToaster } from "../../api";
//import { Markdown } from "../../Components/Markdown";
import { Row, Col } from "react-awesome-styled-grid";
import { Card } from "../../Components/Card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGraduationCap,
  faBan,
  faUserCheck,
  faBiohazard,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";

function GuideCard({ icon, slug, name, children }) {
  return (
    <Col xs={4} sm={4} lg={3}>
      <NavLink style={{ textDecoration: "inherit", color: "inherit" }} exact to={`${slug}`}>
        <Card
          title={
            <>
              <FontAwesomeIcon fixedWidth icon={icon} /> {name}
            </>
          }
        >
          <p>{children}</p>
        </Card>
      </NavLink>
    </Col>
  );
}

export function FCMenu() {
  const authContext = React.useContext(AuthContext);
  return (
    <>
      <PageTitle>FC Dashboard</PageTitle>
      <Row>
        {authContext && authContext.access["bans-view"] && (
          <GuideCard slug="/fc/bans" name="Bans" icon={faBan}></GuideCard>
        )}
        {authContext && authContext.access["access-view"] && (
          <GuideCard slug="/fc/acl" name="Permissions" icon={faUserCheck}></GuideCard>
        )}
        {authContext &&
          authContext.access["fleet-view"] && ( //fleet view should be any fc
            <GuideCard
              slug="/guide/hqtraineehelp"
              name="FC Training"
              icon={faGraduationCap}
            ></GuideCard>
          )}
        {authContext &&
          authContext.access["search"] && ( //any full FC
            <GuideCard slug="/guide/hqfcdoc" name="FC Documentation" icon={faBiohazard}></GuideCard>
          )}
        {authContext && authContext.access["stats-view"] && (
          <GuideCard slug="/fc/stats" name="Statistics" icon={faChartLine}></GuideCard>
        )}
      </Row>
    </>
  );
}
