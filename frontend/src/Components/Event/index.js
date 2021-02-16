import React from "react";

import { EventContext } from "../../Event";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faBellSlash } from "@fortawesome/free-solid-svg-icons";
import { Modal } from "../Modal";

import soundFile from "./bell-ringing-04.mp3";
const storageKey = "EventNotifierSettings";

function handleMessage(event) {
  const message = JSON.parse(event.data);
  if (window.Notification && Notification.permission === "granted") {
    new Notification(message.message);
  } else if (window.Notification && Notification.permission === "default") {
    // RIP, we didn't ask for permission first!?
    Notification.requestPermission();
  }
}

export function EventNotifier() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const eventContext = React.useContext(EventContext);
  const playerRef = React.useRef(null);

  const [settings, setSettings] = React.useState(() => {
    if (window.localStorage && window.localStorage.getItem(storageKey)) {
      return JSON.parse(window.localStorage.getItem(storageKey));
    }
    return {};
  });
  React.useEffect(() => {
    // Persist to localStorage.
    if (window.localStorage) {
      window.localStorage.setItem(storageKey, JSON.stringify(settings));
    }
  }, [settings]);

  const handleWakeup = React.useCallback(
    (event) => {
      if (window.Notification && Notification.permission === "granted") {
        new Notification(event.data);
      } else if (window.Notification && Notification.permission === "default") {
        // RIP, we didn't ask for permission first!?
        Notification.requestPermission();
      }

      setTimeout(() => {
        // Delay the actual sound by 10ms, to not block the JS thread sending the other notification
        if (settings.enableSound && playerRef.current) {
          playerRef.current.play();
          alert(event.data);
          playerRef.current.pause();
        } else {
          alert(event.data);
        }
      }, 10);
    },
    [settings]
  );

  React.useEffect(() => {
    if (eventContext == null) {
      return;
    }

    eventContext.addEventListener("wakeup", handleWakeup);
    eventContext.addEventListener("message", handleMessage);
    return () => {
      eventContext.removeEventListener("wakeup", handleWakeup);
      eventContext.removeEventListener("message", handleMessage);
    };
  }, [handleWakeup, eventContext]);

  return (
    <>
      <Modal open={modalOpen} onClose={(evt) => setModalOpen(false)}>
        <div className="box">
          <div className="control">
            <label className="checkbox">
              <input
                checked={settings.enableSound}
                onChange={(evt) => setSettings({ ...settings, enableSound: !!evt.target.checked })}
                type="checkbox"
              />{" "}
              Enable sound notifications
            </label>
          </div>
          <div className="control">
            <button
              className="button"
              onClick={(evt) => handleWakeup({ data: "This is a test alert" })}
            >
              Send test notification
            </button>
          </div>
        </div>
      </Modal>
      <audio ref={playerRef} loop>
        <source src={soundFile} type="audio/mp3" />
      </audio>
      <button
        onClick={(evt) => setModalOpen(true)}
        className="button"
        title={
          settings.enableSound
            ? "Sound alerts are currently enabled"
            : "Sound alerts are currently disabled"
        }
      >
        <FontAwesomeIcon fixedWidth icon={settings.enableSound ? faBell : faBellSlash} />
      </button>
    </>
  );
}
