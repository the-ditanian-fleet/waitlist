import React from "react";

import { EventContext } from "../../contexts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faBellSlash } from "@fortawesome/free-solid-svg-icons";
import { Modal } from "../Modal";
import { Button } from "../Form";
import { Box } from "../Box";
import iconFile from "./notification-icon.png";
import soundFile from "./bell-ringing-04.mp3";
const storageKey = "EventNotifierSettings";

function handleMessage(event) {
  const message = JSON.parse(event.data);
  if (window.Notification && Notification.permission === "granted") {
    new Notification(message.message, { silent: true });
  } else if (window.Notification && Notification.permission === "default") {
    // RIP, we didn't ask for permission first!?
    Notification.requestPermission();
  }
}

export function EventNotifier() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
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

  React.useEffect(() => {
    if (!playerRef) return;
    if (isPlaying) {
      playerRef.current.play();
    } else {
      playerRef.current.pause();
    }
  }, [isPlaying, playerRef]);
  const handleWakeup = React.useCallback(
    (event) => {
      if (window.Notification && Notification.permission === "granted") {
        new Notification("The Ditanian Fleet", {
          body: event.data,
          icon: iconFile,
          tag: event.data,
          renotify: true,
          timestamp: Math.floor(Date.now())
        });
      } else if (window.Notification && Notification.permission === "default") {
        // RIP, we didn't ask for permission first!?
        Notification.requestPermission();
      }

      if (settings.enableSound && playerRef.current) {
        setIsPlaying(event.data);
      }
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
      <Modal open={modalOpen} setOpen={setModalOpen}>
        <Box>
          <p>
            <label>
              <input
                checked={settings.enableSound}
                onChange={(evt) => setSettings({ ...settings, enableSound: !!evt.target.checked })}
                type="checkbox"
              />{" "}
              Enable sound notifications
            </label>
          </p>
          <Button onClick={(evt) => handleWakeup({ data: "This is a test alert" })}>
            Send test notification
          </Button>
        </Box>
      </Modal>
      <Modal open={isPlaying} setOpen={setIsPlaying}>
        <Box  style={{ minHeight: "50px", height: "auto" }}>
          <p style={{ marginBottom: "20px" }}>{isPlaying}</p>
          <Button onClick={(evt) => setIsPlaying(false)} variant="success">
            OK
          </Button>
          <audio ref={playerRef} loop>
            <source src={soundFile} type="audio/mp3" />
          </audio>
        </Box>
      </Modal>
      <Button
        onClick={(evt) => setModalOpen(true)}
        title={
          settings.enableSound
            ? "Sound alerts are currently enabled"
            : "Sound alerts are currently disabled"
        }
      >
        <FontAwesomeIcon fixedWidth icon={settings.enableSound ? faBell : faBellSlash} />
      </Button>
    </>
  );
}
