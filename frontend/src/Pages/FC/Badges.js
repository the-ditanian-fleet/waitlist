import React, { useEffect } from 'react';
import { Route } from 'react-router-dom';
import { AuthContext, ToastContext } from '../../contexts';
import { Button, Input, Label, Select } from '../../Components/Form';
import CharacterName from '../../Components/CharacterName';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faPlus, faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';
import Table from '../../Components/DataTable';
import { apiCall, errorToaster, useApi } from '../../api';
import { formatDatetime } from '../../Util/time';
import { Shield, tagBadges } from '../../Components/Badge';
import { Modal } from '../../Components/Modal';
import { Title } from '../../Components/Page';
import { Box } from '../../Components/Box';
import PilotSearch from '../../Components/PilotSearch';

/**
 * 5. Setup a badge filter
 * 6. Code cleanup
 */

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

const Header = styled.div`
    padding-bottom: 10px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-content: space-between;
`;

const FormGroup = styled.div`
    margin: 15px 0px;
`;

const A = styled.a`
, &:visited {
    color: ${props =>props.theme.colors?.text};
}

&:hover { 
    color: ${props =>props.theme.colors?.active};
    transition: ease-in-out 0.15s
}
`;

///// TODO  - probably move some of the structural code to another file, leave this file mostly for logic
const special_sort = (charA, charB) => {
    const a = charA.name.toLowerCase();
    const b = charB.name.toLowerCase();
    if      (a > b) return 1;
    else if (b > a) return -1;
    else return 0;
};

// Revokes a badge assignment
const RevokeButton = ({ badgeId, characterId, refreshFunction }) => {
    const [ pending, isPending ] = React.useState(false);
    const toastContext = React.useContext(ToastContext);

    const onClick = () => {
        if (pending) {
            return; // stop users from clicking this twice  
        } 
        isPending(true);
        
        errorToaster(toastContext, apiCall(`/api/badges/${badgeId}/members/${characterId}`, {
            method: 'DELETE'
        })
        .then(() => {
            isPending(false);
            refreshFunction()
        })
        .catch((err) => {
            isPending(false);
            throw err;
        }));
    }

    return (
        <Button variant='danger' disabled={pending} onClick={onClick}>
            <FontAwesomeIcon fixedWidth icon={!pending ? faTimes : faSpinner} spin={pending} style={{ marginRight: '10px'}} />
            Revoke
        </Button>
    )
}

const AddBadge = ({ badgeOptions = [], isOpen, setOpen, refreshFunction }) => {
    const [ badgeId, setBadgeId ] = React.useState(undefined);
    const [ characterId, setCharacterId ] = React.useState('');
    const toastContext = React.useContext(ToastContext);
    const [_reset, resetSearch] = React.useState(0);

    const onClick = (e) => {
        e.preventDefault();
        
        errorToaster(toastContext, apiCall(`/api/badges/${badgeId}/members`, {
            method: 'POST', 
            json: { id: parseInt(characterId) }
        })
        .then(() => {
            refreshFunction();
        }));

        setBadgeId('');
        setCharacterId('');
        setOpen(false);
        resetSearch(prev => prev+1);
    }

    useEffect((badgeOptions) => {
        if (badgeId === null && badgeOptions && badgeOptions.length > 0) 
            setBadgeId(badgeOptions[0].id);
    }, [badgeOptions])

    return <Modal open={isOpen} setOpen={setOpen}>
        <Box>
            <Title>Assign a Specialist Badge</Title>
            <form onSubmit={onClick}>
                <FormGroup>
                    <Label required>Search for a pilot:</Label>
                    <PilotSearch required resetSearch={_reset}
                        style={{width: '100%'}}                         
                        onChange={(e) => setCharacterId(e.id)} 
                    />
                </FormGroup>

                <FormGroup>
                    <Label required>Select badge type:</Label>
                    <Select value={badgeId} defaultValue={"select..."} onChange={(e) => setBadgeId(e.target.value)} style={{width: '100%'}} required>
                        {
                            badgeOptions?.map((badge, key) => {
                                return <option value={badge.id} key={key}>
                                    {badge.name}
                                </option>
                            })
                        }
                    </Select>
                </FormGroup>

                <Button>
                    <FontAwesomeIcon icon={faCheck} /> Save
                </Button>
            </form>
        </Box>
    </Modal>
}
///// END TODO


