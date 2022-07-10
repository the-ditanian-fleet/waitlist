import styled from "styled-components";

export const Box = styled.div`
  background-color: ${(props) => props.theme.colors.background};
  padding: 1.5em;
  border-radius: 5px;
  @media (max-width: 480px) {
    padding: ${(props) => (props.mpadding ? props.mpadding : "0.6em")};
    width: 100%;
  }
`;
