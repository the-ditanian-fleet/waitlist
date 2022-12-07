import styled from "styled-components";

export default styled.a`
  color: ${(props) => props.theme.colors.highlight.text};
  text-decoration: none;
  &:hover {
    cursor: pointer;
    color: ${(props) => props.theme.colors.highlight.active};
    transition: ease-in-out 0.15s;
  }

  & + svg {
    margin-left: 5px;
    font-size: small;
  }
`;
