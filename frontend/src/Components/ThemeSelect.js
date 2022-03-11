import React from "react";

import themes from "../App/theme";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun, faKissWinkHeart } from "@fortawesome/free-solid-svg-icons";
import { Button, Radio } from "../Components/Form";
import { Modal } from "../Components/Modal";
import { Box } from "../Components/Box";
import { Title } from "./Page";
import { AuthContext } from "../contexts";

const themeNames = Object.keys(themes);

export function ThemeSelect({ theme, setTheme }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const authContext = React.useContext(AuthContext);

  return (
    <>
      <Modal open={isOpen} setOpen={setIsOpen}>
        <Box>
          <Title>Theme select</Title>
          {themeNames.map((themeName) => (
            <div key={themeName}>
              <>
                {themeName === "Specialist" &&
                (!authContext ||
                  (authContext && Object.keys(authContext.access).length === 0)) ? null : (
                  <label>
                    <Radio
                      value={themeName}
                      checked={theme === themeName}
                      onChange={(evt) => setTheme(evt.target.value)}
                    />{" "}
                    {themeName}
                  </label>
                )}
              </>
            </div>
          ))}
        </Box>
      </Modal>
      <Button onClick={(evt) => setIsOpen(true)}>
        <FontAwesomeIcon
          fixedWidth
          icon={
            ["dark", "AMOLED"].includes(theme)
              ? faMoon
              : theme === "Specialist"
              ? faKissWinkHeart
              : faSun
          }
        />
      </Button>
    </>
  );
}
