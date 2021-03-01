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
    margin-bottom: 0.5em;
  }

  h2 {
    font-size: 1.5em;
    font-weight: bold;
  }

  h3 {
    font-size: 1.2em;
  }
`;

export const PageTitle = styled.h1`
  font-size: 3em;
  margin-bottom: 0.5em;
`;

export const Title = styled.h2`
  font-size: 1.5em;
`;
