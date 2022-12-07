import A from "../Components/A";
import styled from "styled-components";
import { usePageTitle } from "../Util/title";

const ErrorPageWrapper = styled.div`
  padding: 10px 20px 10px 20px;
  font-weight: 600;

  h1 {
    font-size: 30px;
  }
`;

const ErrorPage = ({ children, title }) => {
  usePageTitle(title);
  return <ErrorPageWrapper>{children}</ErrorPageWrapper>;
};

const E401 = () => {
  return (
    <ErrorPage title="Login Required">
      <p>
        You must <A href="/auth/start">Login</A> to view this page.
      </p>
    </ErrorPage>
  );
};

const E403 = () => {
  return (
    <ErrorPage title="Forbidden">
      <h1>403 Error</h1>
      You are not allowed to view this page. Contact leadership to request access.
    </ErrorPage>
  );
};

const E404 = () => {
  return (
    <ErrorPage title="Page Not Found">
      <h1>404 Error</h1>I warped to the FC twice, and all I got was this &ldquo;404: page not
      found&rdquo; error.
    </ErrorPage>
  );
};

export { E401, E403, E404 };
