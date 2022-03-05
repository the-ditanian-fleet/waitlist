import styled from "styled-components";

export const Box = styled.div`
  background-color: ${(props) => props.theme.colors.background};
  padding: 1.5em;
  border-radius: 5px;
  @media (max-width: 450px) {
    padding: 0em;
  }
`;
