import React from "react";
import { useHistory, useLocation } from "react-router";

export function useQuery() {
  const location = useLocation();
  const history = useHistory();
  const query = location.search;

  const parsed = React.useMemo(() => {
    const queryParams = new URLSearchParams(query);
    var result = {};
    for (const [key, value] of queryParams) {
      result[key] = value;
    }
    return result;
  }, [query]);

  const setParam = React.useCallback(
    (key, value, replace) => {
      const queryParams = new URLSearchParams(query);
      if (value === null) {
        queryParams.delete(key);
      } else {
        queryParams.set(key, value);
      }
      if (replace) {
        history.replace({
          search: queryParams.toString(),
        });
      } else {
        history.push({
          search: queryParams.toString(),
        });
      }
    },
    [query, history]
  );

  return [parsed, setParam];
}
