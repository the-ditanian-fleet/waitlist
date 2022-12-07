import React from "react";
import styled from "styled-components";
import Table, {
  SortAlphabetical,
  SortByEntityCategory,
  SortDate,
} from "../../Components/DataTable";
import { useApi } from "../../api";
import { FilterComponents, SusspendButton } from "./bans/TableControls";
import ExpandableRowsComponent from "./bans/ExpandableRows";
import { AllianceName, CharacterName, CorporationName } from "../../Components/EntityLinks";
import { formatDate } from "../../Util/time";
import { usePageTitle } from "../../Util/title";

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

const BansPage = () => {
  const [data, refreshData] = useApi("/api/v2/bans");
  const [filters, setFilters] = React.useState({ type: null, name: "", entity_type: "" });

  const columns = [
    {
      name: "Name",
      sortable: true,
      sortFunction: (a, b) => SortAlphabetical(a.entity.name, b.entity.name),
      grow: 3,
      selector: (row) => {
        switch (row.entity.category) {
          case "Character":
            return <CharacterName {...row.entity} />;

          case "Corporation":
            return <CorporationName {...row.entity} />;

          case "Alliance":
            return <AllianceName {...row.entity} />;

          default:
            return row.entity.name;
        }
      },
    },
    {
      name: "Entity Type",
      sortable: true,
      sortFunction: (a, b) => SortByEntityCategory(a.entity, b.entity),
      grow: 1,
      selector: (row) => row.entity.category,
    },
    {
      name: "Expires",
      sortable: true,
      hide: "sm",
      sortFunction: (a, b) => SortDate(a.revoked_at, b.revoked_at),
      grow: 1,
      selector: (row) => (row.revoked_at ? formatDate(new Date(row.revoked_at * 1000)) : "Never"),
    },
    {
      name: "Reason",
      hide: "sm",
      grow: 6,
      wrap: true,
      selector: (row) => row.reason,
    },
  ];

  const filteredData = (data ?? []).filter(
    (row) =>
      (!filters.entity_type || row.entity.category.toLowerCase() == filters.entity_type) && // eslint-disable-line
      (!filters.type ||
        (filters.type === "permanent" && !row.revoked_at) ||
        (filters.type === "temporary" && row.revoked_at)) &&
      row.entity.name.toLowerCase().includes(filters?.name.toLowerCase())
  );

  const TableHeader = React.useMemo(() => {
    return (
      <TableControls>
        <FilterComponents
          {...{
            filters,
            onChange: (e) => {
              setFilters({
                ...e,
              });
            },
            onClear: () =>
              setFilters({
                type: null,
                name: "",
                entity_type: "",
              }),
          }}
        />

        <SusspendButton refreshFunction={refreshData} />
      </TableControls>
    );
  }, [filters, refreshData]); // is data needed?

  usePageTitle("Bans");
  return (
    <>
      <Header>
        <h1>System Bans</h1>
      </Header>

      <p style={{ marginBottom: "10px" }}>
        Players who are banned or are in a banned corporation or alliance will be prevented from
        authenticating or joining the waitlist.
      </p>

      <Table
        textAlign="center"
        verticalAlign="middle"
        columns={columns}
        data={filteredData}
        defaultSortFieldId={1}
        expandableRows
        expandableRowsComponent={ExpandableRowsComponent}
        expandableRowsComponentProps={{ refreshFunction: refreshData }}
        subHeader
        subHeaderComponent={TableHeader}
        progressPending={!data}
      />
    </>
  );
};

export default BansPage;
