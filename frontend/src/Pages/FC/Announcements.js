import { faBullhorn } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Route } from "react-router-dom";
import styled from "styled-components";
import { apiCall, errorToaster, useApi } from "../../api";
import { CharacterName } from "../../Components/EntityLinks";
import Table from "../../Components/DataTable";
import { Button } from "../../Components/Form";
import { AuthContext, ToastContext } from "../../contexts";
import { AddAnnouncement, UpdateAnnouncement } from "./announcements/Modals";
import { usePageTitle } from "../../Util/title";

const AnnouncementsPage = () => {
  const authContext = React.useContext(AuthContext);

  return authContext && authContext.access["waitlist-tag:HQ-FC"] ? (
    <Route exact path="/fc/announcements">
      <View />
    </Route>
  ) : (
    <></>
  );
};

export default AnnouncementsPage;

const Header = styled.div`
  padding-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-content: space-between;

  h1 {
    font-size: 32px;
  }
`;

async function deleteAnnouncement(id) {
  return await apiCall(`/api/v2/announcements/${id}`, {
    method: "DELETE",
  });
}

const View = () => {
  const [announcements, updateData] = useApi(`/api/v2/announcements`);
  const [modalOpen, setModalOpen] = React.useState(false);

  const toastContext = React.useContext(ToastContext);

  const columns = [
    {
      name: "Content",
      grow: 5,
      selector: (row) => row.message,
      wrap: true,
    },
    {
      name: "Pages",
      selector: (row) => {
        const pages = row.pages;
        if (!pages) return "All";
        return JSON.parse(pages).join(", ");
      },
      wrap: true,
    },
    {
      name: "Created By",
      selector: (row) => <CharacterName {...row.created_by} />,
    },
    {
      name: "",
      maxWidth: "115px",
      selector: (row) => <UpdateAnnouncement {...{ data: row, refreshFunction: updateData }} />,
    },
    {
      name: "",
      maxWidth: "110px",
      selector: (row) => (
        <Button
          variant="danger"
          onClick={() => errorToaster(toastContext, deleteAnnouncement(row.id).then(updateData))}
        >
          Delete
        </Button>
      ),
    },
  ];

  usePageTitle("Announcements");
  return (
    <>
      <Header>
        <h1>Announcements</h1>

        <Button
          variant={"primary"}
          onClick={() => setModalOpen(true)}
          style={{ marginTop: "15px" }}
        >
          <FontAwesomeIcon fixedWidth icon={faBullhorn} style={{ marginRight: "10px" }} />
          New
        </Button>
      </Header>

      <Table
        columns={columns}
        data={announcements ?? []}
        pagination={false}
        progressPending={!announcements}
      />

      <AddAnnouncement isOpen={modalOpen} setOpen={setModalOpen} refreshFunction={updateData} />
    </>
  );
};
