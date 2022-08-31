import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { NavLink } from "react-router-dom";
import { Table, TableHead, TableBody, Cell, CellHead, Row } from "./Table";
import styled from "styled-components";
import React, { useEffect } from "react";

const LinkStyle = styled.span`
  a {
  color: ${(props) => props.theme.colors.highlight.text} ;
  text-decoration: none; 
  font-weight: bold;
  &:hover:not(:disabled):not(.static) {
	cursor: pointer;
	color:  ${(props) => props.theme.colors.highlight.active};
  }  
`;

const HeadingAnchor = styled.div`
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    display: inline;

    &:hover {
      a {
        visibility: visible;
        opacity: 1;
      }
    }

    a {
      margin-left: 15px;
      font-size: smaller;
      text-decoration: none;

      visibility: hidden;
      opacity: 0;
      transition: visibility 0.05s, opacity 0.05s linear;

      &:after {
        content: "#";
      }

      &:hover {
        color: ${(props) => props.theme.colors.highlight.active};
      }
    }
  }
`;

function Link({ href, children, ...props }) {
  return (
    <LinkStyle>
      {href.startsWith("/") ? (
        <NavLink exact to={href}>
          {children}
        </NavLink>
      ) : (
        <a href={href} {...props}>
          {children}
        </a>
      )}
    </LinkStyle>
  );
}

export function Markdown({ ...args }) {
  const slugs = [];

  const Heading = ({ children, level }) => {
    const text = children[0];

    let slug =
      text
        .replace(/[^a-zA-Z0-9 ]/g, "")
        ?.replace(/ /g, "-")
        ?.toLowerCase() ?? "";
    if (slugs.includes(slug)) {
      console.warn(
        `An <h${level}> heading with the id "${slug}" already exists. Headings must be unique, omitting this ID`
      );
      slug = null;
    }

    return (
      <HeadingAnchor>
        {React.createElement(
          `h${level}`,
          { id: slug },
          <>
            {text}
            <a href={window.location.pathname + "#" + slug} />
          </>
        )}
      </HeadingAnchor>
    );
  };

  useEffect(() => {
    const { hash } = window.location;
    if (!hash) return; // no hash in URL

    document.getElementById(hash.replace("#", ""))?.scrollIntoView();
  }, []);

  const components = {
    h1: Heading,
    h2: Heading,
    h3: Heading,
    h4: Heading,
    h5: Heading,
    h6: Heading,
    a: Link,
    table: Table,
    thead: TableHead,
    tbody: TableBody,
    th: CellHead,
    td: Cell,
    tr: Row,
  };

  return <ReactMarkdown components={components} remarkPlugins={[remarkGfm]} {...args} />;
}
