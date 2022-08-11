import React from "react";
import { apiCall, toaster, useApi } from "../../api";
import { Button, InputGroup, Textarea, Buttons } from "../../Components/Form";
import { CellHead, Table, TableHead, Row, TableBody, Cell } from "../../Components/Table";
import { ToastContext } from "../../contexts";
import { PageTitle } from "../../Components/Page";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faTimes } from "@fortawesome/free-solid-svg-icons";
import { ThemeContext } from "styled-components";
import { Modal } from "../../Components/Modal";
import { Box } from "../../Components/Box";
import { Title } from "../../Components/Page";

// If new entries are wanted they can be added here. Only admins can initialize them (by editing announcement)
const announcelocations = {
  Home: 1,
  Waitlist: 2,
  "X-UP": 3,
  Fits: 4,
};

async function changeAnnouncement(id, message) {
  await apiCall("/api/announcement/write", {
    json: {
      id: id,
      message,
    },
  });
}

function AnnounceEditRemove({ toastContext, id, announcement, onAction }) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [message, setMessage] = React.useState(announcement ? announcement.message : "");
  return (
    <>
      {modalOpen ? (
        <Modal open={true} setOpen={setModalOpen}>
          <Box>
            <Title>Edit</Title>
            <Textarea
              style={{ width: "100%", marginBottom: "1em" }}
              onChange={(evt) => setMessage(evt.target.value)}
              value={message}
              rows="5"
              cols="60"
            />
            <Buttons>
              <Button
                variant="success"
                onClick={(evt) => {
                  toaster(toastContext, changeAnnouncement(id, message)).then(onAction);
                  setModalOpen(false);
                }}
              >
                Confirm
              </Button>
              <Button
                variant="secondary"
                onClick={(evt) => {
                  setModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <AnnounceRemove
                toastContext={toastContext}
                id={id}
                onAction={onAction}
                setMessage={setMessage}
              />
            </Buttons>
          </Box>
        </Modal>
      ) : null}

      <Button variant="secondary" onClick={(evt) => setModalOpen(true)}>
        Edit
      </Button>
      <AnnounceRemove
        toastContext={toastContext}
        id={id}
        onAction={onAction}
        setMessage={setMessage}
      />
    </>
  );
}

function AnnounceRemove({ toastContext, id, onAction, setMessage }) {
  return (
    <Button
      variant="danger"
      onClick={(evt) => {
        toaster(toastContext, changeAnnouncement(id, "")).then(onAction);
        setMessage("");
      }}
    >
      <FontAwesomeIcon icon={faTimes} />
    </Button>
  );
}

function CurrentAnnouncement({ announcement }) {
  const theme = React.useContext(ThemeContext);
  var out = "NOT INITIALIZED";
  var statuscolor = theme.colors.danger.color;

  if (announcement) {
    out = announcement.message;
    if (out === "") {
      out = "Disabled by " + announcement.created_by;
    } else {
      statuscolor = theme.colors.success.color;
    }
  }

  return (
    <>
      <div style={{ display: "flex" }}>
        <div>
          <FontAwesomeIcon style={{ marginRight: "0.4em", color: statuscolor }} icon={faCircle} />
        </div>{" "}
        <div style={{ wordBreak: "break-word", whiteSpace: "pre-line" }}>{out}</div>
      </div>
    </>
  );
}

function ControlTable({ announceList, toastContext, onAction }) {
  return (
    <Table fullWidth>
      <TableHead>
        <Row>
          <CellHead style={{ width: "15%" }}>Location</CellHead>
          <CellHead style={{ width: "60%" }}>Current</CellHead>
          <CellHead></CellHead>
        </Row>
      </TableHead>
      <TableBody>
        {Object.keys(announcelocations).map((key, index) => (
          <Row key={index}>
            <Cell>{key}</Cell>
            <Cell>
              <CurrentAnnouncement
                announcement={
                  announceList.filter((entry) => entry.id === announcelocations[key])[0]
                }
              />
            </Cell>
            <Cell>
              <InputGroup>
                <AnnounceEditRemove
                  toastContext={toastContext}
                  id={announcelocations[key]}
                  announcement={
                    announceList.filter((entry) => entry.id === announcelocations[key])[0]
                  }
                  onAction={onAction}
                />
              </InputGroup>
            </Cell>
          </Row>
        ))}
      </TableBody>
    </Table>
  );
}

export function Announcements() {
  const toastContext = React.useContext(ToastContext);
  const [announcements, refreshAnnouncements] = useApi("/api/announcement/read");

  if (!announcements) {
    return <em>Loading</em>;
  }
  return (
    <>
      <PageTitle>Announcement configurator</PageTitle>
      <ControlTable
        announceList={announcements.list}
        toastContext={toastContext}
        onAction={refreshAnnouncements}
      />
    </>
  );
}
