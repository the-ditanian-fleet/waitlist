import React, { useEffect } from "react";
import styled from "styled-components";
import { apiCall, errorToaster } from "../../../api";
import { Box } from "../../../Components/Box";
import { AllianceName, CharacterName, CorporationName } from "../../../Components/EntityLinks";
import { Button, CenteredButtons, Input, Label, Textarea } from "../../../Components/Form";
import { Modal } from "../../../Components/Modal";
import { Title } from "../../../Components/Page";
import { ToastContext } from "../../../contexts";

const TEXTAREA_STYLES = {
  width: "100%",
  resize: "vertical",
  minWidth: "250px",
};

const FormGroup = styled.div`
  margin: 15px 0px;
  padding: 5px 10px;
  flex-grow: 2;
`;

const Small = styled.div`
  font-style: italic;
`;

const EntityLink = (ban) => {
  switch (ban.entity.category) {
    case "Character":
      return <CharacterName {...ban.entity} />;

    case "Corporation":
      return <CorporationName {...ban.entity} />;

    case "Alliance":
      return <AllianceName {...ban.entity} />;

    default:
      return ban.entity.name;
  }
};

const RevokeConfirm = ({ ban, isOpen, setOpen, refreshFunction }) => {
  const [pending, isPending] = React.useState(false);
  const toastContext = React.useContext(ToastContext);

  const onClick = () => {
    if (pending) {
      return; // stop users from clicking this twice
    }
    isPending(true);

    errorToaster(
      toastContext,
      apiCall(`/api/v2/bans/${ban.id}`, {
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
        <Title>Revoke {ban?.entity.category} Ban?</Title>

        <div style={{ maxWidth: "500px", display: "flex" }}>
          <FormGroup>
            <Label>{ban?.entity.category}:</Label>
            <EntityLink {...ban} />
          </FormGroup>

          <FormGroup>
            <Label>Issued By:</Label>
            <CharacterName {...ban.issued_by} />
          </FormGroup>
        </div>

        <FormGroup>
          <Label>Reason:</Label>
          <p style={{ maxWidth: "500px" }}>{ban.reason}</p>
        </FormGroup>

        <CenteredButtons size={"90px"}>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onClick} disabled={pending}>
            Confirm
          </Button>
        </CenteredButtons>
      </Box>
    </Modal>
  );
};

const Update = ({ ban, isOpen, setOpen, refreshFunction }) => {
  const [revoked_at, setRevokedAt] = React.useState(undefined);
  const [reason, setReason] = React.useState(undefined);
  const [public_reason, setPublicReason] = React.useState(undefined);
  const [isPermanent, setPermanent] = React.useState(false);
  const [pending, isPending] = React.useState(false);
  const toastContext = React.useContext(ToastContext);

  const onClick = (e) => {
    e.preventDefault();

    if (pending) {
      return; // stop users from clicking this twice
    }
    isPending(true);

    errorToaster(
      toastContext,
      apiCall(`/api/v2/bans/${ban.id}`, {
        method: "PATCH",
        json: {
          reason,
          public_reason,
          revoked_at: isPermanent ? null : revoked_at,
        },
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

  useEffect(() => {
    if (revoked_at !== ban?.revoked_at) {
      setRevokedAt(revoked_at);
      if (!revoked_at) {
        setPermanent(true);
      }
    }
    if (reason !== ban?.reason) {
      setReason(reason);
    }
    if (public_reason !== ban?.public_reason) {
      setPublicReason(public_reason);
    }
  }, [ban?.public_reason, ban?.reason, ban?.revoked_at, public_reason, reason, revoked_at]);

  return (
    <Modal open={isOpen} setOpen={setOpen}>
      <Box>
        <Title>Update {ban?.entity.category} Ban:</Title>

        <div style={{ maxWidth: "500px", display: "flex" }}>
          <FormGroup>
            <Label>{ban?.entity.category}:</Label>
            <EntityLink {...ban} />
          </FormGroup>

          <FormGroup>
            <Label>Issued By:</Label>
            <CharacterName {...ban.issued_by} />
          </FormGroup>
        </div>

        <form onSubmit={onClick}>
          <FormGroup>
            <Label required>Expires:</Label>
            <Input
              type="date"
              value={revoked_at ? new Date(revoked_at * 1000).toISOString().substring(0, 10) : ""}
              onChange={(e) => setRevokedAt(new Date(e.target.value).getTime() / 1000)}
              min={new Date(Date.now() + 3600 * 1000 * 24).toISOString().substring(0, 10)}
              disabled={isPermanent}
              required
            />
            <span style={{ marginLeft: "5px", marginRight: "5px" }}>or</span>

            <label style={{ marginRight: "20px", marginBottom: "15px", display: "inline-block" }}>
              <input
                type="checkbox"
                checked={isPermanent}
                onChange={() => setPermanent(!isPermanent)}
              />
              Permanent
            </label>
          </FormGroup>

          <FormGroup>
            <Label htmlFor={`reason-${ban.id}`} required>
              Reason:
            </Label>
            <Textarea
              id={`reason-${ban.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={TEXTAREA_STYLES}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor={`public_reason-${ban.id}`}>Public Reason:</Label>
            <Textarea
              id={`public_reason-${ban.id}`}
              value={public_reason ?? ""}
              onChange={(e) => setPublicReason(e.target.value)}
              style={TEXTAREA_STYLES}
            />
            <Small>This reason will be shown to the pilot on the ban page.</Small>
          </FormGroup>

          <CenteredButtons size={"90px"}>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" disabled={pending}>
              Confirm
            </Button>
          </CenteredButtons>
        </form>
      </Box>
    </Modal>
  );
};

export { RevokeConfirm, Update };