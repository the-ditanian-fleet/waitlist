import styled, { css } from "styled-components";
import { NavLink } from "react-router-dom";

const inputStyle = css`
  position: relative;
  padding: 0 1em;
  font-size: 1em;
  border: solid ${(props) => (props.variant ? "0px" : "1px")};
  border-color: ${(props) => props.theme.colors.accent2};
  border-radius: 4px;
  background-color: ${(props) => props.theme.colors[props.variant || "input"].color};
  color: ${(props) => props.theme.colors[props.variant || "input"].text};
  display: inline-block;
  font: inherit;

  &.active {
    border-color: ${(props) => props.theme.colors.active};
  }
  &:hover:not(:disabled):not(.static) {
    color: ${(props) => props.theme.colors[props.variant || "input"].text};
    border-color: ${(props) => props.theme.colors.accent3};
    background-color: ${(props) => props.theme.colors[props.variant || "input"].accent};

    &.active {
      border-color: ${(props) => props.theme.colors.active};
    }
  }
  &:focus:not(:disabled):not(.static) {
    outline: none;
    box-shadow: 0 0 0 2px ${(props) => props.theme.colors.outline};
  }
  &:disabled {
    cursor: not-allowed;
  }
  &.static {
    cursor: default;
  }
  &:disabled,
  &.static {
    color: ${(props) => props.theme.colors[props.variant || "input"].disabled};
  }
`;

export const Button = styled.button.attrs((props) => ({
  className: `${props.active ? "active" : ""} ${props.static ? "static" : ""}`,
}))`
  ${inputStyle}
  height: 2.5em;
  cursor: pointer;
`;

export const AButton = styled.a.attrs((props) => ({
  className: `${props.active ? "active" : ""} ${props.static ? "static" : ""}`,
}))`
  ${inputStyle}
  height: 2.5em;
  text-decoration: none;
  line-height: 2.5em;
`;

export const NavButton = styled(NavLink).attrs((props) => ({
  className: `${props.active ? "active" : ""} ${props.static ? "static" : ""}`,
}))`
  ${inputStyle}
  height: 2.5em;
  text-decoration: none;
  line-height: 2.5em;
`;

export const Input = styled.input`
  ${inputStyle}
  height: 2.5em;
`;

export const Radio = styled.input.attrs({ type: "radio" })`
  ${inputStyle}
`;

export const Select = styled.select`
  ${inputStyle}
  height: 2.5em;
  appearance: none;

  > option {
    background-color: ${(props) => props.theme.colors.background};
    color: ${(props) => props.theme.colors.text};
  }
`;

export const Textarea = styled.textarea`
  ${inputStyle}
  padding: 1em;

  &:focus::placeholder {
    color: transparent;
  }
`;

export const InputGroup = styled.div`
  display: flex;
  flex-wrap: wrap;

  > * {
    z-index: 1;
    margin: 0;
  }
  > :not(:last-child) {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  > :not(:first-child) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    margin-left: -1px;
  }
  > .active:hover {
    z-index: 4;
  }
  > .active {
    z-index: 3;
  }
  > :hover {
    z-index: 2;
  }
`;

export const Buttons = styled.div`
  display: flex;
  flex-wrap: wrap;

  > * {
    margin-bottom: ${(props) => (props.marginb ? props.marginb : "0.5em")};
    margin-right: 0.5em;
  }
  } 
`;

export const CenteredButtons = styled.div`
  display: flex;
  justify-content: center;
  > * {
    width: ${(props) => (props.size ? props.size : "inherit")};
    margin: 0.2em;
  }
`;
