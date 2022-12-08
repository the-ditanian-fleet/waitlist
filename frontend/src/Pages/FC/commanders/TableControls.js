import { faUserPlus, faUserTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect } from "react";
import styled from "styled-components";
import { apiCall, errorToaster, useApi } from "../../../api";
import { Box } from "../../../Components/Box";
import { CharacterName } from "../../../Components/EntityLinks";
import { Button, CenteredButtons, Input, Label, Select } from "../../../Components/Form";
import { Modal } from "../../../Components/Modal";
import { Title } from "../../../Components/Page";
import PilotSearch from "../../../Components/PilotSearch";
import { addToast } from "../../../Components/Toast";
import { AuthContext, ToastContext } from "../../../contexts";

const FormGroup = styled.div`
  margin: 15px 0px;
`;

const P = styled.p`
  margin-bottom: 20px;
`;

const IconBtn = styled.span`
  [data-icon] {
    display: none;
  }
  @media (max-width: 450px) {
    [data-icon] {
      display: block !important;
    }
    span {
      display: none;
    }
  }
`;

const AddButton = ({ refreshData }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  const AddCommanderModal = ({ isOpen, setOpen, refreshData }) => {
    const [role, setRole] = React.useState(undefined);
    const [options] = useApi(`/api/commanders/roles`);
    const [character_id, setCharacterId] = React.useState(undefined);
    const [_reset, resetSearch] = React.useState(0);
    const toastContext = React.useContext(ToastContext);

    const onSubmit = (e) => {
      e.preventDefault();

      if (isNaN(character_id)) {
        return addToast(toastContext, {
          title: "Error:",
          message: "You need to search for a pilot... ",
          variant: "danger",
        });
      }

      errorToaster(
        toastContext,
        apiCall(`/api/commanders`, {
          method: "POST",
          json: {
            character_id,
            role,
          },
        }).then(() => {
          refreshData();
        })
      );

      setRole("");
      setCharacterId("");
      setOpen(false);
      resetSearch((prev) => prev + 1);
    };

    useEffect(() => {
      if (!role && options && options.length > 0) {
        setRole(options[0]);
      }
    }, [role, options]);

    return (
      <Modal open={isOpen} setOpen={setOpen}>
        <Box>
          <Title>Add an FC</Title>
          <form onSubmit={onSubmit}>
            <FormGroup>
              <Label htmlFor="pilot-search" required>
                Search for a pilot:
              </Label>
              <PilotSearch
                required
                resetSearch={_reset}
                style={{ width: "100%" }}
                onChange={(e) => setCharacterId(e.id)}
                hideNotFound
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="role-select" required>
                Select role:
              </Label>
              <Select
                id="role-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ width: "100%", appearance: "auto" }}
                required
              >
                {options?.map((role, key) => {
                  return (
                    <option value={role} key={key}>
                      {role}
                    </option>
                  );
                })}
              </Select>
            </FormGroup>

            <Button variant="success">Confirm</Button>
          </form>
        </Box>
      </Modal>
    );
  };

  return (
    <>
      <Button
        variant={"primary"}
        onClick={() => setModalOpen(true)}
        style={{ marginBottom: "10px" }}
      >
        <FontAwesomeIcon fixedWidth icon={faUserPlus} style={{ marginRight: "10px" }} />
        Add an FC
      </Button>

      <AddCommanderModal isOpen={modalOpen} setOpen={setModalOpen} refreshData={refreshData} />
    </>
  );
};

const FilterComponents = ({ filters, filterOptions, onChange, onClear }) => {
  const handleSelect = (evt) => {
    onChange({
      ...filters,
      role: evt.target.value === "-1" ? null : evt.target.value,
    });
  };

  const handleNameChange = (evt) => {
    onChange({
      ...filters,
      name: evt.target.value,
    });
  };

  return (
    <div id="filters">
      <span>Filter results by...</span>
      <Select
        value={filters?.role ?? ""}
        onChange={handleSelect}
        style={{
          marginRight: "10px",
          marginBottom: "10px",
          appearance: "auto",
        }}
      >
        <option value={-1}>any role...</option>
        {filterOptions?.map((opt, key) => (
          <option value={opt.name} key={key}>
            {opt.name} ({opt?.member_count?.toLocaleString()})
          </option>
        ))}
      </Select>

      <Input
        value={filters?.name ?? ""}
        onChange={handleNameChange}
        placeholder="pilot name"
        style={{ marginRight: "10px", marginBottom: "10px" }}
      />

      <Button variant={"primary"} onClick={onClear} style={{ marginBottom: "10px" }}>
        Clear
      </Button>
    </div>
  );
};

const RevokeButton = (props) => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const authContext = React.useContext(AuthContext);

  let required_scope = `commanders-manage:${props.role}`;
  let has_required_scope = authContext && authContext.access[required_scope];

  const RevokeConfirm = ({ character, role, isOpen, setOpen, refreshData }) => {
    const [pending, isPending] = React.useState(false);
    const toastContext = React.useContext(ToastContext);

    const onClick = () => {
      if (pending) {
        return; // stop users from clicking this twice
      }
      isPending(true);

      errorToaster(
        toastContext,
        apiCall(`/api/commanders/${character.id}`, {
          method: "DELETE",
        })
          .then(() => {
            isPending(false);
            setOpen(false);
            refreshData();
          })
          .catch((err) => {
            isPending(false);
            throw err;
          })
      );
    };

    return (
      <Modal open={isOpen} setOpen={setOpen}>
        <Box>
          <Title>Revoke {role}</Title>

          <P>
            From: <CharacterName {...character} noLink avatar={false} />
          </P>

          <CenteredButtons size={"90px"}>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onClick}>
              Confirm
            </Button>
          </CenteredButtons>
        </Box>
      </Modal>
    );
  };

  return (
    <>
      <Button variant="danger" onClick={() => setModalOpen(true)} disabled={!has_required_scope}>
        <IconBtn>
          <FontAwesomeIcon fixedWidth icon={faUserTimes} />
          <span>Revoke</span>
        </IconBtn>
      </Button>

      <RevokeConfirm isOpen={modalOpen} setOpen={setModalOpen} {...props} />
    </>
  );
};

export { AddButton, FilterComponents, RevokeButton };
