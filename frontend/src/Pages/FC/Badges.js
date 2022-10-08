import React, { useEffect } from "react";
import { Route } from "react-router-dom";
import { AuthContext } from "../../contexts";
import { Button, Input, Select } from "../../Components/Form";
import { CharacterName } from "../../Components/EntityLinks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import styled from "styled-components";
import Table from "../../Components/DataTable";
import { apiCall, useApi } from "../../api";
import { formatDatetime } from "../../Util/time";
import BadgeIcon from "../../Components/Badge";
import { AddBadge, RevokeButton } from "./badges/BadgesPageControls";

const BadgesPage = () => {
  const authContext = React.useContext(AuthContext);

  return authContext && authContext.access["badges-manage"] ? (
    <Route exact path="/fc/badges">
      <View />
    </Route>
  ) : (
    <></>
  );
};

export default BadgesPage;

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

const A = styled.a`
  color: ${(props) => props.theme.colors.highlight.text};
  text-decoration: none;

  &:hover {
    cursor: pointer;
    color: ${(props) => props.theme.colors.highlight.active};
    transition: ease-in-out 0.15s;
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

const special_sort = (charA, charB) => {
  const a = charA.name.toLowerCase();
  const b = charB.name.toLowerCase();
  if (a > b) return 1;
  else if (b > a) return -1;
  else return 0;
};

const FilterComponents = ({ badgeOptions, filters, onChange, onClear }) => {
  const handleSelect = (evt) => {
    let f = filters;
    f.type = evt.target.value === "-1" ? null : evt.target.value;
    onChange(f);
  };

  const handleNameChange = (evt) => {
    let f = filters;
    f.name = evt.target.value;
    onChange(f);
  };

  return (
    <div id="filters">
      <span>Filter results by...</span>
      <Select
        value={filters?.type ?? ""}
        onChange={handleSelect}
        style={{
          marginRight: "10px",
          marginBottom: "10px",
          appearance: "auto",
        }}
      >
        <option value={-1}>any type...</option>
        {badgeOptions?.map((badge, key) => (
          <option value={badge.id} key={key} readOnly>
            {badge.name} ({badge?.member_count?.toLocaleString()})
          </option>
        ))}
      </Select>
      <Input
        value={filters?.name ?? ""}
        onChange={handleNameChange}
        placeholder="pilot name"
        style={{ marginRight: "10px", marginBottom: "10px" }}
      />
      <Button variant={"primary"} onClick={onClear} style={{ marginBottom: "10px" }}>
        Clear
      </Button>
    </div>
  );
};

const View = () => {
  const [badges, updateData] = useApi("/api/badges");
  const [characters, setChracters] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [filters, setFilters] = React.useState({ type: null, name: "" });

  useEffect(() => {
    if (!badges) {
      return; // We can't do API calls if this value is null
    }

    var promises = [];
    badges.forEach((badge) => {
      promises.push(
        new Promise((resolve, reject) => {
          apiCall(`/api/badges/${badge.id}/members`, {})
            .then((res) => {
              resolve(res);
            })
            .catch((e) => reject(e));
        })
      );
    });

    Promise.all(promises).then((e) => {
      let characters = [];
      for (let i = 0; i < e.length; i++) {
        if (e[i].length !== 0) {
          characters = [...characters, ...e[i]];
        }
      }
      setChracters(characters);
    });
  }, [badges]);

  const columns = [
    {
      name: "Pilot Name",
      sortable: true,
      sortFunction: (rowA, rowB) => special_sort(rowA.character, rowB.character),
      grow: 2,
      selector: (row) => <CharacterName {...row.character} />,
    },
    {
      name: "Badge",
      sortable: true,
      sortFunction: (rowA, rowB) => special_sort(rowA.badge, rowB.badge),
      grow: 1,
      minWidth: "unset",
      selector: (row) => <BadgeIcon type={row.badge.name} height="1.8em" />,
    },
    {
      name: "Granted By",
      sortable: true,
      sortFunction: (rowA, rowB) => special_sort(rowA.granted_by, rowB.granted_by),
      hide: "md",
      grow: 2,
      selector: (row) => <CharacterName {...row.granted_by} />,
    },
    {
      name: "Granted At",
      hide: "sm",
      grow: 2,
      selector: (row) => formatDatetime(new Date(row.granted_at * 1000)),
    },
    {
      name: "",
      grow: 1,
      minWidth: "95",
      selector: (row) => (
        <RevokeButton badge={row.badge} character={row.character} refreshFunction={updateData} />
      ),
    },
  ];

  const TableHeader = React.useMemo(() => {
    const handleClear = () => setFilters({ type: null, name: "" });

    return (
      <TableControls>
        <FilterComponents
          badgeOptions={badges}
          filters={filters}
          onChange={(e) =>
            setFilters({
              ...e,
            })
          }
          onClear={handleClear}
        />

        <Button
          variant={"primary"}
          onClick={() => setModalOpen(true)}
          style={{ marginBottom: "10px" }}
        >
          <FontAwesomeIcon fixedWidth icon={faPlus} style={{ marginRight: "10px" }} />
          Assign Badge
        </Button>
      </TableControls>
    );
  }, [filters, badges]);

  // filter results by badge type and pilot assigned name
  const filteredData = (characters ?? []).filter(
    (row) =>
      row &&
      row.character &&
      (!filters.type || row.badge.id == filters.type) && // eslint-disable-line
      row.character.name.toLowerCase().includes(filters?.name.toLowerCase())
  );

  return (
    <>
      <Header>
        <h1>Specialist Badges</h1>
      </Header>

      <p style={{ marginBottom: "10px" }}>
        You can find the badge guide <A href="/badges">here</A>.
      </p>

      <Table
        columns={columns}
        data={filteredData}
        defaultSortFieldId={1}
        subHeader
        subHeaderComponent={TableHeader}
        progressPending={!characters}
      />

      <AddBadge
        badgeOptions={badges}
        isOpen={modalOpen}
        setOpen={setModalOpen}
        refreshFunction={updateData}
      />
    </>
  );
};
