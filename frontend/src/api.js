import React from "react";
import { addToast } from "./Components/Toast";
import { ToastContext } from "./contexts";

export async function apiCall(path, { json, ...options }) {
  var requestOptions = {
    ...options,
  };

  if (!requestOptions.headers) {
    requestOptions.headers = {};
  }

  if (json) {
    if (!requestOptions.method) {
      requestOptions.method = "POST";
    }
    requestOptions.headers["Content-Type"] = "application/json";
    requestOptions.body = JSON.stringify(json);
  }

  const response = await fetch(path, requestOptions);

  var decoded;
  if ((response.headers.get("Content-Type") || "").match(/json/)) {
    decoded = await response.json();
  } else {
    decoded = await response.text();
  }

  if (response.status >= 400) {
    throw decoded;
  }
  return decoded;
}

export async function toaster(toastContext, promise) {
  try {
    const result = await promise;
    addToast(toastContext, {
      message: result,
      variant: "success",
    });
  } catch (e) {
    console.error(e);
    addToast(toastContext, {
      message: e.toString(),
      variant: "danger",
    });
  }
}

export async function errorToaster(toastContext, promise) {
  try {
    await promise;
  } catch (e) {
    console.error(e);
    addToast(toastContext, {
      title: "Error",
      message: e.toString(),
      variant: "danger",
    });
  }
}

export function useApi(path) {
  const toastContext = React.useContext(ToastContext);
  const [data, setData] = React.useState(null);

  const refreshFunction = React.useCallback(() => {
    if (!path) return;

    errorToaster(
      toastContext,
      apiCall(path, {}).then(setData, (err) => {
        setData(null);
        throw err;
      })
    );
  }, [toastContext, path]);

  React.useEffect(() => {
    setData(null);
    refreshFunction();
  }, [refreshFunction]);

  return [data, refreshFunction];
}
