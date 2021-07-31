import React from "react";
import { BrowserRouter as Router, Switch } from "react-router-dom";
import { processAuth } from "../Pages/Auth";
import { ToastDisplay } from "../Components/Toast";
import { AuthContext, ToastContext, EventContext } from "../contexts";
import styled, { ThemeProvider, createGlobalStyle } from "styled-components";
import { Routes } from "./routes";

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
      eventErrors: 0,
      theme: (window.localStorage && window.localStorage.getItem("theme")) || "light",
    };
  }

  componentDidUpdate() {
    if (this.state.auth && !this.state.events) {
      var events = new EventSource("/api/sse/stream");
      events.addEventListener("open", (evt) => {
        this.setState({ eventErrors: 0 });
      });
      events.addEventListener("error", (err) => {
        events.close();
        setTimeout(() => {
          this.setState({ events: null, eventErrors: this.state.eventErrors + 1 });
        }, this.state.eventErrors * 5000 + Math.random() * 10000);
      });
      this.setState({ events });
    }
  }

  componentDidMount() {
    processAuth((whoami) => this.setState({ auth: whoami }));
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
                    <Switch>
                      <Routes />
                    </Switch>
                    <ToastDisplay
                      toasts={this.state.toasts}
                      setToasts={(toasts) => this.setState({ toasts })}
                    />
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
