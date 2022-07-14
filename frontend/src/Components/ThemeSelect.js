import React from "react";

import themes from "../App/theme";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun, faKissWinkHeart } from "@fortawesome/free-solid-svg-icons";
import { Button, Radio } from "../Components/Form";
import { Modal } from "../Components/Modal";
import { Box } from "../Components/Box";
import { Title } from "./Page";

const themeNames = Object.keys(themes);

export function ThemeSelect({ theme, setTheme, sticker, setSticker }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const handleChange = () => {
    setSticker(!sticker);
  };

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
          {themes[theme].sticker && (
            <Button style={{ marginTop: "0.5em" }} onClick={handleChange}>
              {sticker ? "Disable" : "Enable"} Sticker
            </Button>
          )}
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
