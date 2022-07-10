import React from "react";
import { useHistory, useLocation } from "react-router";
import { apiCall, errorToaster, useApi } from "../../api";
import { Button, InputGroup, Textarea } from "../../Components/Form";
import { PageTitle } from "../../Components/Page";
import { ToastContext } from "../../contexts";

async function saveNote(characterId, note) {
  await apiCall("/api/notes/add", {
    json: {
      character_id: characterId,
      note,
    },
  });
}

export function NoteAdd() {
  const toastContext = React.useContext(ToastContext);
  const [note, setNote] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const queryParams = new URLSearchParams(useLocation().search);
  var characterId = parseInt(queryParams.get("character_id"));
  const history = useHistory();

  const [pilot] = useApi(characterId ? `/api/pilot/info?character_id=${characterId}` : null);

  if (!characterId) {
    return <em>Missing character ID</em>;
  }

  return (
    <>
      <PageTitle>Add note{pilot && `: ${pilot.name}`}</PageTitle>
      <Textarea
        style={{ width: "100%" }}
        onChange={(evt) => setNote(evt.target.value)}
        value={note}
        rows="5"
        cols="60"
      />

      <p>
        <em>Remember that notes cannot be removed!</em>
      </p>
      <InputGroup>
        <Button
          variant="success"
          disabled={note.length < 20 || note.length > 5000 || isSubmitting}
          onClick={(evt) => {
            setIsSubmitting(true);
            errorToaster(
              toastContext,
              saveNote(characterId, note)
                .then((success) => history.push(`/pilot?character_id=${characterId}`))
                .finally((done) => setIsSubmitting(false))
            );
          }}
        >
          Save
        </Button>
        <Button onClick={(evt) => window.history.back()}>Never mind</Button>
      </InputGroup>
    </>
  );
}
