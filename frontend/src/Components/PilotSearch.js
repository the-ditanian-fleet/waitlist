import React, { useEffect } from "react";
import styled from "styled-components";
import { useApi } from "../api";
import { Input } from "./Form";

const SuggestionsList = styled.ul`
  position: absolute;
  width: 100%;
  background: ${(props) => props.theme.colors?.accent1};
  z-index: 500;

  border: 1px solid #999;
  border-top-width: 0;
  list-style: none;
  margin-top: 0;

  overflow-y: auto;
  padding-left: 0;

  & > li {
    padding: 0.5rem;

    &.active,
    &:hover {
      color: ${(props) => props.theme.active?.text};
      cursor: pointer;
      font-weight: 700;
    }
  }
`;

const NoSuggestions = styled.div`
  color: ${(props) => props.theme.colors?.secondary?.text};
  padding: 0.5rem;
  font-style: italic;
`;

const PilotSearch = ({ id, onChange, style, resetSearch, hideNotFound }) => {
  const [activeSuggestion, setActiveSuggestion] = React.useState(0);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState([]);
  const [userInput, setUserInput] = React.useState("");
  const [query, setQuery] = React.useState("");

  const setSearchTerm = (newTerm) => {
    setQuery(newTerm);
    setUserInput(newTerm);
  };

  const [results] = useApi(
    query && query.length >= 3 ? `/api/search?${new URLSearchParams({ query })}` : null
  );

  useEffect(() => {
    let exactMatch = false;
    setSuggestions(
      results?.results.filter((suggestion) => {
        // Exact match, emulate an onClick action so the input acts as expected
        if (suggestion.name.toLowerCase() === userInput.toLocaleLowerCase()) {
          onChange(suggestion);
          setUserInput(suggestion.name);
          setActiveSuggestion(0);
          exactMatch = true;
        }
        return suggestion.name.toLowerCase().indexOf(userInput.toLowerCase()) > -1;
      })
    );
    setShowSuggestions(!exactMatch);
  }, [results, userInput, onChange]);

  useEffect(() => {
    setUserInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestion(0);
  }, [resetSearch]);

  const onClick = (e) => {
    setActiveSuggestion(0);
    setShowSuggestions(false);
    setUserInput(e.currentTarget.innerText);

    for (let i = 0; i < suggestions.length; i++) {
      const s = suggestions[i];
      if (s.name.toLowerCase() === e.currentTarget.innerText.toLowerCase()) {
        onChange(s);
        break;
      }
    }
  };

  const onKeyDown = (e) => {
    let suggestionIndex = activeSuggestion;

    // User pressed the enter key
    if (e.keyCode === 13) {
      e.preventDefault();
      onChange(suggestions[suggestionIndex]);
      setUserInput(suggestions[suggestionIndex].name);
      setActiveSuggestion(0);
      setShowSuggestions(false);
    }
    // IF: User pressed the up key
    else if (e.keyCode === 38) {
      e.preventDefault();
      if (activeSuggestion === 0) return;
      setActiveSuggestion(suggestionIndex - 1);
    }
    // IF: User pressed the down key
    else if (e.keyCode === 40) {
      e.preventDefault();
      if (activeSuggestion === results?.results.length - 1) return;
      setActiveSuggestion(suggestionIndex + 1);
    }
  };

  let suggestionsUi;
  if (showSuggestions && userInput) {
    if (suggestions?.length) {
      suggestionsUi = (
        <SuggestionsList>
          {suggestions.map((s, key) => {
            return (
              <li
                key={key}
                className={key === activeSuggestion ? "active" : null}
                onClick={onClick}
              >
                {s.name}
              </li>
            );
          })}
        </SuggestionsList>
      );
    } else {
      suggestionsUi = !hideNotFound ? (
        <NoSuggestions>
          Could not find <u>{userInput}</u> in the database, sorry.
        </NoSuggestions>
      ) : null;
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <Input
        id={id ?? "pilot-search"}
        type="text"
        value={userInput}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={onKeyDown}
        style={style}
        autoComplete="off"
      />

      {suggestionsUi}
    </div>
  );
};

export default PilotSearch;
