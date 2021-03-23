import React from "react";
import { useLocation, Switch, Route } from "react-router-dom";

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
        setMessage("An error occurred.");
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

function AuthPage({ value, onAuth }) {
  const [needsLogin, setNeedsLogin] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/auth/whoami").then((response) => {
      if (response.status === 200) {
        return response.json().then((response) => {
          var access = {};
          response.access.forEach((level) => {
            access[level] = true;
          });
          onAuth({
            ...response,
            current: response.characters[0],
            access: access,
          });
        });
      } else if (response.status === 401) {
        setNeedsLogin(true);
      }
    });
  }, [value, onAuth]);

  if (needsLogin) {
    return <AuthStart />;
  }

  return <em>Checking authentication...</em>;
}

export function Authenticate({ value, onAuth }) {
  return (
    <Switch>
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
      <Route path="/">
        <AuthPage value={value} onAuth={onAuth} />
      </Route>
    </Switch>
  );
}
