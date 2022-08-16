import React, { useEffect } from 'react';
import { apiCall, errorToaster } from '../../../api';
import { ToastContext } from '../../../contexts';

import styled from 'styled-components';
import PilotSearch from '../../../Components/PilotSearch';
import { Box } from '../../../Components/Box';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Modal } from '../../../Components/Modal';
import { Title } from '../../../Components/Page';
import { Button, Label, Select } from '../../../Components/Form';

const FormGroup = styled.div`
    margin: 15px 0px;
`;

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

    useEffect(() => {
        if (!badgeId && badgeOptions && badgeOptions.length > 0) {
            setBadgeId(badgeOptions[0].id);
        }
            
    }, [badgeOptions, badgeId])

    return <Modal open={isOpen} setOpen={setOpen}>
        <Box>
            <Title>Assign a Specialist Badge</Title>
            <form onSubmit={onClick}>
                <FormGroup>
                    <Label htmlFor="pilot-search" required>Search for a pilot:</Label>
                    <PilotSearch required resetSearch={_reset}
                        style={{width: '100%'}}                         
                        onChange={(e) => setCharacterId(e.id)} 
                    />
                </FormGroup>

                <FormGroup>
                    <Label htmlFor="badge-select" required>Select badge type:</Label>
                    <Select id="badge-select"  value={badgeId} onChange={(e) => setBadgeId(e.target.value)} style={{width: '100%', appearance: 'auto'}} required>
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

export { AddBadge, RevokeButton };