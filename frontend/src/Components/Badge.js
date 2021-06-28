import styled from "styled-components";

export const Badge = styled.span`
  background-color: ${(props) => (props.theme.colors[props.variant] || {}).color || "transparent"};
  color: ${(props) => (props.theme.colors[props.variant] || {}).text || props.theme.colors.text};
  filter: drop-shadow(0px 1px 1px ${(props) => props.theme.colors.shadow});
  padding: 0 0.75em 0 0.75em;
  border-radius: 4px;
  height: 2em;
  font-size: 0.75em;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
`;
