import React from "react";
import { Box } from "../../Components/Box";
import { Modal } from "../../Components/Modal";
import { Title, Content } from "../../Components/Page";
import styled from "styled-components";
import { ImplantOut } from "../Fits/FittingSortDisplay";
import { NavButton, InputGroup } from "../../Components/Form";
import { InfoNote } from "../../Components/NoteBox";

import { BadgeDOM, BadgeModal } from "../../Components/Badge";

const BadgeDisplay = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const BadgeImages = {};
function importAll(r) {
  r.keys().forEach((key) => (BadgeImages[key] = r(key)));
}
importAll(require.context("./badges", true, /\.(jpg|png)$/));

function BadgeButton({ name, img, children }) {
  const [modalOpen, setModalOpen] = React.useState(false);
  return (
    <>
      {modalOpen ? (
        <Modal open={true} setOpen={setModalOpen}>
          <Box>
            <BadgeModal>
              <BadgeModal.Title>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <img
                    src={BadgeImages[img].default}
                    alt={name}
                    style={{ width: "1.8em", marginRight: "0.5em" }}
                  />
                </div>
                <Title>{name} &nbsp;</Title>
              </BadgeModal.Title>
              {children}
            </BadgeModal>
          </Box>
        </Modal>
      ) : null}

      <BadgeDOM>
        <a onClick={(evt) => setModalOpen(true)}>
          <BadgeDOM.Content>
            <BadgeDOM.Icon>
              <img src={BadgeImages[img].default} alt={name} style={{ width: "1.5em" }} />
            </BadgeDOM.Icon>
            {name}
          </BadgeDOM.Content>
        </a>
      </BadgeDOM>
    </>
  );
}

