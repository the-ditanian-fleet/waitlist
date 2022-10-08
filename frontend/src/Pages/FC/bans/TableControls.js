import { faGavel } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Button, Input, Select } from "../../../Components/Form";
import { IssueBanModal } from "./Issue";
import { RevokeConfirm, Update } from "./Modals";

const SELECTSTYLE = {
  marginRight: "10px",
  marginBottom: "10px",
  appearance: "auto",
};

const FilterComponents = ({ filters, onChange, onClear }) => {
  const OPTIONS = {
    type: [{ text: "any duration", value: -1 }, { text: "permanent" }, { text: "temporary" }],
    entity_type: [
      { text: "any type", value: -1 },
      { text: "account" },
      { text: "alliance" },
      { text: "character" },
      { text: "corporation" },
    ],
  };

  const handleSelect = (evt, f) => {
    onChange({
      ...filters,
      [f]: evt.target.value === "-1" ? null : evt.target.value,
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
        value={filters?.entity_type ?? ""}
        onChange={(e) => handleSelect(e, "entity_type")}
        style={SELECTSTYLE}
      >
        {OPTIONS.entity_type.map((o, key) => {
          return (
            <option value={o.value ?? o.text} key={key} disabled={o.text === "account"}>
              {o.text}
            </option>
          );
        })}
      </Select>

      <Select
        value={filters?.type ?? ""}
        onChange={(e) => handleSelect(e, "type")}
        style={SELECTSTYLE}
      >
        {OPTIONS.type.map((o, key) => {
          return (
            <option value={o.value ?? o.text} key={key}>
              {o.text}
            </option>
          );
        })}
      </Select>

      <Input
        value={filters?.name ?? ""}
        onChange={handleNameChange}
        placeholder="name"
        style={{ marginRight: "10px", marginBottom: "10px" }}
      />

      <Button variant={"primary"} onClick={onClear} style={{ marginBottom: "10px" }}>
        Clear
      </Button>
    </div>
  );
};

const SusspendButton = (props) => {
  const [modalOpen, setModalOpen] = React.useState(false);
  return (
    <>
      <Button variant="primary" onClick={() => setModalOpen(true)}>
        <FontAwesomeIcon fixedWidth icon={faGavel} style={{ marginRight: "10px" }} />
        Issue Ban
      </Button>

      <IssueBanModal isOpen={modalOpen} setOpen={setModalOpen} {...props} />
    </>
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

const UpdateButton = (props) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setModalOpen(true)}>Update</Button>

      <Update isOpen={modalOpen} setOpen={setModalOpen} {...props} />
    </>
  );
};

export { FilterComponents, SusspendButton, RevokeButton, UpdateButton };