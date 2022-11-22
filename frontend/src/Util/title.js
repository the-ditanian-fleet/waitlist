import { useEffect } from "react";

export function usePageTitle(suffix) {
  useEffect(() => {
    let title = document.title;
    replaceTitle(suffix);
    return () => document.title = title;
  });
}

export function replaceTitle(suffix) {
  document.title = `TDF: ${suffix}`;
}

export function parseMarkdownTitle(data) {
  const heading = data.split("\n")[0];
  return heading.substring(heading.indexOf(" "));
}

export function titleCase(title) {
  return (
    title.split(" ")
      .map((word) => word[0].toUpperCase() + word.substr(1).toLowerCase())
      .join(" ")
  );
}
