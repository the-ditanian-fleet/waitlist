import { useApi } from "../../api";

import { InputGroup, Button, Buttons } from "../../Components/Form";

import { Fitout, ImplantOut } from "./FittingSortDisplay";

import { PageTitle } from "../../Components/Page";

import { useLocation, useHistory } from "react-router-dom";

export function Fits() {
  const queryParams = new URLSearchParams(useLocation().search);
  const history = useHistory();
  var tier = queryParams.get("Tier") || "Starter";
  const setTier = (newTier) => {
    queryParams.set("Tier", newTier);
    history.push({
      search: queryParams.toString(),
    });
  };

  return <FitsDisplay tier={tier} setTier={setTier} />;
}

function FitsDisplay({ tier, setTier = null }) {
  const [fitData] = useApi(`/api/fittings`);
  if (fitData === null) {
    return <em>Loading fits...</em>;
  }

  return (
    <>
      <PageTitle>HQ FITS</PageTitle>
      {setTier != null && (
        <Buttons style={{ marginBottom: "0.5em" }}>
          <InputGroup>
            <Button active={tier === "Starter"} onClick={(evt) => setTier("Starter")}>
              Starter
            </Button>
            <Button active={tier === "Basic"} onClick={(evt) => setTier("Basic")}>
              Basic
            </Button>
            <Button active={tier === "Advanced"} onClick={(evt) => setTier("Advanced")}>
              Advanced
            </Button>
            <Button active={tier === "Elite"} onClick={(evt) => setTier("Elite")}>
              Elite
            </Button>
          </InputGroup>
          <InputGroup>
            <Button active={tier === "Other"} onClick={(evt) => setTier("Other")}>
              Support
            </Button>
          </InputGroup>
          <InputGroup>
            <Button active={tier === "Nogank"} onClick={(evt) => setTier("Nogank")}>
              Antigank
            </Button>
          </InputGroup>
        </Buttons>
      )}
      <ImplantOut />
      {tier === "Starter" ? (
        <Fitout data={fitData} tier="Starter" />
      ) : tier === "Basic" ? (
        <Fitout data={fitData} tier="Basic" />
      ) : tier === "Advanced" ? (
        <Fitout data={fitData} tier="Advanced" />
      ) : tier === "Elite" ? (
        <Fitout data={fitData} tier="Elite" />
      ) : tier === "Other" ? (
        <Fitout data={fitData} tier="Other" />
      ) : tier === "Nogank" ? (
        <Fitout data={fitData} tier="Nogank" />
      ) : null}
    </>
  );
}
