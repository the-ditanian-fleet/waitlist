import React, { useEffect } from "react";
import styled from "styled-components";
import { apiCall, errorToaster } from "../../../api";
import { Box } from "../../../Components/Box";
import { Button, Buttons, Label, Select, Textarea } from "../../../Components/Form";
import { Modal } from "../../../Components/Modal";
import { Title } from "../../../Components/Page";
import { ToastContext } from "../../../contexts";
import { options } from "./page-options";

const FormGroup = styled.div`
  margin: 15px 0px;
  padding: 5px 10px;
  flex-grow: 2;
`;

const Small = styled.div`
  font-style: italic;
`;

const TEMPLATES = {
  "Use TDF-WL": {
    content: 'Join the in-game channel "TDF-WL" to x-up for the fleet.',
    alert: false,
  },
  "Gankers in Focus": {
    content: "GANKERS ARE IN FOCUS! Stay docked and read the fleet MOTD for instructions.",
    alert: true,
  },
};

const PAGE_CHECKBOX_STYLES = {
  marginRight: "20px",
  marginBottom: "15px",
  display: "inline-block",
};

const PageFilters = ({ idPrefix = "", selectedFilters, onChange }) => {
  const [values, setValues] = React.useState([]);

  useEffect(() => {
    if (selectedFilters !== values) {
      setValues(selectedFilters ?? []);
    }
  }, []);

  const handleClick = (e) => {
    const chckbox = e.target;
    let valueArray = values;

    // If the target checkbox was ticked add it to the array
    if (chckbox.checked && !valueArray.includes(chckbox.id)) {
      valueArray.push(chckbox.id);
    }

    // If the target checkbox was unticked remove it from the array
    if (!chckbox.checked && valueArray.includes(chckbox.id)) {
      let indexOf = valueArray.indexOf(chckbox.id);
      valueArray.splice(indexOf, 1);
    }

    setValues([...valueArray]);
    onChange(valueArray);
  };

  return (
    <FormGroup>
      <Label>Display on: (leave blank for site-wide)</Label>

      {options.map((option, key) => {
        const id = option.name.toLowerCase();
        const is_checked = values.includes(id);

        return (
          <label key={key} htmlFor={id} style={PAGE_CHECKBOX_STYLES}>
            <input id={id} type="checkbox" checked={is_checked} onChange={(e) => handleClick(e)} />{" "}
            {option.name}
          </label>
        );
      })}
    </FormGroup>
  );
};

