import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useApi } from '../api';
import { useQuery } from '../Util/query';
import { Input } from './Form';

const SuggestionsList = styled.ul`
    border: 1px solid #999;
    border-top-width: 0;
    list-style: none;
    margin-top: 0;
    max-height: 143px;
    overflow-y: auto;
    padding-left: 0;
    width: calc(300px + 1rem);

    & > li {
        padding: 0.5rem;

        &.active, &:hover {
            background-color: ${props =>props.theme.colors?.accent1};
            color: ${props =>props.theme.active?.text};
            cursor: pointer;
            font-weight: 700;   
        }
    }
`;

const NoSuggestions = styled.div`
    color: ${props =>props.theme.colors?.secondary?.text};
    padding: 0.5rem;
    font-style: italic;
    width: calc(300px + 1rem);
`;

const PilotSearch = ({ id, onChange, style, resetSearch }) => {
    const [ activeSuggestion, setActiveSuggestion ] = React.useState(0);
    const [ showSuggestions, setShowSuggestions ]   = React.useState(false);
    const [ suggestions, setSuggestions ]           = React.useState([]);
    const [ userInput, setUserInput ] = React.useState('');

    const [{ query }, setQuery] = useQuery();
    const setSearchTerm = (newTerm) => {
        setQuery("query", newTerm ?? null, true);
        setUserInput(newTerm);
    }
    
    const [results] = useApi(
        query && query.length >=3 ? `/api/search?${new URLSearchParams({query})}` : null
    );

    useEffect(() => {
        setSuggestions(results?.results.filter(
            suggestion => 
                suggestion.name.toLowerCase().indexOf(userInput.toLowerCase()) > -1
        ));
        setShowSuggestions(true);
    }, [results, userInput]);

    useEffect(() => {
        setUserInput('');
        setSuggestions([]);
        setShowSuggestions(false);
        setActiveSuggestion(0);
    }, [resetSearch])

    const onClick = e => {
        setActiveSuggestion(0);
        setShowSuggestions(false);
        setUserInput(e.currentTarget.innerText)

        for(let i = 0; i < suggestions.length; i++) {
            const s = suggestions[i];
            if (s.name.toLowerCase() === e.currentTarget.innerText.toLowerCase()) {
                onChange(s);
                break;
            }
        }
    }
    
    const onKeyDown = e => {
        let suggestionIndex = activeSuggestion;

        // User pressed the enter key
        if (e.keyCode === 13) {
            e.preventDefault();
            onChange(suggestions[suggestionIndex]);
            setUserInput(suggestions[suggestionIndex].name)
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
        else if (e.keyCode=== 40) {
            e.preventDefault();
            if (activeSuggestion === results?.results.length-1) return;
            setActiveSuggestion(suggestionIndex + 1);
        }
    };

    let suggestionsUi;
    if (showSuggestions && userInput) {
        if (suggestions?.length) {
            suggestionsUi = (
                <SuggestionsList>
                    {
                        suggestions.map((s, key) => {
                            return (
                                <li key={key} className={key === activeSuggestion ? 'active' : null} onClick={onClick}>
                                    {s.name}
                                </li>
                            )
                        })
                    }
                </SuggestionsList>
            )
        }
        else
        {
            suggestionsUi = (
                <NoSuggestions>
                    Could not find <u>{userInput}</u> in the database, sorry.
                </NoSuggestions>
            );
        }
    }
    
    return (
        <>
            <Input
                id={id ?? "pilot-search"}
                type="text"
                value={userInput}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={onKeyDown}
                style={style}
            />

            {suggestionsUi}
        </>
    )
}

export default PilotSearch;