import React from "react";
import { ToastContext, AuthContext } from "../../contexts";
import { addToast } from "../../Components/Toast";
import { apiCall, errorToaster, useApi } from "../../api";
import { Button, Buttons, InputGroup, NavButton, Textarea } from "../../Components/Form";
import { useLocation } from "react-router-dom";
import { PageTitle } from "../../Components/Page";
import { FitDisplay } from "../../Components/FitDisplay";
import _ from "lodash";
import { Box } from "../../Components/Box";
import { Modal } from "../../Components/Modal";

import howToX from "./howtox.png";

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

async function xUp({ character, eft, toastContext, waitlist_id }) {
  await apiCall("/api/waitlist/xup", {
    json: { eft: eft, character_id: character, waitlist_id: parseInt(waitlist_id) },
  });

  addToast(toastContext, {
    title: "Added to waitlist.",
    message: "Your X has been added to the waitlist!",
    variant: "success",
  });

  if (window.Notification) {
    Notification.requestPermission();
  }
}

export function Xup() {
  const toastContext = React.useContext(ToastContext);
  const authContext = React.useContext(AuthContext);
  const queryParams = new URLSearchParams(useLocation().search);
  const [eft, setEft] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [reviewOpen, setReviewOpen] = React.useState(false);

  const waitlist_id = queryParams.get("wl");
  if (!waitlist_id) {
    return <em>Missing waitlist information</em>;
  }

  return (
    <div style={{ display: "flex" }}>
      {reviewOpen && (
        <Modal open={true} setOpen={(evt) => null}>
          <Box>
            <XupCheck waitlistId={waitlist_id} setOpen={setReviewOpen} />
          </Box>
        </Modal>
      )}
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
                xUp({ character: authContext.current.id, eft, toastContext, waitlist_id }).then(
                  (evt) => setReviewOpen(true)
                )
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
          src={howToX}
          alt="On the bottom left of the Fitting window you will find a copy button"
        />
      </div>
    </div>
  );
}

function XupCheck({ waitlistId, setOpen }) {
  const authContext = React.useContext(AuthContext);
  const [xupData] = useApi(`/api/waitlist?waitlist_id=${waitlistId}`);

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
        <Box key={fit.id}>
          <FitDisplay fit={fit} />
        </Box>
      ))}
      <Buttons>
        <NavButton variant="primary" to={`/waitlist?wl=${waitlistId}`}>
          Yes, looks good
        </NavButton>
        <Button variant="secondary" onClick={(evt) => setOpen(false)}>
          No, go back to update my fit
        </Button>
      </Buttons>
    </>
  );
}
