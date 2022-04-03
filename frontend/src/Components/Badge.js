import React from "react";
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

export const tagBadges = {
  WARPSPEED: ["red", "W", "Warp Speed Implants"],
  HYBRID: ["red", "H", "Hybrid Implants"],
  AMULET: ["red", "A", "Amulet Implants"],
  ELITE: ["yellow", "E", "Elite"],
  "STARTER-SKILLS": ["neutral", "S", "Starter skills"],
  "HQ-FC": ["blue", "H", "HQ FC"],
  LOGI: ["green", "L", "Logi Specialist"],
  BASTION: ["purple", "B", "Bastion Specialist"],
  WEB: ["cyan", "W", "Web Specialist"],
  TRAINEE: ["neutral", "T", "Training FC"],
};

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
