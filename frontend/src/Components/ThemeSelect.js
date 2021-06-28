import React from "react";

import themes from "../App/theme";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { Button, Radio } from "../Components/Form";
import { Modal } from "../Components/Modal";
import { Box } from "../Components/Box";
import { Title } from "./Page";

const themeNames = Object.keys(themes);

export function ThemeSelect({ theme, setTheme }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Modal open={isOpen} setOpen={setIsOpen}>
        <Box>
          <Title>Theme select</Title>
          {themeNames.map((themeName) => (
            <div key={themeName}>
              <label>
                <Radio
                  value={themeName}
                  checked={theme === themeName}
                  onChange={(evt) => setTheme(evt.target.value)}
                />{" "}
                {themeName}
              </label>
            </div>
          ))}
        </Box>
      </Modal>
      <Button onClick={(evt) => setIsOpen(true)}>
        <FontAwesomeIcon fixedWidth icon={theme === "dark" ? faMoon : faSun} />
      </Button>
    </>
  );
}
