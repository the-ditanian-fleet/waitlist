import React from "react";
import { useLocation, Route } from "react-router-dom";

function AuthStart({ fc = false, alt = false }) {
  const [message, setMessage] = React.useState("Redirecting to EVE login");

  React.useEffect(() => {
    fetch("/api/auth/login_url?" + (fc ? "fc=true&" : "") + (alt ? "alt=true&" : ""))
      .then((response) => {
        if (response.status === 200) {
          return response.text();
        } else {
          return Promise.reject("Could not log in: API returned " + response.status);
        }
      })
      .then(
        (login_url) => {
          window.location.href = login_url;
        },
        (error) => {
          setMessage(error);
        }
      );
  }, [fc, alt]);

  return <p>{message}</p>;
}

export function AuthCallback() {
  const query = new URLSearchParams(useLocation().search);
  const code = query.get("code");
  const state = query.get("state");

  const [message, setMessage] = React.useState("Processing login...");
  React.useEffect(() => {
    if (!code) return;

    fetch("/api/auth/cb", {
      method: "POST",
      body: JSON.stringify({
        code,
        state,
      }),
      headers: { "Content-Type": "application/json" },
    }).then((response) => {
      if (response.status === 200) {
        // Force page refresh
        window.location.href = "/";
      } else {
        setMessage(<p>An error occurred.</p>);
        response.text().then((text) => {
          setMessage(
            <>
              <p>An error occurred.</p>
              <p>
                Details: <em>{text}</em>
              </p>
            </>
          );
        });
      }
    });
  }, [code, state]);

  if (!code) {
    setMessage("Invalid code");
  }

  return <div>{message}</div>;
}

export function AuthLogout() {
  React.useEffect(() => {
    fetch("/api/auth/logout").then((response) => {
      // Force page refresh
      window.location.href = "/";
    });
  }, []);

  return <p>Logging out...</p>;
}

export async function processAuth(callback) {
  const whoamiRaw = await fetch("/api/auth/whoami");
  if (whoamiRaw.status !== 200) {
    callback(null);
  }
  const whoami = await whoamiRaw.json();
  var access = {};
  whoami.access.forEach((level) => {
    access[level] = true;
  });
  callback({
    ...whoami,
    current: whoami.characters[0],
    access: access,
  });
}

export function AuthRoutes({ value }) {
  return (
    <>
      <Route exact path="/auth/start">
        <AuthStart />
      </Route>
      <Route exact path="/auth/start/fc">
        <AuthStart fc={true} alt={true} />
      </Route>
      <Route exact path="/auth/start/alt">
        <AuthStart alt={true} />
      </Route>
      <Route exact path="/auth/cb">
        <AuthCallback />
      </Route>
      <Route exact path="/auth/logout">
        <AuthLogout />
      </Route>
    </>
  );
}
