import React from "react";
import { ToastContext, AuthContext } from "../contexts";
import { addToast } from "../Components/Toast";
import { apiCall, errorToaster } from "../api";
import { Button, Buttons, InputGroup, NavButton, Textarea } from "../Components/Form";
import { useHistory, useLocation } from "react-router-dom";
import { PageTitle } from "../Components/Page";
import { FitDisplay } from "../Components/FitDisplay";
import _ from "lodash";

const exampleFit = String.raw`
[Vindicator, Vindicator]
Centum A-Type Multispectrum Energized Membrane
Centum A-Type Multispectrum Energized Membrane
Shadow Serpentis Damage Control
Abyssal Magnetic Field Stabilizer
Abyssal Magnetic Field Stabilizer
Abyssal Magnetic Field Stabilizer
Abyssal Magnetic Field Stabilizer

Core X-Type 500MN Microwarpdrive
Federation Navy Stasis Webifier
Federation Navy Stasis Webifier
Shadow Serpentis Tracking Computer
Shadow Serpentis Tracking Computer

Neutron Blaster Cannon II
Neutron Blaster Cannon II
Neutron Blaster Cannon II
Neutron Blaster Cannon II
Neutron Blaster Cannon II
Neutron Blaster Cannon II
Neutron Blaster Cannon II
Neutron Blaster Cannon II

Large Explosive Armor Reinforcer I
Large Hybrid Burst Aerator II
`.trim();

async function xUp({ character, eft, toastContext, history, waitlist_id }) {
  await apiCall("/api/waitlist/xup", {
    json: { eft: eft, character_id: character, waitlist_id },
  });

  addToast(toastContext, {
    title: "Added to waitlist.",
    message: "Your X has been added to the waitlist!",
    variant: "success",
  });
  history.push("/xup/check?wl=" + waitlist_id);

  if (window.Notification) {
    Notification.requestPermission();
  }
}

export function Xup() {
  const toastContext = React.useContext(ToastContext);
  const authContext = React.useContext(AuthContext);
  const history = useHistory();
  const queryParams = new URLSearchParams(useLocation().search);
  const [eft, setEft] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const waitlist_id = queryParams.get("wl");
  if (!waitlist_id) {
    return <em>Missing waitlist information</em>;
  }

  return (
    <div style={{ display: "flex" }}>
      <div style={{ flexGrow: 1, marginRight: "1em" }}>
        <h2 style={{ fontSize: "2em" }}>X-up with fit(s)</h2>
        <Textarea
          placeholder={exampleFit}
          rows={15}
          onChange={(evt) => setEft(evt.target.value)}
          value={eft}
          style={{ minWidth: "500px", marginBottom: "1em" }}
        />
        <InputGroup>
          <Button static>{authContext.current.name}</Button>
          <Button
            variant="success"
            onClick={(evt) => {
              setIsSubmitting(true);
              errorToaster(
                toastContext,
                xUp({ character: authContext.current.id, eft, toastContext, history, waitlist_id })
              ).finally((evt) => setIsSubmitting(false));
            }}
            disabled={eft.trim().length < 50 || !eft.startsWith("[") || isSubmitting}
          >
            X-up
          </Button>
        </InputGroup>
      </div>
      <div>
        <h2 style={{ textAlign: "right", fontSize: "2em" }}>How to X?</h2>
        <img
          width="300"
          src="https://i.imgur.com/8Gh05lg.png"
          alt="On the bottom left of the Fitting window you will find a copy button"
        />
      </div>
    </div>
  );
}

export function XupCheck() {
  const authContext = React.useContext(AuthContext);
  const toastContext = React.useContext(ToastContext);
  const [xupData, setXupData] = React.useState(null);

  const queryParams = new URLSearchParams(useLocation().search);
  const waitlist_id = queryParams.get("wl");

  React.useEffect(() => {
    if (!waitlist_id) return;
    errorToaster(
      toastContext,
      apiCall("/api/waitlist?waitlist_id=" + waitlist_id, {}).then(setXupData)
    );
  }, [waitlist_id, toastContext]);

  if (!waitlist_id) {
    return <em>Missing waitlist information</em>;
  }
  if (!xupData) {
    return <em>Loading</em>;
  }

  const myEntry = _.find(
    xupData.waitlist,
    (entry) => entry.character && entry.character.id === authContext.account_id
  );

  return (
    <>
      <PageTitle>Fit review</PageTitle>
      <em>
        You are now on the waitlist! These are the fits you x-ed up with, please check to make sure
        you have everything and adjust your fit if needed.
      </em>
      {myEntry.fits.map((fit) => (
        <FitDisplay key={fit.id} fit={fit} />
      ))}
      <Buttons>
        <NavButton variant="primary" to={`/waitlist?wl=${waitlist_id}`}>
          Yes, looks good
        </NavButton>
        <NavButton variant="secondary" to={`/xup?wl=${waitlist_id}`}>
          No, go back to update my fit
        </NavButton>
      </Buttons>
    </>
  );
}
