import React from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";

const ToastDOM = styled.div`
  position: fixed;
  background-color: ${(props) => props.theme.colors[props.variant].color};
  color: ${(props) => props.theme.colors[props.variant].text};
  border-radius: 15px;
  padding: 20px;
  max-width: 400px;
  transition-property: bottom, right, opacity, padding;
  transition-timing-function: ease-in-out;
  transition-duration: 0.3s;
  box-sizing: content-box;
`;
ToastDOM.Container = styled.div`
  > ${ToastDOM} {
    display: none;
  }
  > ${ToastDOM}:nth-last-child(1) {
    display: block;
    padding: 20px;
    bottom: 50px;
    right: 50px;
    opacity: 1;
  }
  > ${ToastDOM}:nth-last-child(2) {
    display: block;
    padding: 15px;
    bottom: 90px;
    right: 55px;
    opacity: 0.8;
  }
  > ${ToastDOM}:nth-last-child(3) {
    display: block;
    padding: 10px;
    bottom: 130px;
    right: 60px;
    opacity: 0.6;
  }
`;
ToastDOM.Title = styled.strong`
  font-weight: bold;
`;

function Toast({ title, message, variant }) {
  return (
    <ToastDOM variant={variant}>
      {title ? (
        <>
          <ToastDOM.Title>{title}</ToastDOM.Title>{" "}
        </>
      ) : null}
      {message}
    </ToastDOM>
  );
}

export function ToastDisplay({ toasts, setToasts }) {
  React.useEffect(() => {
    var timer = setInterval(() => {
      const now = new Date();
      // Avoid unnecessarily redrawing
      if (toasts.filter((toast) => toast.expire <= now).length > 0) {
        setToasts(toasts.filter((toast) => toast.expire > now));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [toasts, setToasts]);

  return ReactDOM.createPortal(
    <ToastDOM.Container>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast}></Toast>
      ))}
    </ToastDOM.Container>,
    document.body
  );
}

export function addToast(context, { title = "", message, variant, time = 10000 }) {
  var id = Math.random().toString(36);
  var expire = new Date(new Date().getTime() + time);
  context({ id, title, message, variant, expire });
}

export function genericCatch(context) {
  return function (err) {
    console.error(err);
    addToast(context, {
      title: "JS error.",
      message: "An error occurred. It has been logged to the console.",
      variant: "danger",
    });
  };
}

export function toastHttp(context, success = "Success") {
  return async function (response) {
    if (response.status === 200) {
      if (success) {
        addToast(context, {
          message: success,
          variant: "success",
        });
      }
    } else {
      addToast(context, {
        title: "Error!",
        message: await response.text(),
        variant: "danger",
      });
    }
  };
}
