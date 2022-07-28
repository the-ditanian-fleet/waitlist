import React from "react";
import { apiCall, toaster } from "../../api";
import { Button } from "../../Components/Form";
import { CellHead, Table, TableHead, Row, TableBody, Cell } from "../../Components/Table";
import { ToastContext } from "../../contexts";
import { PageTitle } from "../../Components/Page";

const announcelocations = {
	Home : 1,
	Waitlist : 2,
	"X-UP" : 3,
	Fits : 4
}

async function changeAnnouncement(id, message) {
  await apiCall("/api/announcement/write", {
    json: {
      id: id,
      message,
    },
  });
}

function AnnounceEdit({ toastContext, id }) {
  return (
    <Button
      variant="danger"
      onClick={(evt) => {
        var message = prompt("Enter an announcement");
        if (message || message === "" ) {
          toaster(toastContext, changeAnnouncement(id, message));
        }
      }}
    >
      Edit
    </Button>
  );
}
/*
function AnnounceString({ toastContext, id }) {
  
  return (
    
  );
}*/

export function Announcements() {
  
  const toastContext = React.useContext(ToastContext);
  return (
    <>
      <PageTitle>Announcement configurator</PageTitle>
      <Table fullWidth>
        <TableHead>
          <Row>
            <CellHead>Location</CellHead>
            <CellHead>Current</CellHead>
			<CellHead></CellHead>
          </Row>
        </TableHead>
        <TableBody>
          <Row>
            <Cell>Home</Cell>
			 <Cell>
              
            </Cell>
            <Cell>
              <AnnounceEdit toastContext={toastContext} id={announcelocations["Home"]} />
            </Cell>
          </Row>
		  
        </TableBody>
      </Table>
    </>
  );
}
