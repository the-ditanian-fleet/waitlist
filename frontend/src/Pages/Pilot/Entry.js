import React from "react";
import styled from "styled-components";
import { Box } from "../../Components/Box";
import { DNADisplay } from "../../Components/FitDisplay";
import { Modal } from "../../Components/Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboard, faGraduationCap, faPen, faPlane } from "@fortawesome/free-solid-svg-icons";
import { Badge } from "../../Components/Badge";
import { formatDatetime, formatDuration } from "../../Util/time";
import ReactMarkdown from "react-markdown";
import { Content } from "../../Components/Page";

const Link = styled.a`
  cursor: pointer;
  text-decoration: underline;
`;

const EntryDOM = styled.div`
  display: flex;

  border-bottom: solid 1px ${(props) => props.theme.colors.accent2};
  &:first-child {
    border-top: solid 1px ${(props) => props.theme.colors.accent2};
  }
  &:nth-child(odd) {
    background-color: ${(props) => props.theme.colors.accent1};
  }
`;
EntryDOM.Time = styled.div`
  flex: 0 0 200px;
  padding: 0.5em;
  @media (max-width: 480px) {
    width: 40%;
    flex: unset;
  }
`;
EntryDOM.Icon = styled.div`
  flex: 0 0 auto;
  padding: 0.5em;
`;
EntryDOM.Content = styled.div`
  flex: 1;
  padding: 0.5em;
`;

function Entry({ time, icon, children }) {
  return (
    <EntryDOM>
      <EntryDOM.Icon>{icon && <FontAwesomeIcon fixedWidth icon={icon} />}</EntryDOM.Icon>
      <EntryDOM.Time>{formatDatetime(new Date(time * 1000))}</EntryDOM.Time>
      <EntryDOM.Content>{children}</EntryDOM.Content>
    </EntryDOM>
  );
}

export function FleetEntry({ logged_at, hull, time_in_fleet }) {
  return (
    <Entry time={logged_at} icon={faPlane}>
      <span style={{ display: "inline-block", minWidth: "40%" }}>{hull.name}</span>
      <span>{formatDuration(time_in_fleet)}</span>
    </Entry>
  );
}

function implantsToFit(implants) {
  return "670:" + implants.map((implant) => `${implant};1`).join(":") + "::";
}

export function FitEntry({ logged_at, hull, dna, implants }) {
  const [showModal, setShowModal] = React.useState(false);

  return (
    <Entry time={logged_at} icon={faPen}>
      {showModal && (
        <Modal open={true} setOpen={setShowModal}>
          <Box style={{ display: "flex" }}>
            <DNADisplay dna={dna} />
            {implants && implants.length ? <DNADisplay dna={implantsToFit(implants)} /> : null}
          </Box>
        </Modal>
      )}
      <Link onClick={(evt) => setShowModal(true)}>{hull.name}</Link>
    </Entry>
  );
}

export function SkillEntry({ logged_at, name, old_level, new_level }) {
  var variant = old_level > new_level ? "danger" : old_level === new_level ? "" : "success";

  return (
    <Entry time={logged_at} icon={faGraduationCap}>
      <span style={{ display: "inline-block", minWidth: "40%", marginRight: "0em" }}>{name}</span>
      <Badge variant={variant}>
        {old_level} -&gt; {new_level}
      </Badge>
    </Entry>
  );
}

export function NoteEntry({ logged_at, author, note }) {
  return (
    <Entry time={logged_at} icon={faClipboard}>
      <Content>
        <p>
          Note written by <strong>{author.name}</strong>
        </p>
        <ReactMarkdown>{note}</ReactMarkdown>
      </Content>
    </Entry>
  );
}
