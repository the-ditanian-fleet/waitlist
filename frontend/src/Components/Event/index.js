import React from "react";

import { EventContext } from "../../Event";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faBellSlash } from "@fortawesome/free-solid-svg-icons";

import soundFile from "./bell-ringing-04.mp3";

function handleMessage(event) {
  const message = JSON.parse(event.data);
  if (window.Notification && Notification.permission === "granted") {
    new Notification(message.message);
  } else {
    if (window.Notification && Notification.permission === "default") {
      // RIP, we didn't ask for permission first!?
      Notification.requestPermission();
    }
  }
}

export function EventNotifier() {
  const [enableSound, setEnableSound] = React.useState(false); //eslint-disable-line
  const eventContext = React.useContext(EventContext);
  const playerRef = React.useRef(null);

  const handleWakeup = React.useCallback(
    (event) => {
      if (window.Notification && Notification.permission === "granted") {
        new Notification(event.data);
      }

      if (enableSound && playerRef.current) {
        playerRef.current.play();
        alert(event.data);
        playerRef.current.pause();
      } else {
        alert(event.data);
      }
    },
    [enableSound]
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
      <audio ref={playerRef} loop>
        <source src={soundFile} type="audio/mp3" />
      </audio>
      <button
        onClick={(evt) => setEnableSound(!enableSound)}
        className="button"
        title={
          enableSound ? "Sound alerts are currently enabled" : "Sound alerts are currently disabled"
        }
      >
        <FontAwesomeIcon fixedWidth icon={enableSound ? faBell : faBellSlash} />
      </button>
    </>
  );
}
