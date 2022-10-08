import styled from "styled-components";
import { CharacterName } from "../../../Components/EntityLinks";
import { diffForHumans, formatDate, formatDatetime } from "../../../Util/time";
import { Buttons } from "../../../Components/Form";
import { RevokeButton, UpdateButton } from "./TableControls";
const DetailBlock = styled.div`
  display: flex;
  flex-flow: column wrap;
  justify-content: space-around;
  padding-top: 10px;
  padding-bottom: 15px;

  p {
    padding-bottom: 5px;
    font-weight: bold;

    span {
      font-weight: normal;
      font-style: italic;
      font-size: small;
      color: ${(props) => props.theme.colors.active};
    }
  }

  div {
    padding-bottom: 20px;

    &[mode="wide"] {
      display: flex;
      flex-flow: row wrap;
      div {
        min-width: 120px;
        width: 20vw;
      }
    }
  }
`;

const ExpandableRowsComponent = ({ data, refreshFunction }) => {
  return (
    <>
      <DetailBlock>
        <div style={{ paddingBottom: "0" }}>
          <div>
            <p>Issued by:</p>
            <CharacterName {...data.issued_by} />
          </div>
          {data.revoked_by && (
            <div>
              <p>Revoked by:</p>
              <CharacterName {...data.revoked_by} />
            </div>
          )}
        </div>

        <div style={{ paddingBottom: "0" }}>
          <div>
            <p>Issued at:</p>
            {formatDatetime(new Date(data.issued_at * 1000))}
          </div>

          {data.revoked_at && new Date(data.revoked_at * 1000) < new Date() && (
            // Only show if the expiry time is in the past
            <div>
              <p>Revoked at:</p>
              {formatDate(new Date(data.revoked_at * 1000))}
            </div>
          )}
        </div>
        {data.revoked_at && new Date(data.revoked_at * 1000) > new Date() && (
          // Only show if the expiry time is in the future
          <div>
            <p>Expires In:</p>
            <span title={formatDate(new Date(data.revoked_at * 1000))}>
              {diffForHumans(new Date(data.revoked_at * 1000))}
            </span>
          </div>
        )}

        <div style={{ wordWrap: "break-word", maxWidth: "70vw" }}>
          <p>
            Reason: <span>(this reason can ONLY be seen by the FC team)</span>
          </p>
          {data.reason}
        </div>

        {data.public_reason && (
          <div style={{ wordWrap: "break-word", maxWidth: "70vw" }}>
            <p>
              Public Reason: <span>(this reason can be seen by the pilot)</span>
            </p>
            {data.public_reason}
          </div>
        )}

        <Buttons>
          <UpdateButton ban={data} refreshFunction={refreshFunction} />
          <RevokeButton ban={data} refreshFunction={refreshFunction} />
        </Buttons>
      </DetailBlock>
    </>
  );
};

export default ExpandableRowsComponent;
