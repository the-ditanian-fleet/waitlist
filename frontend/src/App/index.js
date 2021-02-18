import React from "react";
import { BrowserRouter as Router, Switch, Route, NavLink } from "react-router-dom";
import { Skills } from "../Pages/Skills";
import { Waitlist } from "../Pages/Waitlist";
import { Fleet, FleetRegister } from "../Pages/Fleet";
import { Authenticate, AuthContext } from "../Auth";
import { ToastContext, ToastDisplay } from "../Toast";
import { EventContext } from "../Event";
import { EventNotifier } from "../Components/Event";

import "./index.scss";

function Menu({ onChangeCharacter }) {
  const [menuActive, setMenuActive] = React.useState(false);

  return (
    <AuthContext.Consumer>
      {(whoami) => (
        <nav className="navbar">
          <div className="navbar-brand">
            <NavLink className="navbar-item" exact activeClassName="is-active" to="/">
              <img src="https://i.imgur.com/b1UBgma.png" alt="The Ditanian Fleet" />
            </NavLink>

            <a className="navbar-burger" onClick={(evt) => setMenuActive(!menuActive)}>
              <span></span>
              <span></span>
              <span></span>
            </a>
          </div>
          <div className={"navbar-menu " + (menuActive ? "is-active" : "")}>
            <div className="navbar-start">
              <NavLink className="navbar-item" exact activeClassName="is-active" to="/">
                Waitlist
              </NavLink>
              <NavLink className="navbar-item" exact activeClassName="is-active" to="/skills">
                Skills
              </NavLink>
              {whoami.is_admin ? (
                <>
                  <NavLink className="navbar-item" exact activeClassName="is-active" to="/fleet">
                    Fleet
                  </NavLink>
                </>
              ) : null}
            </div>
            <div className="navbar-end">
              <div className="navbar-item">
                <EventNotifier />
              </div>
              <div className="navbar-item">
                <div className="field has-addons">
                  <p className="control">
                    <span
                      className="select"
                      value={whoami.id}
                      onChange={(evt) =>
                        onChangeCharacter && onChangeCharacter(parseInt(evt.target.value))
                      }
                    >
                      <select>
                        {whoami.characters.map((character) => (
                          <option key={character.id} value={character.id}>
                            {character.name}
                          </option>
                        ))}
                      </select>
                    </span>
                  </p>
                  <p className="control">
                    <NavLink className="button" to="/auth/start/alt">
                      +
                    </NavLink>
                  </p>
                </div>
              </div>
              <div className="navbar-item">
                <NavLink to="/auth/logout" className="button is-light">
                  Log out
                </NavLink>
              </div>
            </div>
          </div>
        </nav>
      )}
    </AuthContext.Consumer>
  );
}

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      auth: null,
      toasts: [],
      events: null,
    };
  }

  componentDidUpdate() {
    if (this.state.auth && !this.state.events) {
      this.setState({ events: new EventSource("/api/sse/stream") });
    }
  }

  addToast = (toast) => {
    this.setState({ toasts: [...this.state.toasts, toast] });
  };

  changeCharacter = (newChar) => {
    var newState = { ...this.state.auth };
    var theChar = this.state.auth.characters.filter((char) => char.id === newChar)[0];
    newState.current = theChar;
    this.setState({ auth: newState });
  };

  render() {
    if (!this.state.auth) {
      return (
        <Router>
          <Authenticate value={this.state.auth} onAuth={(auth) => this.setState({ auth })} />
        </Router>
      );
    }

    return (
      <React.StrictMode>
        <ToastContext.Provider value={this.addToast}>
          <EventContext.Provider value={this.state.events}>
            <AuthContext.Provider value={this.state.auth}>
              <Router>
                <div className="container">
                  <Menu onChangeCharacter={(char) => this.changeCharacter(char)} />
                  <ToastDisplay
                    toasts={this.state.toasts}
                    setToasts={(toasts) => this.setState({ toasts })}
                  />
                  <Switch>
                    <Route path="/auth">
                      <Authenticate
                        value={this.state.auth}
                        onAuth={(auth) => this.setState({ auth })}
                      />
                    </Route>
                    <Route exact path="/skills">
                      <Skills />
                    </Route>
                    <Route exact path="/fleet">
                      <Fleet />
                    </Route>
                    <Route exact path="/fleet/register">
                      <FleetRegister />
                    </Route>
                    <Route exact path="/">
                      <Waitlist />
                    </Route>
                  </Switch>
                </div>
              </Router>
            </AuthContext.Provider>
          </EventContext.Provider>
        </ToastContext.Provider>
      </React.StrictMode>
    );
  }
}
