import React from "react";

export const ToastContext = React.createContext(() => {});

function Toast({ id, title, message, type, onDismiss }) {
  return (
    <div
      className={
        "notification is-" +
        (type === "error" ? "danger" : type === "warning" ? "warning" : "success")
      }
    >
      <button className="delete" onClick={onDismiss}></button>
      {title ? (
        <>
          <strong>{title}</strong>{" "}
        </>
      ) : null}
      {message}
    </div>
  );
}

export function ToastDisplay({ toasts, setToasts }) {
  const dismiss = React.useCallback(
    (id) => {
      setToasts(toasts.filter((toast) => toast.id !== id));
    },
    [toasts, setToasts]
  );

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

  return (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={(evt) => dismiss(toast.id)}></Toast>
      ))}
    </>
  );
}

export function addToast(context, { title = "", message, type, time = 10000 }) {
  var id = Math.random().toString(36);
  var expire = new Date(new Date().getTime() + time);
  context({ id, title, message, type, expire });
}

export function genericCatch(context) {
  return function (err) {
    console.error(err);
    addToast(context, {
      title: "JS error.",
      message: "An error occurred. It has been logged to the console.",
      type: "error",
    });
  };
}

export function toastHttp(context, success = "Success") {
  return async function (response) {
    if (response.status === 200) {
      if (success) {
        addToast(context, {
          message: success,
          type: "success",
        });
      }
    } else {
      addToast(context, {
        title: "Error!",
        message: await response.text(),
        type: "error",
      });
    }
  };
}
