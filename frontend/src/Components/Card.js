import styled from "styled-components";

const CardContainer = styled.div`
  margin-bottom: 1em;
  background-color: ${(props) => props.theme.colors.accent1};
  filter: drop-shadow(0px 1px 1px ${(props) => props.theme.colors.shadow});
  border-radius: 5px;
  border: solid 1px ${(props) => (props.theme.colors[props.variant] || {}).color || "transparent"};
`;
const CardHeader = styled.h3`
  font-weight: 600;
  padding: 0.2em 0.5em;
  border-radius: 5px 5px 0 0;
`;
const CardBody = styled.div`
  padding: 0.5em;
`;

export function Card({ variant, title, children, ...props }) {
  return (
    <CardContainer variant={variant} {...props}>
      <CardHeader variant={variant}>{title}</CardHeader>
      <CardBody>{children}</CardBody>
    </CardContainer>
  );
}
