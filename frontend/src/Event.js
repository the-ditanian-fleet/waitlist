import React from "react";

export const EventContext = React.createContext(null);

export function EventNotifier() {
  const eventContext = React.useContext(EventContext);
  React.useEffect(() => {
    if (eventContext == null) {
      return;
    }

    const handleNotify = (event) => alert(event.data);
    eventContext.addEventListener("wakeup", handleNotify);
    return () => eventContext.removeEventListener("wakeup", handleNotify);
  }, [eventContext]);
  return <></>;
}
