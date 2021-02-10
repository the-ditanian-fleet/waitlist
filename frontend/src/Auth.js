import React from "react";
import { useLocation, Switch, Route } from "react-router-dom";

export const AuthContext = React.createContext(null);

function AuthStart({ fc = false }) {
  const [message, setMessage] = React.useState("Redirecting to EVE login");

  React.useEffect(() => {
    fetch("/api/auth/login_url" + (fc ? "?fc=true" : ""))
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
  }, [fc]);

  return <p>{message}</p>;
}

export function AuthCallback() {
  const query = new URLSearchParams(useLocation().search);
  const code = query.get("code");

  const [message, setMessage] = React.useState("Processing login...");
  React.useEffect(() => {
    if (!code) return;

    fetch("/api/auth/cb", {
      method: "POST",
      body: code,
    }).then((response) => {
      if (response.status === 200) {
        // Force page refresh
        window.location.href = "/";
      } else {
        setMessage("An error occurred.");
      }
    });
  }, [code]);

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
          onAuth({
            id: response.id,
            name: response.name,
            is_admin: response.is_admin,
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
        <AuthStart fc={true} />
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
