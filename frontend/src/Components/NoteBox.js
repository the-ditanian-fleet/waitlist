import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";

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

export const BorderedBox = styled.div`
  background-color: ${(props) => props.theme.colors.accent1};
  border-radius: 5px;
  border: solid 1px ${(props) => props.theme.colors.accent2};
  padding: 0.4em;
  margin: 0.4em 0;
`;

export function InfoNote({ message }) {
  return (
    <Note variant={"secondary"} width={"fit-content"} display={"block"}>
      <FontAwesomeIcon icon={faExclamationCircle} /> {message}
    </Note>
  );
}
