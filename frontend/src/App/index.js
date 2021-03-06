import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Skills } from "../Pages/Skills";
import { Waitlist } from "../Pages/Waitlist";
import { Fleet, FleetRegister } from "../Pages/Fleet";
import { Xup } from "../Pages/Xup";
import { Pilot } from "../Pages/Pilot";
import { Search } from "../Pages/Search";
import { Authenticate, AuthContext } from "../Auth";
import { ToastContext, ToastDisplay } from "../Toast";
import { EventContext } from "../Event";
import styled, { ThemeProvider, createGlobalStyle } from "styled-components";

import { Menu } from "./Menu";
import "./reset.css";
import theme from "./theme.js";

const GlobalStyle = createGlobalStyle`
  html {
    overflow-y: scroll;
    text-rendering: optimizeLegibility;
    font-size: 16px;
    min-width: 300px;
  }
  body {
    min-height: 100vh;
    background-color: ${(props) => props.theme.colors.background};
    color: ${(props) => props.theme.colors.text};
    font-family: ${(props) => props.theme.font.family};
    line-height: 1.5;
    font-weight: 400;
  }
  em, i {
    font-style: italic;
  }
  strong, b {
    font-weight: bold;
  }
`;

const Container = styled.div`
  max-width: 1350px;
  margin: auto;
  @media only screen and (max-width: 1360px) {
    max-width: 1180px;
  }
  @media only screen and (max-width: 1190px) {
    max-width: 960px;
  }
  @media only screen and (max-width: 970px) {
    max-width: 750px;
  }
`;

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      auth: null,
      toasts: [],
      events: null,
      theme: (window.localStorage && window.localStorage.getItem("theme")) || "light",
    };
  }

  componentDidUpdate() {
    if (this.state.auth && !this.state.events) {
      var events = new EventSource("/api/sse/stream");
      events.addEventListener("error", (err) => {
        events.close();
        setTimeout(() => {
          this.setState({ events: null });
        }, 5000 + Math.random() * 10000);
      });
      this.setState({ events });
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
        <ThemeProvider theme={theme[this.state.theme]}>
          <GlobalStyle />
          <ToastContext.Provider value={this.addToast}>
            <EventContext.Provider value={this.state.events}>
              <AuthContext.Provider value={this.state.auth}>
                <Router>
                  <Container>
                    <Menu
                      onChangeCharacter={(char) => this.changeCharacter(char)}
                      theme={this.state.theme}
                      setTheme={(newTheme) => {
                        this.setState({ theme: newTheme });
                        if (window.localStorage) {
                          window.localStorage.setItem("theme", newTheme);
                        }
                      }}
                    />
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
                      <Route exact path="/xup">
                        <Xup />
                      </Route>
                      <Route exact path="/pilot">
                        <Pilot />
                      </Route>
                      <Route exact path="/search">
                        <Search />
                      </Route>
                      <Route exact path="/">
                        <Waitlist />
                      </Route>
                    </Switch>
                  </Container>
                </Router>
              </AuthContext.Provider>
            </EventContext.Provider>
          </ToastContext.Provider>
        </ThemeProvider>
      </React.StrictMode>
    );
  }
}