const FilterComponents = ({ filterText, onClear, onFilter }) => {
    return (
        <>
            <span style={{ fontStyle: 'italic', marginRight: '10px'}}>Filter results by...</span>
            <Select style={{ marginRight: '10px', marginBottom: '10px'}} disabled> 
                {/* options here */}
            </Select>
            <Input value={filterText} onChange={onFilter} placeholder='pilot name' style={{ marginRight: '10px', marginBottom: '10px'}} />
            <Button variant={"primary"} onClick={onClear} style={{ marginBottom: '10px'}}>Clear</Button>       
        </>
    )
}

const View = ()  => {
    const [ badges, updateData ] = useApi('/api/badges');
    const [ characters, setChracters ] = React.useState(null);
    const [ modalOpen, setModalOpen ] = React.useState(false);
    const [filterText, setFilterText] = React.useState('');
    
    useEffect(() => {
        if (!badges) {
            return; // We can't do API calls if this value is null
        }

        var promises = [];
        badges.forEach((badge) => {
            promises.push(new Promise((resolve, reject) => {
                apiCall(`/api/badges/${badge.id}/members`, {})
                .then((res) => {
                    resolve(res);
                })
                .catch((e) => reject(e));
            }));
        });
        
        Promise.all(promises).then((e) => {
            let c = [];
            for(let i = 0; i < e.length; i++) {
                if (e[i].length !== 0) {
                    c = [...c, ...e[i]];
                }
            }
            setChracters(c);
        });
    }, [badges])

    const columns = [
        { name: 'Pilot Name', sortable: true, sortFunction: (rowA, rowB) => special_sort(rowA.character, rowB.character), grow: 2, selector: row => <CharacterName {...row.character } /> },
        { name: 'Badge', sortable: true, sortFunction: (rowA, rowB) => special_sort(rowA.badge, rowB.badge), grow: 1,  selector: row => {
            const badge = tagBadges[row.badge.name];
            return <Shield style={{verticalAlign:'middle'}}  h={'1.8em'} color={badge[0]} letter={badge[1]} title={badge[2]} />
        }},
        { name: 'Granted By', sortable: true, sortFunction: (rowA, rowB) => special_sort(rowA.granted_by, rowB.granted_by), hide: 'md', grow: 2, selector: row => <CharacterName {...row.granted_by } /> },
        { name: 'Granted At', hide: 'sm', grow: 2, selector: row => formatDatetime(new Date(row.granted_at * 1000)) },
        { name: '', grow: 1, minWidth: '95', selector: row => <RevokeButton badgeId={row.badge.id} characterId={row.character.id} refreshFunction={updateData} /> }
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
    }, [filterText, badges])

    const filteredData = (characters ?? []).filter(
        item => item && item.character &&
            item.character.name.toLowerCase().includes(filterText.toLowerCase())
    );
    
    return (
        <>
            <Header>
                <h1 style={{fontSize: '32px'}}>Specialist Badges</h1>
                <Button variant={"primary"} onClick={() => setModalOpen(true)}>
                    <FontAwesomeIcon fixedWidth icon={faPlus} style={{ marginRight: '10px'}} />
                    Assign Badge
                </Button>
            </Header>
            
            <p style={{ marginBottom: '10px' }}>You can find the badge guide <A href="/badges">here</A>.</p>

            <Table columns={columns} data={filteredData}
                defaultSortFieldId={1}
                subHeader
                subHeaderComponent={TableHeader}
                pagination
                persistTableHead
                progressPending={!characters}
                paginationPerPage={25}
                paginationRowsPerPageOptions={[10, 25, 50, 100]}
            />

            <AddBadge badgeOptions={badges}
                isOpen={modalOpen}
                setOpen={setModalOpen}
                refreshFunction={updateData} 
            />
        </>
    )
}