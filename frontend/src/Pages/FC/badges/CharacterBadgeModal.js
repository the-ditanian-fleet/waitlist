import React, { useEffect } from "react";
import { apiCall, errorToaster, toaster, useApi } from "../../../api";
import { Box } from "../../../Components/Box";
import CharacterName from "../../../Components/CharacterName";
import { Shield, tagBadges } from "../../../Components/Badge";
import { Button, CenteredButtons } from "../../../Components/Form";
import { Modal } from "../../../Components/Modal";
import { Title } from "../../../Components/Page";
import { ToastContext } from "../../../contexts";

async function assignBadge(badgeId, characterId) {
  return await apiCall(`/api/badges/${badgeId}/members`, {
    method: "POST",
    json: { id: characterId },
  });
}

async function revokeBadge(badgeId, characterId) {
  return await apiCall(`/api/badges/${badgeId}/members/${characterId}`, {
    method: "DELETE",
  });
}

const CharacterBadgeModal = ({ character }) => {
  const [isOpen, setOpen] = React.useState();
  return (
    <>
      <Button onClick={() => setOpen(true)}>Badges</Button>
      <BadgeModal character={character} isOpen={isOpen} setOpen={setOpen} />
    </>
  );
};

export default CharacterBadgeModal;

const BadgeModal = ({ character, isOpen, setOpen }) => {
  const [_badges, refreshBadges] = useApi("/api/badges"); // Get data from the API
  const [badges, setBadges] = React.useState([]); // This data includes bools checked, default
  const [pending, isPending] = React.useState(false);
  const toastContext = React.useContext(ToastContext);

  useEffect(() => {
    errorToaster(
      toastContext,
      apiCall(`/api/pilot/info?character_id=${character?.id}`, {}).then((res) => {
        if (!res.tags) return; // can't do anything if the tags array is undefined

        const tags = res.tags;
        const b = _badges;
        for (let i = 0; i < b?.length; i++) {
          b[i].default = tags.includes(b[i].name);
          b[i].checked = tags.includes(b[i].name);
        }

        setBadges(b ?? []);
      })
    );
  }, [_badges, toastContext, character]);

  const onSubmit = () => {
    isPending(true);

    badges.forEach((badge) => {
      if (!badge.default && badge.checked)
        toaster(toastContext, assignBadge(badge.id, character.id));
      else if (badge.default && !badge.checked)
        toaster(toastContext, revokeBadge(badge.id, character.id));
    });
    refreshBadges();
    isPending(false);
  };

  const onCheck = (evt, i, badge) => {
    badge.checked = evt.target.checked;
    let b = badges;
    b[i] = badge;
    setBadges([...b]);
  };

  return (
    <Modal open={isOpen} setOpen={setOpen}>
      <Box>
        <Title style={{ marginBottom: "5px" }}>
          <CharacterName {...character} avatarSize={32} noLink />
        </Title>

        <div style={{ marginLeft: "40px" }}>
          <p>Current Badges:</p>
          {badges.map((badge, key) => {
            const b = tagBadges[badge.name];
            return badge.default ? (
              <span style={{ marginRight: "5px", display: "inline-block" }} key={key}>
                <Shield color={b[0]} letter={b[1]} title={b[2]} h={"1.50rem"} />
              </span>
            ) : null;
          })}

          <div style={{ marginBottom: "15px" }}>
            {badges?.map((badge, key) => {
              return (
                <span key={key}>
                  {key % 3 ? null : <br />}
                  <label
                    style={{ marginRight: "20px", marginBottom: "15px", display: "inline-block" }}
                    htmlFor={key}
                  >
                    <input
                      id={key}
                      type="checkbox"
                      checked={badge.checked}
                      onChange={(evt) => onCheck(evt, key, badge)}
                    />
                    {badge.name}
                  </label>
                </span>
              );
            })}
          </div>
        </div>

        <CenteredButtons>
          <Button variant="success" onClick={onSubmit} disabled={pending}>
            Confirm
          </Button>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </CenteredButtons>
      </Box>
    </Modal>
  );
};
