import { useContext } from "react";
import { AuthContext, ToastContext } from "../../contexts";
import { faExternalLinkAlt, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { apiCall, errorToaster, useApi } from "../../api";
import { CharacterName } from "../../Components/EntityLinks";
import { Button } from "../../Components/Form";
import { Title } from "../../Components/Page";
import styled from "styled-components";
import Spinner from "../../Components/Spinner";

const AltCharacterDisplay = styled.div`
  margin-bottom: 25px;

  div {
    padding: 5px;
    width: 100%;
  }

  button {
    padding: 5px;
    font-size: 10px;
    margin-left: 5px;
  }
`;

async function OpenWindow(target_id, character_id) {
  return await apiCall(`/api/open_window`, {
    json: { target_id, character_id },
  });
}

const AltCharacters = (props) => {
  const authContext = useContext(AuthContext);

  return !authContext?.access["waitlist-tag:HQ-FC"] ? null : (
    <Display characterId={props.character} />
  );
};

const Display = ({ characterId = 0 }) => {
  const authContext = useContext(AuthContext);
  const [characters] = useApi(`/api/pilot/alts?character_id=${characterId}`);

  return (
    <AltCharacterDisplay>
      <Title>
        Known Alt Characters
        <FontAwesomeIcon
          fixedWidth
          icon={faInfoCircle}
          style={{ marginLeft: "5px" }}
          title="Only characters that the pilot has linked are shown below.&#013;Characters are unlinked when the user clicks logout."
        />
      </Title>
      {!characters ? (
        <Spinner />
      ) : characters?.length > 0 ? (
        characters?.map((character, key) => {
          return (
            <div key={key}>
              <CharacterName {...character} />
              <Button
                title="Open Show Info Window"
                onClick={(evt) =>
                  errorToaster(ToastContext, OpenWindow(character.id, authContext.current.id))
                }
              >
                <FontAwesomeIcon fixedWidth icon={faExternalLinkAlt} />
              </Button>
            </div>
          );
        })
      ) : (
        <em style={{ fontSize: "smaller" }}>Pilot has no known alts.</em>
      )}
    </AltCharacterDisplay>
  );
};

export default AltCharacters;