const AddAnnouncement = ({ isOpen, setOpen, refreshFunction }) => {
  const toastContext = React.useContext(ToastContext);

  const [alert, setAlert] = React.useState(false);
  const [content, setContent] = React.useState(undefined);
  const [pageFilters, setPageFilters] = React.useState([]);
  const [pending, isPending] = React.useState(false);

  const resetInputs = () => {
    setAlert(false);
    setContent(undefined);
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (pending) {
      return; // stop users from clicking this twice
    }
    isPending(true);

    let pages = null;
    if (pageFilters.length > 0) {
      pages = JSON.stringify(pageFilters);
    }

    errorToaster(
      toastContext,
      apiCall(`/api/v2/announcements`, {
        method: "POST",
        json: {
          message: content,
          is_alert: alert,
          pages,
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

  const selectTemplate = (e) => {
    const template = TEMPLATES[e.target.value];
    setAlert(template?.alert);
    setContent(template?.content);
  };

  return (
    <Modal open={isOpen} setOpen={setOpen}>
      <Box>
        <Title>New Announcement</Title>

        <form onSubmit={onSubmit}>
          <FormGroup>
            <Label htmlFor="content" required>
              Content:
            </Label>
            <Textarea
              id="content"
              value={content ?? ""}
              style={{ maxWidth: "450px", width: "80vw", height: "250px", resize: "vertical" }}
              onChange={(e) => setContent(e.target.value)}
              required
              minLength="0"
              maxLength="512"
            />
            <Small>Maximum 512 characters.</Small>
          </FormGroup>

          <FormGroup>
            <input
              id="important"
              type="checkbox"
              checked={alert}
              onChange={() => setAlert(!alert)}
            />
            <label htmlFor="important" title="Banner has a red background.">
              This is a{" "}
              <b>
                <u>REALLY</u>
              </b>{" "}
              important announcement!
            </label>
          </FormGroup>

          <PageFilters onChange={(e) => setPageFilters(e)} />

          <FormGroup>
            <Label>or select a template</Label>
            <Select style={{ width: "100%", appearance: "auto" }} onChange={selectTemplate}>
              <option>Select...</option>
              {Object.entries(TEMPLATES).map((template, key) => {
                const [k] = template;
                return (
                  <option key={key} value={k}>
                    {k}
                  </option>
                );
              })}
            </Select>
          </FormGroup>

          <Buttons style={{ paddingLeft: "8px" }}>
            <Button variant="danger" type="submit" disabled={pending}>
              Confirm
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </Buttons>
        </form>
      </Box>
    </Modal>
  );
};

const UpdateAnnouncement = ({ data, refreshFunction }) => {
  const [isOpen, setOpen] = React.useState(false);

  const UpdateModal = ({ data, refreshFunction, isOpen, setOpen }) => {
    const toastContext = React.useContext(ToastContext);

    const [content, setContent] = React.useState(undefined);
    const [alert, setAlert] = React.useState(false);
    const [pageFilters, setPageFilters] = React.useState([]);
    const [pending, isPending] = React.useState(false);

    const onSubmit = (e) => {
      e.preventDefault();

      if (pending) {
        return; // stop users from clicking this twice
      }
      isPending(true);

      let pages = null;
      if (pageFilters.length > 0) {
        pages = JSON.stringify(pageFilters);
      }

      errorToaster(
        toastContext,
        apiCall(`/api/v2/announcements/${data.id}`, {
          method: "put",
          json: {
            message: content,
            is_alert: alert,
            pages,
          },
        })
          .then(() => {
            setOpen(false);
            refreshFunction();
          })
          .finally(() => isPending(false))
      );
    };

    useEffect(() => {
      setContent(data?.message);
      setAlert(data?.is_alert);
    }, [data?.message, data?.is_alert]);

    return (
      <Modal open={isOpen} setOpen={setOpen}>
        <Box>
          <Title>Update Announcement #{data.id}</Title>

          <form onSubmit={onSubmit}>
            <FormGroup>
              <Label htmlFor={`content-${data.id}`} required>
                Content:
              </Label>
              <Textarea
                id={`content-${data.id}`}
                value={content ?? ""}
                style={{ maxWidth: "450px", width: "80vw", height: "250px", resize: "vertical" }}
                onChange={(e) => setContent(e.target.value)}
                required
                minLength="0"
                maxLength="512"
              />
              <Small>Maximum 512 characters.</Small>
            </FormGroup>

            <FormGroup>
              <input
                id={`important-${data.id}`}
                type="checkbox"
                checked={alert}
                onChange={() => setAlert(!alert)}
              />
              <label htmlFor={`important-${data.id}`} title="Banner has a red background.">
                This is a{" "}
                <b>
                  <u>REALLY</u>
                </b>{" "}
                important announcement!
              </label>
            </FormGroup>

            <PageFilters
              idPrefix={data.id}
              selectedFilters={data?.pages ? JSON.parse(data.pages) : []}
              onChange={(e) => setPageFilters(e)}
            />

            <Buttons style={{ paddingLeft: "8px" }}>
              <Button variant="danger" type="submit" disabled={pending}>
                Confirm
              </Button>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </Buttons>
          </form>
        </Box>
      </Modal>
    );
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Update</Button>
      <UpdateModal
        isOpen={isOpen}
        setOpen={setOpen}
        data={data}
        refreshFunction={refreshFunction}
      />
    </>
  );
};

export { AddAnnouncement, UpdateAnnouncement };
