import React from "react";
import { ToastContext, addToast, genericCatch } from "../../Toast";
import { AuthContext } from "../../Auth";
import { Modal } from "../../Components/Modal";

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

async function xUp({ character, eft, toastContext, setEft }) {
  const result = await fetch("/api/waitlist/xup", {
    method: "POST",
    body: JSON.stringify({ eft: eft, character_id: character, waitlist_id: 1 }),
    headers: { "Content-Type": "application/json" },
  });

  if (result.status === 200) {
    addToast(toastContext, {
      title: "Added to waitlist.",
      message: "Your X has been added to the waitlist!",
      type: "success",
    });
    setEft("");

    if (window.Notification) {
      Notification.requestPermission();
    }
  } else {
    addToast(toastContext, {
      title: "X-up failed!",
      message: "Server returned " + result.status + ": " + (await result.text()),
      type: "error",
    });
  }
}

export default function Xup({ onAction }) {
  const toastContext = React.useContext(ToastContext);
  const authContext = React.useContext(AuthContext);
  const [eft, setEft] = React.useState("");
  const [helpModalOpen, setHelpModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  return (
    <div className="panel">
      <Modal open={helpModalOpen} setOpen={setHelpModalOpen}>
        <img
          src="https://i.imgur.com/8Gh05lg.png"
          alt="On the bottom left of the Fitting window you will find a copy button"
        />
      </Modal>
      <p className="panel-heading">
        X-up with fit (<a onClick={(evt) => setHelpModalOpen(true)}>EFT format</a>)
      </p>
      <div className="panel-block">
        <div className="control">
          <textarea
            className="textarea"
            placeholder={exampleFit}
            rows={15}
            onChange={(evt) => setEft(evt.target.value)}
            value={eft}
          ></textarea>
        </div>
      </div>
      <div className="panel-block">
        <div className="field is-grouped">
          <p className="control">
            <button className="button is-static">{authContext.current.name}</button>
          </p>
          <div className="control">
            <button
              className={"button is-success " + (isSubmitting ? "is-loading" : "")}
              onClick={(evt) => {
                setIsSubmitting(true);
                xUp({ character: authContext.current.id, eft, toastContext, setEft })
                  .then(onAction)
                  .catch(genericCatch)
                  .finally((evt) => setIsSubmitting(false));
              }}
              disabled={eft.trim().length < 50 || !eft.startsWith("[")}
            >
              X-up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
