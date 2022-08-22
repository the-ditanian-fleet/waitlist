import React from "react";
import PropTypes from "prop-types";
import DataTable, { createTheme } from "react-data-table-component";
import { ThemeContext } from "styled-components";

const Table = (props) => {
  const themeContext = React.useContext(ThemeContext);

  createTheme(
    "tdf",
    {
      text: {
        primary: themeContext.colors.primary,
        secondary: themeContext.colors.secondary,
      },
      background: {
        default: themeContext.colors.background,
      },
    },
    "dark"
  );

  return <DataTable {...props} />;
};

Table.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  customStyles: PropTypes.object,
  data: PropTypes.array,
  pagination: PropTypes.bool,
  paginationPerPage: PropTypes.number,
  paginationRowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
  persistTableHead: PropTypes.bool,
  theme: PropTypes.string.isRequired,
};

Table.defaultProps = {
  customStyles: {
    head: {
      style: {
        fontSize: "unset",
      },
    },
    subHeader: {
      style: {
        paddingLeft: "12px",
      },
    },
    rows: {
      style: {
        fontSize: "15px",
      },
    },
  },
  pagination: true,
  paginationPerPage: 50,
  paginationRowsPerPageOptions: [10, 25, 50, 75, 100],
  persistTableHead: true,
  theme: "tdf",
};

export default Table;
