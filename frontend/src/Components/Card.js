import styled from "styled-components";

export const CardMargin = styled.div`
  margin: 0.4em 0;
  @media (max-width: 450px) {
    width: 100%;
  }
`;
const CardContainer = styled.div`
  margin-bottom: 0.55em;
  margin-right: 1em;
  background-color: ${(props) => props.theme.colors.accent1};
  filter: drop-shadow(0px 1px 1px ${(props) => props.theme.colors.shadow});
  border-radius: 5px;
  border: solid 1px ${(props) => (props.theme.colors[props.variant] || {}).color || "transparent"};
  height: 100%;
  width: ${(props) => (props.size ? props.size : "330px")};
  &:hover {
    border: solid 1px ${(props) => props.theme.colors.accent2};
  }
  @media (max-width: 450px) {
    width: 100%;
  }
`;
const CardHeader = styled.h3`
  font-weight: 600;
  padding: 0.2em 0.5em;
`;
const CardBody = styled.div`
  padding: 0.5em 0.5em 0em;
`;

export const CardArray = styled.div`
  display: flex;
  align-items: stretch;
  flex-wrap: wrap;
`;

export function Card({ variant, title, size, children, ...props }) {
  return (
    <CardContainer size={size} variant={variant} {...props}>
      <CardHeader variant={variant}>{title}</CardHeader>
      <CardBody>{children}</CardBody>
    </CardContainer>
  );
}
