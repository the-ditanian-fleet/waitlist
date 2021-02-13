import React from "react";

import { EventContext } from "../../Event";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faBellSlash } from "@fortawesome/free-solid-svg-icons";

import soundFile from "./bell-ringing-04.mp3";

export function EventNotifier() {
  const [enableSound, setEnableSound] = React.useState(false); //eslint-disable-line
  const eventContext = React.useContext(EventContext);
  const playerRef = React.useRef(null);
  const handleNotify = React.useCallback(
    (event) => {
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

    eventContext.addEventListener("wakeup", handleNotify);
    return () => eventContext.removeEventListener("wakeup", handleNotify);
  }, [handleNotify, eventContext]);

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
