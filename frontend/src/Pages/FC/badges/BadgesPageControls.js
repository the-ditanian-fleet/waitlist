import React, { useEffect } from "react";
import { apiCall, errorToaster } from "../../../api";
import { ToastContext } from "../../../contexts";

import styled from "styled-components";
import PilotSearch from "../../../Components/PilotSearch";
import { Box } from "../../../Components/Box";
import { Modal } from "../../../Components/Modal";
import { Title } from "../../../Components/Page";
import { Button, CenteredButtons, Label, Select } from "../../../Components/Form";
import { CharacterName } from "../../../Components/EntityLinks";
import { addToast } from "../../../Components/Toast";

const FormGroup = styled.div`
  margin: 15px 0px;
`;

const P = styled.p`
  margin-bottom: 20px;
`;

const AddBadge = ({ badgeOptions = [], isOpen, setOpen, refreshFunction }) => {
  const [badgeId, setBadgeId] = React.useState(undefined);
  const [characterId, setCharacterId] = React.useState(undefined);
  const toastContext = React.useContext(ToastContext);
  const [_reset, resetSearch] = React.useState(0);

  const onClick = (e) => {
    e.preventDefault();

    if (isNaN(characterId)) {
      return addToast(toastContext, {
        title: "Error:",
        message: "You need to search for a pilot... ",
        variant: "danger",
      });
    }

    errorToaster(
      toastContext,
      apiCall(`/api/badges/${badgeId}/members`, {
        method: "POST",
        json: { id: parseInt(characterId) },
      }).then(() => {
        refreshFunction();
      })
    );

    setBadgeId("");
    setCharacterId("");
    setOpen(false);
    resetSearch((prev) => prev + 1);
  };

  useEffect(() => {
    if (!badgeId && badgeOptions && badgeOptions.length > 0) {
      setBadgeId(badgeOptions[0].id);
    }
  }, [badgeOptions, badgeId]);

  return (
    <Modal open={isOpen} setOpen={setOpen}>
      <Box style={{ overflowY: "hidden" }}>
        <Title>Assign a Specialist Badge</Title>
        <form onSubmit={onClick}>
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
            <Label htmlFor="badge-select" required>
              Select badge type:
            </Label>
            <Select
              id="badge-select"
              value={badgeId}
              onChange={(e) => setBadgeId(e.target.value)}
              style={{ width: "100%", appearance: "auto" }}
              required
            >
              {badgeOptions?.map((badge, key) => {
                return (
                  <option value={badge.id} key={key}>
                    {badge.name}
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

const RevokeButton = (props) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <>
      <Button variant="danger" onClick={() => setModalOpen(true)}>
        Revoke
      </Button>

      <RevokeConfirm isOpen={modalOpen} setOpen={setModalOpen} {...props} />
    </>
  );
};

const RevokeConfirm = ({ badge, character, isOpen, setOpen, refreshFunction }) => {
  const [pending, isPending] = React.useState(false);
  const toastContext = React.useContext(ToastContext);

  const onClick = () => {
    if (pending) {
      return; // stop users from clicking this twice
    }
    isPending(true);

    errorToaster(
      toastContext,
      apiCall(`/api/badges/${badge.id}/members/${character.id}`, {
        method: "DELETE",
      })
        .then(() => {
          isPending(false);
          setOpen(false);
          refreshFunction();
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
        <Title>Revoke {badge.name}</Title>

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

export { AddBadge, RevokeButton };