export function BadgeData() {
  return (
    <>
      <Content style={{ marginBottom: "2em" }}>
        <h1>Badges</h1>
        <h2>What are badges for?</h2>
        <p>
          {" "}
          Badges are a tool mostly for FCs to quickly see what the fleet composition looks like and
          to check a pilots fitting meets requirements. To join Elite fleets you must have the Elite
          badge on TS and on the waitlist. Specialist badges are not required for any pilot but are
          there if you wish to upgrade further, specialist badges come with perks of priority invite
          to elite fleets.
        </p>

        <p>
          Badge assignment on teamspeak and on the website (for specialist badges) can be done by
          any FC.
        </p>
        <Title>Implant Badges</Title>
        <BadgeDisplay>
          <ImplantOut />
        </BadgeDisplay>
        <Title>Tier Badge</Title>
        <BadgeDisplay>
          <BadgeButton name="Starter Pilot" img={"./starter.png"}>
            Pilot is new to TDF & Incursions. <br />
            To get rid of the starter tag you need to do the following:
            <br />
            <br />
            <Content>
              <ul>
                <li>Basic fit or better</li>
                <li>Basic tier skills or better for the applicable ship</li>
              </ul>
            </Content>
            <br />
            <InputGroup>
              <NavButton to={`/skills`}>Check your skills</NavButton>
              <NavButton to={`/guide/upgrade`}>Upgrade guide & policy</NavButton>
            </InputGroup>
          </BadgeButton>
          <BadgeButton name="Elite" img={"./e.png"}>
            <b>Allows you to join elite fleets</b>
            <br />
            This badge is a requirement in accordance with our upgrade policy
            <br />
            Requirements to aquire the elite badge are:
            <br />
            <br />
            <Content>
              <ul>
                <li>Hybrid or Ascendancy implant set badge</li>
                <li>Elite fit matching your implant set</li>
                <li>Elite skills or better for the applicable ship</li>
              </ul>
            </Content>
            <InfoNote>You must be scanned by an FC to aquire the teamspeak badge</InfoNote>
            <br />
            <InputGroup>
              <NavButton to={`/skills`}>Check your skills</NavButton>
              <NavButton to={`/guide/upgrade`}>Upgrade guide & policy</NavButton>
            </InputGroup>
          </BadgeButton>
          <BadgeButton name="Elite Gold" img={"./egold.png"}>
            This badge is optional
            <br />
            Requirements to get elite gold badge are: <br />
            <br />
            <Content>
              <ul>
                <li>Elite badge for the applicable ship</li>
                <li>Elite gold skills or better for the applicable ship</li>
              </ul>
            </Content>
            <br />
            <NavButton to={`/skills`}>Check your skills</NavButton>
          </BadgeButton>
        </BadgeDisplay>
        <Title>Specialist Badges</Title>
        <BadgeDisplay>
          <BadgeButton name="Logi Specialist" img={"./l.png"}>
            <b>Permitted to fly Nestor Logistics</b>
            <br />
            Requirements to get logistics specialist badge are:
            <br />
            <br />
            <Content>
              <ul>
                <li>Elite skills for Nestor</li>
                <li>Minimum of 20 hours in a logi cruiser</li>
                <li>Complete the Nestor training where three full HQ FC +1&apos;s are required</li>
              </ul>
            </Content>
            <InfoNote>
              If you haven&apos;t acquired the badge yet, make sure to let the fc know you are a
              Training Nestor!
            </InfoNote>
            <br />
            <InputGroup>
              <NavButton to={`/skills?ship=Nestor`}>Check your skills</NavButton>
              <NavButton to={`/pilot`}>Logged cruiser hours</NavButton>
            </InputGroup>
          </BadgeButton>
          <BadgeButton name="Bastion Specialist" img={"./bastion.png"}>
            <b>Gives priority invite to elite fleet</b>
            <br />
            This badge is optional
            <br />
            Requirements to get bastion specialist badge are: <br />
            <br />
            <Content>
              <ul>
                <li>Elite badge for a Bastion-capable ship</li>
                <li>Marauders skill to level 5</li>
                <li>Gun specialization to level 5</li>
                <li>Abyssal damage modules with a minimum of 29% DPS bonus</li>
                <li>
                  Abyssal plate: <br />
                  6k RAW armor HP for single plate fits <br />
                  12k RAW combined armor HP on dual plate fits
                </li>
              </ul>
            </Content>
            <InfoNote>
              Contact an FC to verify your abyssals and apply the badge on TS and on the website.
              Badge can be viewed on pilot page.
            </InfoNote>
          </BadgeButton>
          <BadgeButton name="Web Specialist" img={"./wv.png"}>
            <b>Gives priority invite to elite fleet</b>
            <br />
            This badge is optional
            <br />
            Requirements to get web specialist badge are: <br />
            <br />
            <Content>
              <ul>
                <li>Elite badge pre-requisites for a Vindicator</li>
                <li>Gallente Battleship skill level 5</li>
                <li>Abyssal MWD with 560% velocity bonus</li>
                <li>
                  Abyssal webifiers with minimum: <br /> 16km optimal range <br />
                  62% velocity bonus reduction
                </li>
              </ul>
            </Content>
            <InfoNote>
              Contact an FC to verify your abyssals and apply the badge on TS and on the website.
              Badge can be viewed on pilot page.
            </InfoNote>
          </BadgeButton>
        </BadgeDisplay>
        <Title>FC Badges</Title>
        <BadgeDisplay>
          <BadgeButton name="Training FC" img={"./trainee.png"}>
            Permitted to use TDF comms to run fleets. Only allowed to take a fleet into sites with
            SRP cover provided an FC with the badge relevant to the site is in the fleet. <br />
            <br />
            <p style={{ marginBottom: "0.5em" }}>Find out more about becoming a trainee FC here:</p>
            <NavButton to={`/guide/fctraining`}>FC Training Program</NavButton>
          </BadgeButton>
          <BadgeButton name="PHQ FC" img={"./hqp.png"}>
            Permitted to use TDF comms to run fleets and to take a fleet into Headquarters, Assault
            and Vanguard sites with SRP cover.
            <br />
            <br />
            <InfoNote>Cannot take training nestors or do backseats for Trainee FC&apos;s</InfoNote>
          </BadgeButton>
          <BadgeButton name="HQ FC" img={"./hq.png"}>
            Permitted to use TDF comms to run fleets and to take a fleet into Headquarters, Assault
            and Vanguard sites with SRP cover.
          </BadgeButton>
          <BadgeButton name="FC Trainer" img={"./trainer.png"}>
            Permitted to use TDF comms to run fleets and to take a fleet into Headquarters, Assault
            and Vanguard sites with SRP cover. <br />
            <br />
            Can promote Trainee FC&apos;s to full FC tags and conduct van/bus fleets for
            trainee FC&apos;s.
          </BadgeButton>
          <BadgeButton name="Council" img={"./c.png"}>
            Member of the TDF council, which makes decisions that impact the community. <br />
            <br />
            Permitted to use TDF comms to run fleets and to take a fleet into Headquarters, Assault
            and Vanguard sites with SRP cover. <br />
            <br />
            Can promote Full FC&apos;s to FC Trainer and Trainee FC&apos;s to full FC tags and
            conduct van/bus fleets for trainee FC&apos;s.
          </BadgeButton>
        </BadgeDisplay>
        <Title>Other</Title>
        <BadgeDisplay>
          <BadgeButton name="Backchannel" img={"./b.png"}>
            Pilot has access to the back comms on TeamSpeak.
          </BadgeButton>
          <BadgeButton name="Retired Logi" img={"./rl.png"}>
            <b>Logi Specialist who had their badge revoked due to three months of inactivity.</b>
            <br />
            Requirements to reacquire logistics specialist badge are:
            <br />
            <br />
            <Content>
              <ul>
                <li>Fit &amp; skills still being valid</li>
                <li>One full HQ FC +1</li>
              </ul>
            </Content>
          </BadgeButton>
        </BadgeDisplay>
      </Content>
    </>
  );
}
