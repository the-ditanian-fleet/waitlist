import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { NavLink } from "react-router-dom";
import { Table, TableHead, TableBody, Cell, CellHead, Row } from "./Table";
import styled from "styled-components";

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

function Link({ href, children, ...props }) {
  return (
    <>
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
    </>
  );
}

const components = {
  a: Link,
  table: Table,
  thead: TableHead,
  tbody: TableBody,
  th: CellHead,
  td: Cell,
  tr: Row,
};

export function Markdown({ ...args }) {
  return <ReactMarkdown components={components} remarkPlugins={[remarkGfm]} {...args} />;
}
