import React, { useEffect } from "react";
import styled from "styled-components";
import { apiCall, errorToaster } from "../../../api";
import { Box } from "../../../Components/Box";
import { AllianceName, CharacterName, CorporationName } from "../../../Components/EntityLinks";
import { Button, Buttons, Input, Label, Select, Textarea } from "../../../Components/Form";
import { Modal } from "../../../Components/Modal";
import { Title } from "../../../Components/Page";
import { addToast } from "../../../Components/Toast";
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

const WideWraper = styled.form`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;

  & label::selection,
  div::selection,
  button::selection {
    background: none;
  }
`;

const Small = styled.div`
  font-style: italic;
`;

const EntityLink = (entity) => {
  switch (entity.category) {
    case "Character":
      return <CharacterName {...entity} noLink />;

    case "Corporation":
      return <CorporationName {...entity} noLink />;

    case "Alliance":
      return <AllianceName {...entity} noLink />;

    default:
      return entity.name;
  }
};

const IssueBanModal = ({ isOpen, setOpen, refreshFunction }) => {
  const toastContext = React.useContext(ToastContext);
  const [pending, isPending] = React.useState(false);

  // State hooks to manage ban expiry
  const [isPermanent, setPermanent] = React.useState(false);
  const [revoked_at, setRevokedAt] = React.useState(undefined);

  // State hooks to manage ESI search end banned entity data
  const [category, setCategory] = React.useState("Character");
  const [entity, setEntity] = React.useState({ id: null, name: "" });
  const [searchVal, setSearchVal] = React.useState("");
  const [searchPending, setSearchPending] = React.useState(false);

  const [reason, setReason] = React.useState(undefined);
  const [public_reason, setPublicReason] = React.useState(undefined);

  const onSubmit = (e) => {
    e.preventDefault();

    if (pending) {
      return; // stop users from clicking this twice
    }
    isPending(true);

    if (!entity.id) {
      addToast(toastContext, {
        variant: "danger",
        message: `You need to provide a ${category.toLowerCase()} name.`,
      });
    }

    errorToaster(
      toastContext,
      apiCall(`/api/v2/bans`, {
        method: "POST",
        json: {
          entity: { ...entity, category },
          reason,
          public_reason,
          revoked_at: isPermanent ? null : revoked_at,
        },
      })
        .then(() => {
          setOpen(false);
          refreshFunction();
          resetInputs();
        })
        .finally(() => isPending(false))
    );
  };

  const resetInputs = () => {
    // State hooks to manage ban expiry
    setPermanent(false);
    setRevokedAt(undefined);

    // State hooks to manage ESI search end banned entity data
    setCategory("Character");
    setEntity({ id: null, name: "" });
    setSearchVal("");
    setSearchPending(false);

    setReason(undefined);
    setPublicReason(undefined);
  };

  useEffect(() => {
    const reset = () => {
      return setEntity({ id: null, name: "" });
    };

    // Require >= 4 characters to query ESI
    if (searchVal.length < 3) return reset();

    setSearchPending(true);
    errorToaster(
      toastContext,
      apiCall(`/api/search`, {
        method: "POST",
        json: {
          search: searchVal,
          category: category.toLowerCase(),
          strict: true,
        },
      }).then((res) => {
        setSearchPending(false);
        if (res.length > 0) {
          setEntity({
            id: res[0],
            name: searchVal,
          });
        } else {
          reset();
        }
      })
    );
  }, [searchVal, category, toastContext]);

  return (
    <Modal open={isOpen} setOpen={setOpen}>
      <Box>
        <Title>Issue a Ban</Title>

        <WideWraper onSubmit={onSubmit}>
          <div>
            <FormGroup style={{ paddingBottom: "40px" }}>
              <Label htmlFor="select-type" required>
                Type:
              </Label>
              <Select
                id="select-type"
                value={category}
                onChange={(e) => {
                  setSearchVal("");
                  setCategory(e.target.value);
                }}
                style={{
                  width: "100%",
                  appearance: "auto",
                }}
              >
                <option disabled>Account</option>
                <option>Character</option>
                <option>Corporation</option>
                <option>Alliance</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="entity-name" required>
                {category} Name:
              </Label>
              <Input
                id="entity-name"
                type="text"
                value={searchVal}
                required
                tabIndex={2}
                onChange={(e) => setSearchVal(e.target.value)}
              />
              <div style={{ paddingTop: "10px" }}>
                {searchPending
                  ? "Searching..."
                  : entity?.id && <EntityLink {...{ category, ...entity }} />}
              </div>
            </FormGroup>
          </div>

          <div>
            <FormGroup>
              <Label htmlFor="expires_at" required>
                Expires:
              </Label>
              <Input
                id="expires_at"
                type="date"
                value={revoked_at ? new Date(revoked_at * 1000).toISOString().substring(0, 10) : ""}
                onChange={(e) => setRevokedAt(new Date(e.target.value).getTime() / 1000)}
                min={new Date(Date.now() + 3600 * 1000 * 24).toISOString().substring(0, 10)}
                required
                disabled={isPermanent}
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

              <Small>Bans expire at downtime</Small>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="reason" required>
                Reason:
              </Label>
              <Textarea
                id="reason"
                value={reason ?? ""}
                style={TEXTAREA_STYLES}
                required
                onChange={(e) => setReason(e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="public_reason">Public Reason:</Label>
              <Textarea
                id="public_reason"
                value={public_reason ?? ""}
                style={TEXTAREA_STYLES}
                onChange={(e) => setPublicReason(e.target.value)}
              />
              <Small>This reason will be shown to the pilot on the ban page.</Small>
            </FormGroup>

            <Buttons style={{ paddingLeft: "8px" }}>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" type="submit" disabled={pending}>
                Confirm
              </Button>
            </Buttons>
          </div>
        </WideWraper>
      </Box>
    </Modal>
  );
};

export { IssueBanModal };
