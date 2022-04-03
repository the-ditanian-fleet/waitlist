import styled from "styled-components";

export const CardMargin = styled.div`
  margin: 0.4em 0;
  margin-right: 1em;
  @media (max-width: 480px) {
    width: 100%;
    margin-right: 0;
  }
  width: 330px;
`;
const CardContainer = styled.div`
  padding-bottom: 0.5em;

  background-color: ${(props) => props.theme.colors.accent1};
  filter: drop-shadow(0px 1px 1px ${(props) => props.theme.colors.shadow});
  border-radius: 5px;
  border: solid 1px ${(props) => (props.theme.colors[props.variant] || {}).color || "transparent"};
  height: 100%;
  &:hover {
    border: solid 1px ${(props) => props.theme.colors.accent2};
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
