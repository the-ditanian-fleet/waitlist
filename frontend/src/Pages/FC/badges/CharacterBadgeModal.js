import React, { useEffect } from "react";
import { apiCall, errorToaster, toaster, useApi } from "../../../api";
import { Box } from "../../../Components/Box";
import CharacterName from "../../../Components/CharacterName";
import { Shield, tagBadges } from "../../../Components/Badge";
import { Button, CenteredButtons } from "../../../Components/Form";
import { Modal } from "../../../Components/Modal";
import { Title } from "../../../Components/Page";
import { ToastContext } from "../../../contexts";
import styled from "styled-components";

const Wrapper = styled.div`
  margin-left: 40px;
  margin-bottom: 5px;

  &:first-of-type {
    min-height: 50px;
  }

  &:nth-of-type(2) {
    min-height: 100px;
  }

  @media (min-width: 400px) {
    min-width: 310px;
  }

  @media (max-width: 451px) {
    margin-left: 3px;

    span {
      display: block;
    }

    br {
      display: none;
    }
  }
`;

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

const CharacterBadgeModal = ({ character, refreshData }) => {
  const [isOpen, setOpen] = React.useState();
  return (
    <>
      <Button onClick={() => setOpen(true)}>Badges</Button>
      {isOpen && <BadgeModal {...{ character, isOpen, setOpen, refreshData }} />}
    </>
  );
};

export default CharacterBadgeModal;

const BadgeModal = ({ character, isOpen, setOpen, refreshData }) => {
  const [avaliableBadges, refreshBadges] = useApi("/api/badges"); // Get data from the API
  const [badges, setBadges] = React.useState(undefined); // This data includes bools checked, default
  const [pending, isPending] = React.useState(false);
  const toastContext = React.useContext(ToastContext);

  useEffect(() => {
    if (!avaliableBadges) return; // Make the call ONLY once when the badge options are known

    errorToaster(
      toastContext,
      apiCall(`/api/pilot/info?character_id=${character?.id}`, {}).then((res) => {
        if (!res.tags) return; // can't do anything if the tags array is undefined

        const tags = res.tags;
        const b = avaliableBadges;
        for (let i = 0; i < b?.length; i++) {
          b[i].default = tags.includes(b[i].name);
          b[i].checked = tags.includes(b[i].name);
        }

        setBadges(b ?? []);
      })
    );
  }, [avaliableBadges, toastContext, character?.id]);

  const onSubmit = () => {
    isPending(true);

    let promises = [];
    badges.forEach((badge) => {
      // These badges are being revoked
      if (badge.default && !badge.checked) {
        promises.push(
          new Promise((resolve) => {
            toaster(toastContext, revokeBadge(badge.id, character.id)).then(resolve);
          })
        );
      }
    });

    Promise.all(promises).then(() => {
      // All badges revoked, now we need to assign new badges
      let promises = [];
      badges.forEach((badge) => {
        if (!badge.default && badge.checked) {
          promises.push(
            new Promise((resolve) => {
              toaster(toastContext, assignBadge(badge.id, character.id)).then(resolve);
            })
          );
        }
      });

      // When all revocations and assignments are completed
      Promise.all(promises).then(() => {
        refreshBadges();
        isPending(false);
        if (refreshData) refreshData();
      });
    });
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

        <Wrapper>
          {!badges ? (
            <small style={{ fontStyle: "italic", fontSize: "smaller" }}>Loading...</small>
          ) : (
            <>
              <p>Current Badges:</p>
              {badges.map((badge, key) => {
                const b = tagBadges[badge.name];
                return badge.default ? (
                  <span style={{ marginRight: "5px", display: "inline-block" }} key={key}>
                    <Shield color={b[0]} letter={b[1]} title={b[2]} h={"1.50rem"} />
                  </span>
                ) : null;
              })}
            </>
          )}
        </Wrapper>

        <Wrapper>
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
        </Wrapper>

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
