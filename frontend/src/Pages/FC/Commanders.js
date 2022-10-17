import React from "react";
import styled from "styled-components";
import { Route } from "react-router-dom";
import { AuthContext } from "../../contexts";
import Table from "../../Components/DataTable";
import { useApi } from "../../api";
import { Buttons } from "../../Components/Form";
import { formatDatetime } from "../../Util/time";
import { CharacterName } from "../../Components/EntityLinks";
import { AddButton, FilterComponents, RevokeButton } from "./commanders/TableControls";
import CommanderModal from "./commanders/CommanderModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserEdit } from "@fortawesome/free-solid-svg-icons";

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

const TableControls = styled.div`
  align-content: space-between;
  display: flex;
  width: 100%;
  flex-wrap: wrap;

  > button {
    @media (max-width: 800px) {
      width: 100%;
    }
  }

  #filters {
    flex-grow: 1;

    span:first-of-type {
      font-style: italic;
      margin-right: 10px;

      @media (max-width: 800px) {
        display: block;
        margin-bottom: 5px;
      }
    }

    @media (max-width: 800px) {
      input,
      select {
        width: calc(calc(100vw - 158px) / 2);
      }
    }

    @media (max-width: 500px) {
      input,
      select {
        width: 100%;
      }
      button {
        display: block;
        width: 100%;
      }
    }
  }
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

const special_sort = (charA, charB) => {
  const a = charA.name.toLowerCase();
  const b = charB.name.toLowerCase();
  if (a > b) return 1;
  else if (b > a) return -1;
  else return 0;
};

const CommandersPage = () => {
  const authContext = React.useContext(AuthContext);

  return authContext && authContext.access["access-manage"] ? (
    <Route exact path="/fc/commanders">
      <View />
    </Route>
  ) : (
    <></>
  );
};

export default CommandersPage;

const View = () => {
  const [data, refreshData] = useApi("/api/commanders");
  const [filters, setFilters] = React.useState({ role: null, name: "" });

  const columns = [
    {
      name: "Pilot Name",
      sortable: true,
      sortFunction: (rowA, rowB) => special_sort(rowA.character, rowB.character),
      grow: 2,
      selector: (row) => <CharacterName {...row.character} />,
    },
    {
      name: "Role",
      sortable: true,
      grow: 2,
      selector: (row) => row.role,
    },
    {
      name: "Granted By",
      sortable: true,
      sortFunction: (rowA, rowB) => special_sort(rowA.granted_by, rowB.granted_by),
      hide: "md",
      grow: 1,
      selector: (row) => <CharacterName {...row.granted_by} />,
    },
    {
      name: "Granted At",
      hide: "sm",
      grow: 1,
      selector: (row) => formatDatetime(new Date(row.granted_at * 1000)),
    },
    {
      name: "",
      compact: true,
      grow: 1,
      minWidth: "46",
      selector: (row) => (
        <Buttons>
          <CommanderModal character={row.character} current={row.role} handleRefresh={refreshData}>
            <IconBtn>
              <FontAwesomeIcon fixedWidth icon={faUserEdit} />
              <span>Update</span>
            </IconBtn>
          </CommanderModal>
          <RevokeButton character={row.character} role={row.role} refreshData={refreshData} />
        </Buttons>
      ),
    },
  ];

  const filteredData = (data?.commanders ?? []).filter(
    (row) =>
      row &&
      row.character &&
      (!filters.role || row.role === filters.role) && // eslint-disable-line
      row.character.name.toLowerCase().includes(filters?.name.toLowerCase())
  );

  const TableHeader = React.useMemo(() => {
    const handleClear = () => setFilters({ role: null, name: "" });

    return (
      <TableControls>
        <FilterComponents
          filterOptions={data?.filters}
          filters={filters}
          onChange={(e) =>
            setFilters({
              ...e,
            })
          }
          onClear={handleClear}
        />

        <AddButton refreshData={refreshData} />
      </TableControls>
    );
  }, [filters, data, refreshData]);

  return (
    <>
      <Header>
        <h1>Fleet Commanders</h1>
      </Header>

      <Table
        columns={columns}
        data={filteredData}
        defaultSortFieldId={1}
        subHeader
        subHeaderComponent={TableHeader}
        progressPending={!data?.commanders}
      />
    </>
  );
};
