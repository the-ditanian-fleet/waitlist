import styled from "styled-components";

export const Content = styled.div`
  color: ${(props) => props.theme.colors.text};

  p {
    margin-bottom: 1em;
    line-height: 1.5em;
  }

  i,
  em {
    font-style: italic;
  }

  b,
  strong {
    font-weight: bold;
  }

  h1 {
    font-size: 3em;
  }

  h2 {
    font-size: 1.5em;
  }

  h3 {
    font-size: 1.2em;
  }
`;
