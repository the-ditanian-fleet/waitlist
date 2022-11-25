import styled from "styled-components";

const SpinnerDOM = styled.div`
  span {
    display: none;
  }
  div {
    display: inline-block;
    height: 2rem;
    width: 2rem !important;
    vertical-align: text-bottom;
    margin: 15px auto 15px auto;

    background-color: ${(props) => props.theme.colors.accent3};
    border-radius: 50%;
    opacity: 0;
    animation: spinner-grow 0.75s linear infinite;
    -webkit-animation: spinner-grow 0.75s linear infinite;

    @keyframes spinner-grow {
      0% {
        transform: scale(0);
      }
      50% {
        opacity: 1;
        transform: none;
      }
    }
  }
`;

const Spinner = () => {
  return (
    <SpinnerDOM>
      <div />
      <span>Loading...</span>
    </SpinnerDOM>
  );
};

export default Spinner;
