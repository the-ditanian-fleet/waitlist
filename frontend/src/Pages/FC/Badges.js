import React from 'react';
import { Route } from 'react-router-dom';
import { AuthContext, ToastContext } from '../../contexts';
import { Button, Input } from '../../Components/Form';
import CharacterName from '../../Components/CharacterName';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';
import styled, { ThemeContext } from 'styled-components';
import Table from '../../Components/DataTable';
import { apiCall, errorToaster, useApi } from '../../api';
import { formatDatetime } from '../../Util/time';

const BadgesPage = () => {
    const authContext = React.useContext(AuthContext);

    return authContext && authContext.access["badges-manage"] ? ( 
        <Route exact path="/fc/badges">
            <View />
        </Route>
    ) 
    : <></>;
}

export default BadgesPage;


///// TODO  - probably move some of the structural code to another file, leave this file mostly for logic
const special_sort = (charA, charB) => {
    const a = charA.name.toLowerCase();
    const b = charB.name.toLowerCase();
    if      (a > b) return 1;
    else if (b > a) return -1;
    else return 0;
};

const RevokeButton = ({ badgeId, characterId, refreshFunction }) => {
    const [ pending, isPending ] = React.useState(false);//,isPending
    const toastContext = React.useContext(ToastContext);

    const onClick = () => {
        if (pending) {
            return; // stop users from clicking this twice  
        } 
        isPending(true);
        
        errorToaster(toastContext, apiCall(`/api/badges/${badgeId}/members/${characterId}`, {
            method: 'DELETE'
        })
        .then(() => refreshFunction())
        .catch((err) => {
            isPending(false);
            throw err;
        }));
    }

    return (
        <Button variant='danger' disabled={pending} onClick={onClick}>
            <FontAwesomeIcon fixedWidth icon={!pending ? faMinus : faSpinner} spin={pending} style={{ marginRight: '10px'}} />
            Revoke
        </Button>
    )
}


///// END TODO




const Header = styled.div`
    padding-bottom: 10px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-content: space-between;
`;

const FilterComponents = ({ filterText, onClear, onFilter }) => {
    return (
        <>
            <Input value={filterText} onChange={onFilter} placeholder='Search for pilot...' />
            <Button variant={"primary"} onClick={onClear}>Clear</Button>       
        </>
    )
}

const View = ()  => {
    const [ data, refreshFunction ] = useApi('/api/badges/2/members');
    const [filterText, setFilterText] = React.useState('');
    const themeContext = React.useContext(ThemeContext);  
    
    const A = styled.a`
        , &:visited {
            color: ${themeContext?.colors?.text};
        }

        &:hover { 
            color: ${themeContext?.colors?.active};
            transition: ease-in-out 0.15s
        }
    `;

    const columns = [
        { name: 'Pilot Name', sortable: true, sortFunction: (rowA, rowB) => special_sort(rowA.character, rowB.character), grow: 2, selector: row => <CharacterName {...row.character } /> },
        { name: 'Badges', grow: 2, selector: row => row.badges },
        { name: 'Granted By', sortable: true, sortFunction: (rowA, rowB) => special_sort(rowA.granted_by, rowB.granted_by), hide: 'md', grow: 2, selector: row => <CharacterName {...row.granted_by } /> },
        { name: 'Granted At', hide: 'sm', grow: 2, selector: row => formatDatetime(new Date(row.granted_at)) },
        { name: '', grow: 1, minWidth: '95', selector: row => <RevokeButton badgeId={row.badge.id} characterId={row.character.id} refreshFunction={refreshFunction} /> }
    ];

    const TableHeader = React.useMemo(() => {
        const handleClear = () => {
            if (filterText) setFilterText('');
        }
    
        return <FilterComponents
            onFilter={e => setFilterText(e.target.value)} 
            onClear={handleClear}
            filterText={filterText}
        />
    }, [filterText])

    const filteredData = (data ?? []).filter(
        item => item && item.character &&
            item.character.name.toLowerCase().includes(filterText.toLowerCase())
    );

    return (
        <>
            <Header>
                <h1 style={{fontSize: '32px'}}>Specialist Badges</h1>
                <Button variant={"primary"} disabled>
                    <FontAwesomeIcon fixedWidth icon={faPlus} style={{ marginRight: '10px'}} />
                    Assign Badge
                </Button>
            </Header>
            
            <p style={{ marginBottom: '10px' }}>You can find the badge guide <A href="/badges">here</A>.</p>

            <Table columns={columns} data={filteredData}
                subHeader subHeaderComponent={TableHeader}
                pagination persistTableHead progressPending={!data}
                paginationPerPage={25} paginationRowsPerPageOptions={[10, 25, 50, 100]}
            />
        </>
    )
}