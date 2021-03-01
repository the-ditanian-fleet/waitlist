import _ from "lodash";

const globals = {
  font: {
    family:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
  },
  logo: {},
};

const theme = {
  light: _.merge({}, globals, {
    colors: {
      background: "white",
      text: "#4a4a4a",
      active: "black",

      outline: "hsla(213, 100%, 40%, 0.2)",
      modal: "hsla(0, 0%, 0%, 0.80)",
      shadow: "hsla(0, 0%, 0%, 0.1)",

      input: {
        color: "transparent",
        text: "#4a4a4a",
        accent: "transparent",
        disabled: "#cccccc",
      },
      success: {
        color: "#48c774",
        text: "white",
        accent: "#3ec46d",
        disabled: "#92ddac",
      },
      warning: {
        color: "#ffdd57",
        text: "#4a4a4a",
        accent: "#ffda47",
        disabled: "#cccccc",
      },
      danger: {
        color: "#f14668",
        text: "white",
        accent: "#f03a5f",
        disabled: "#f8a5b6",
      },
      primary: {
        color: "#47afff",
        text: "white",
        accent: "#38a9ff",
        disabled: "#addcff",
      },
      secondary: {
        color: "#e6e6e6",
        text: "#4a4a4a",
        accent: "#dbdbdb",
        disabled: "#cccccc",
      },

      accent1: "#fafafa",
      accent2: "#dbdbdb",
      accent3: "#999999",
      accent4: "#666666",
    },
  }),
  dark: _.merge({}, globals, {
    logo: {
      filter: "invert(1)",
    },
    colors: {
      background: "#1f1f1f",
      text: "#cccccc",
      active: "#eeeeee",

      outline: "hsla(213, 100%, 40%, 0.2)",
      modal: "hsla(0, 0%, 0%, 0.80)",
      shadow: "hsla(0, 0%, 0%, 0.1)",

      input: {
        color: "transparent",
        text: "#cccccc",
        accent: "transparent",
        disabled: "#999999",
      },
      success: {
        color: "#1f6538",
        text: "white",
        accent: "#226d3c",
        disabled: "#133e22",
      },
      warning: {
        color: "#ad8b00",
        text: "white",
        accent: "#b89300",
        disabled: "#574500",
      },
      danger: {
        color: "#661425",
        text: "white",
        accent: "#6f1628",
        disabled: "#330a12",
      },
      primary: {
        color: "#005ca3",
        text: "white",
        disabled: "#cccccc",
        accent: "#002e52",
      },
      secondary: {
        color: "#404040",
        text: "white",
        accent: "#454545",
        disabled: "#202020",
      },

      accent1: "#2e2e2e",
      accent2: "#454545",
      accent3: "#757575",
      accent4: "#ababab",
    },
  }),
};

theme.ninjaholic = _.merge({}, theme.dark, {
  colors: {
    background: "#290052",
    accent1: "#380070",
    accent2: "#4f009e",
    accent3: "#8c1aff",
    accent4: "#bf80ff",
  },
});

export default theme;
