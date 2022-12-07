import React, { useEffect } from "react";
import styled from "styled-components";
import { apiCall, errorToaster, toaster, useApi } from "../../../api";
import { Box } from "../../../Components/Box";
import { CharacterName } from "../../../Components/EntityLinks";
import { Button, CenteredButtons, Label, Select } from "../../../Components/Form";
import { Modal } from "../../../Components/Modal";
import { Title } from "../../../Components/Page";
import { AuthContext, ToastContext } from "../../../contexts";

const FormGroup = styled.div`
  margin: 15px 0px;
`;

async function assignRole(character_id, role) {
  return await apiCall(`/api/commanders`, {
    method: "POST",
    json: {
      character_id,
      role,
    },
  });
}

async function revokeRole(character_id) {
  return await apiCall(`/api/commanders/${character_id}`, {
    method: "DELETE",
  });
}

const CommanderModal = ({
  character,
  children = "ACL",
  currentRole,
  isRevokeable,
  handleRefresh,
}) => {
  const [isOpen, setOpen] = React.useState(false);
  const [_current, _setCurrent] = React.useState(undefined);
  const [index, setIndex] = React.useState(0);
  
  const authContext = React.useContext(AuthContext);

  useEffect(() => {
    if (currentRole) {
      return _setCurrent(currentRole);
    }

    apiCall(`/api/commanders/${character?.id}`, {}).then((currentRole) => {
      _setCurrent(currentRole);
    });
  }, [character?.id, currentRole, index]);

  let required_scope = authContext.access[`commanders-manage:${_current}`];
  
  const _refresh = () => {
    setIndex(index + 1);
    if (handleRefresh) {
      handleRefresh();
    }
  };

  return (
    <>
      <Button
        isOpen={isOpen}
        onClick={() => setOpen(true)}
        disabled={!(!_current || !!required_scope)}
      >
        {children}
      </Button>

      {!isOpen ? null : (
        <CmdrModal
          {...{
            character,
            currentRole: _current,
            isOpen,
            setOpen,
            isRevokeable,
            handleRefresh: _refresh,
          }}
        />
      )}
    </>
  );
};

export default CommanderModal;

const CmdrModal = ({ character, currentRole, isRevokeable, isOpen, handleRefresh, setOpen }) => {
  const [options] = useApi(`/api/commanders/roles`);
  const [pending, setPending] = React.useState(false);
  const [selectedOption, selectOption] = React.useState(undefined);
  const toastContext = React.useContext(ToastContext);

  const onSubmit = () => {
    if (pending) {
      return; // Stop users from clicking the button twice
    }
    setPending(true);

    errorToaster(toastContext, revokeRole(character?.id))
      .then(() => {
        toaster(toastContext, assignRole(character?.id, selectedOption)).then(() => {
          handleRefresh();
          selectOption(undefined);
        });
      })
      .finally(() => setPending(false));
  };

  const onRevoke = () => {
    if (pending) {
      return; // Stop users from clicking the button twice
    }
    setPending(true);

    toaster(toastContext, revokeRole(character?.id))
      .then(() => {
        handleRefresh();
        selectOption(undefined);
        setPending(false);
      })
      .finally(() => setOpen(false));
  };

  useEffect(() => {
    if (currentRole) {
      selectOption(currentRole);
    } else if (options?.length >= 0) {
      selectOption(options[0]);
    }
  }, [options, currentRole]);

  return (
    <Modal open={isOpen} setOpen={setOpen}>
      <Box>
        <Title style={{ marginBottom: "10px" }}>
          <CharacterName {...character} avatarSize={32} noLink />
        </Title>

        <FormGroup>
          <Label htmlFor={`role-select-${character?.id}`} required>
            Select Role:
          </Label>
          {!options ? (
            <small style={{ fontStyle: "italic", fontSize: "smaller" }}>Loading...</small>
          ) : (
            <Select
              id={`role-select-${character?.id}`}
              value={selectedOption ?? currentRole}
              onChange={(e) => selectOption(e.target.value)}
              style={{ width: "100%", appearance: "auto" }}
              required
            >
              {options.map((role, key) => (
                <option value={role} key={key}>
                  {role}
                </option>
              ))}
            </Select>
          )}
        </FormGroup>

        <CenteredButtons>
          <Button variant="success" onClick={onSubmit} disabled={!options || pending}>
            Confirm
          </Button>

          {!isRevokeable ? null : (
            <Button variant="danger" onClick={onRevoke} disabled={!options || pending}>
              Revoke FC
            </Button>
          )}
        </CenteredButtons>
      </Box>
    </Modal>
  );
};
