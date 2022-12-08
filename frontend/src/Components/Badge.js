import React from "react";
import PropTypes from "prop-types";
import styled, { ThemeContext } from "styled-components";

export const Badge = styled.span`
  background-color: ${(props) => (props.theme.colors[props.variant] || {}).color || "transparent"};
  color: ${(props) => (props.theme.colors[props.variant] || {}).text || props.theme.colors.text};
  filter: drop-shadow(0px 1px 1px ${(props) => props.theme.colors.shadow});
  padding: 0 0.74em 0 0.74em;
  border-radius: 4px;
  height: 2em;
  font-size: 0.75em;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
`;

export const BadgeDOM = styled.div`
  margin: 0em 0.5em 0.5em 0;
  border: solid 2px ${(props) => props.theme.colors.accent2};
  border-radius: 5px;
  background-color: ${(props) => props.theme.colors.background};
  font-size: 1em;
  filter: drop-shadow(0px 3px 4px ${(props) => props.theme.colors.shadow});
  width: 180px;
  height: 2.6em;
  a {
  }
  &:hover:not(:disabled):not(.static) {
    border-color: ${(props) => props.theme.colors.accent3};
    cursor: pointer;
  }
  @media (max-width: 480px) {
    width: 100%;
    height: 4em;
    margin: 0em 0.5em 1em 0;
  }
`;
BadgeDOM.Content = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
  color: ${(props) => props.theme.colors.text};
  img {
    border-radius: 3px 0px 0px 3px;
    margin-right: 0.5em;
    align-self: flex-start;
  }
}
`;
BadgeDOM.Icon = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-right: 0.2em;
  width: fit-content;
  padding: 0em 0.4em 0em;
  @media (max-width: 480px) {
    font-size: 1.3em;
  }
`;

export const BadgeModal = styled.div`
  width: 480px;
  @media (max-width: 580px) {
    width: 100%;
  }
`;
BadgeModal.Title = styled.div`
  border-bottom: 3px solid;
  padding-bottom: 5px;
  margin-bottom: 1em;
  display: flex;
  border-color: ${(props) => props.theme.colors.accent3};
`;

export const icons = {
  // Implant badges
  WARPSPEED: { type: "shield", color: "red", letter: "W", name: "Warp Speed Implants" },
  HYBRID: { type: "shield", color: "red", letter: "H", name: "Hybrid Implants" },
  AMULET: { type: "shield", color: "red", letter: "A", name: "Amulet Implants" },
  // FC Roles
  "HQ-FC": { type: "shield", color: "blue", letter: "H", name: "HQ FC" },
  TRAINEE: { type: "shield", color: "neutral", letter: "T", name: "Training FC" },
  TRAINER: { type: "shield", color: "purple", letter: "T", name: "FC Trainer" },
  COUNCIL: { type: "image", href: require("../Pages/Guide/badges/c.png"), name: "Council" },
  // Specalist Badges
  LOGI: { type: "shield", color: "green", letter: "L", name: "Logi Specialist" },
  "MUPPET-LOGI": {
    type: "image",
    href: require("../Pages/Guide/badges/ml.png"),
    name: "Banned from flying logi",
  },
  "RETIRED-LOGI": { type: "shield", color: "red", letter: "L", name: "Retired Logi Specialist" },
  BASTION: { type: "shield", color: "cyan", letter: "B", name: "Bastion Specialist" },
  WEB: { type: "shield", color: "cyan", letter: "W", name: "Web Specialist" },
  // Other
  ELITE: { type: "shield", color: "yellow", letter: "E", name: "Elite" },
  "ELITE-GOLD": {
    type: "image",
    href: require("../Pages/Guide/badges/egold.png"),
    name: "Elite GOLD",
  },
  STARTER: { type: "shield", color: "neutral", letter: "S", name: "Starter pilot" },
  UNKNOWN: { type: "shield", color: "neutral", letter: "?", name: null },
};

const BadgeIcon = ({ type = "UNKNOWN", height = "1.2em" }) => {
  const badge = icons[type] ?? icons["UNKNOWN"];
  return badge.type === "shield" ? (
    <Shield {...badge} h={height} title={badge.name} />
  ) : (
    <img src={badge.href} title={badge.name} alt={badge.name} style={{ height }} />
  );
};

BadgeIcon.propTypes = {
  type: PropTypes.oneOf(Object.keys(icons)),
};

export default BadgeIcon;

export function Shield({ color, letter, title, h = "1.2em" }) {
  const theme = React.useContext(ThemeContext);
  return (
    <span title={title}>
      <svg
        style={{ height: h, filter: `drop-shadow(0px 1px 1px ${theme.colors.shadow})` }}
        viewBox="0 0 26.5 27.8"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          <path
            style={{ fill: theme.colors.tdfShields[color] }}
            d="m 13.229167,0 c 0,0 6.085417,0.79375 13.229167,3.96875 0,0 -0.79375,10.054167 -3.961217,15.955009 -2.275956,4.239997 -6.622116,7.857491 -9.26795,7.857491 M 13.229167,0 C 13.229167,0 7.14375,0.79375 0,3.96875 c 0,0 0.79375,10.054167 3.9612174,15.955009 2.2759552,4.239997 6.6221156,7.857491 9.2679496,7.857491"
          />
          <text
            style={{
              fontSize: "1.3em",
              fontWeight: "700",
              textAnchor: "middle",
              fill: theme.colors.tdfShields.text,
              textRendering: "geometricPrecision",
            }}
            x="13.25"
            y="20.5"
          >
            {letter}
          </text>
        </g>
      </svg>
    </span>
  );
}
