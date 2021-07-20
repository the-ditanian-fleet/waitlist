import styled from "styled-components";

export const Content = styled.div`
  color: ${(props) => props.theme.colors.text};

  p,
  ul,
  ol {
    margin-bottom: 1em;
    line-height: 1.5em;
  }

  a {
    color: inherit;
  }

  i,
  em {
    font-style: italic;
  }

  b,
  strong {
    font-weight: bold;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 1em;
  }

  h1 + h2,
  h2 + h3,
  h3 + h4,
  h4 + h5,
  h5 + h6 {
    margin-top: 0;
  }

  h1 {
    margin-top: 0;
    font-size: 3em;
  }

  h2 {
    font-size: 2em;
  }

  h3 {
    font-size: 1.5em;
    font-weight: 600;
  }

  h4 {
    font-size: 1.2em;
    font-weight: 500;
  }

  ul {
    list-style-type: disc;
    padding-left: 2em;
  }

  ol {
    list-style-type: number;
    padding-left: 2em;
  }

  pre {
    font-family: ${(props) => props.theme.font.monospaceFamily};
    font-size: 0.8em;
    padding: 1em;
    margin-bottom: 1em;
    border-radius: 5px;
    background-color: ${(props) => props.theme.colors.accent1};
  }
`;

export const PageTitle = styled.h1`
  font-size: 3em;
  margin-bottom: 0.5em;
`;

export const Title = styled.h2`
  font-size: 1.5em;
`;
