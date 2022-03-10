import styled from "styled-components";

export const Note = styled.div`
  margin: 0 0 0.5em;
  display: ${(props) => (props.display ? props.display : "flex")};
  background-color: ${(props) => props.theme.colors[props.variant].color};
  color: ${(props) => (props.theme.colors[props.variant] || {}).text || props.theme.colors.text};
  border-radius: 5px;
  width: ${(props) => (props.width ? props.width : "100%")};
  max-width: 500px;
  filter: drop-shadow(0px 4px 5px ${(props) => props.theme.colors.shadow});
  padding: 0.1em 0.5em 0.2em;
  vertical-align: middle;
`;
