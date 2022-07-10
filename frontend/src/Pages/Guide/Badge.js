import React from "react";
import { Box } from "../../Components/Box";
import { Modal } from "../../Components/Modal";
import { Title, Content } from "../../Components/Page";
import styled from "styled-components";
import { ImplantOut, BadgeDOM } from "../Fits/FittingSortDisplay";
import { NavButton } from "../../Components/Form";

//import { Shield, tagBadges } from "../../Components/Badge";

const BadgeDisplay = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const ModalDOM = styled.div`
  width: 480px;
  @media (max-width: 480px) {
    width: 100%;
  }
`;
ModalDOM.Title = styled.div`
  border-bottom: 3px solid;
  padding-bottom: 5px;
  margin-bottom: 1em;
  display: flex;
  border-color: ${(props) => props.theme.colors.accent3};
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
            <ModalDOM>
              <ModalDOM.Title>
                <div>
                  <img
                    src={BadgeImages[img].default}
                    alt={name}
                    style={{ width: "1.8em", marginRight: "0.5em" }}
                  />
                </div>
                <Title>{name} &nbsp;</Title>
              </ModalDOM.Title>
              {children}
            </ModalDOM>
          </Box>
        </Modal>
      ) : null}

      <BadgeDOM variant={"secondary"}>
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
          there if you wish to upgrade further.
        </p>

        <p>
          Badge assignment on teamspeak and on the website (for specialist badges) can be done by
          any FC.
        </p>
        <Title>Implant Badges</Title>
        <BadgeDisplay>
          <ImplantOut />
        </BadgeDisplay>
        <Title>Elite Badge</Title>
        <BadgeDisplay>
          <BadgeButton name="Elite" img={"./e.png"}>
            Requirements to get elite badge are: Elite fitting or better WITH implants 1-10 and all
            skills to elite or better for the applicable ship.
            <br />
            <br />
            <NavButton variant={"secondary"} to={`/skills`}>
              Check your Skills
            </NavButton>
          </BadgeButton>
          <BadgeButton name="Elite Gold" img={"./egold.png"}>
            Requirements to get elite gold badge are: Elite badge pre-requisites plus all skills to
            elite gold for the applicable ship. <br />
            <br />
            <NavButton variant={"secondary"} to={`/skills`}>
              Check your Skills
            </NavButton>
          </BadgeButton>
        </BadgeDisplay>
        <Title>Specialist Badges</Title>
        <BadgeDisplay>
          <BadgeButton name="Logi Specialist" img={"./l.png"}>
            Permitted to fly Nestor Logistics.
            <br />
            Requirements to get logistics specialist badge are:
            <br />
            <br />
            <Content>
              <ul>
                <li>Elite skills for a Nestor</li>
                <li>Minimum 20h of logged logi cruiser hours</li>
                <li>
                  Completing Nestor &quot;training&quot; of which 3 Full HQ FC +1&apos;s are
                  required
                </li>
              </ul>
            </Content>
          </BadgeButton>
          <BadgeButton name="Bastion Specialist" img={"./bastion.png"}>
            Requirements to get bastion specialist badge are: <br />
            <br />
            <Content>
              <ul>
                <li>Elite badge pre-requisites for a Bastion-capable ship</li>
                <li>Abyssal damage modules with a minimum of 29% DPS bonus</li>
                <li>Marauders skill to 5</li>
                <li>
                  abyssal plate with minimum 6k RAW armor HP for single platefits, & 12k RAW
                  combined HP on dual plate fits.
                </li>
              </ul>
            </Content>
          </BadgeButton>
          <BadgeButton name="Web Specialist" img={"./wv.png"}>
            Requirements to get web specialist badge are: <br />
            <br />
            <Content>
              <ul>
                <li>Elite badge pre-requisites for a Vindicator</li>
                <li>Abyssal webifiers with minimum of 16km base range & 62% base strength bonus</li>
                <li>Gallente BS skill to 5.</li>
              </ul>
            </Content>
          </BadgeButton>
        </BadgeDisplay>
        <Title>FC Badges</Title>
        <BadgeDisplay>
          <BadgeButton name="Training FC" img={"./trainee.png"}>
            Permitted to use TDF comms to run fleets and to take a fleet into sites with SRP cover
            provided an FC with the badge relevant to the site is in the fleet. <br />
            <br />
            Find out more about becoming Training FC here:
            <br />
            <NavButton variant={"secondary"} to={`/guide/fctraining`}>
              FC Training Program
            </NavButton>
          </BadgeButton>
          <BadgeButton name="PHQ FC" img={"./hqp.png"}>
            Permitted to use TDF comms to run fleets and to take a fleet into Headquarters, Assault
            and Vanguard sites with SRP cover.
            <br />
            <br /> <b> Cannot take training nestors or do backseats for Trainee FC&apos;s.</b>
          </BadgeButton>
          <BadgeButton name="VG FC" img={"./vg.png"}>
            Permitted to use TDF comms to run fleets and to take a fleet into Vanguard sites with
            SRP cover.
          </BadgeButton>
          <BadgeButton name="Assault FC" img={"./as.png"}>
            Permitted to use TDF comms to run fleets and to take a fleet into Assault and Vanguard
            sites with SRP cover.
          </BadgeButton>
          <BadgeButton name="HQ FC" img={"./hq.png"}>
            Permitted to use TDF comms to run fleets and to take a fleet into Headquarters, Assault
            and Vanguard sites with SRP cover.
          </BadgeButton>
          <BadgeButton name="FC Trainer" img={"./trainer.png"}>
            Permitted to use TDF comms to run fleets and to take a fleet into Headquarters, Assault
            and Vanguard sites with SRP cover. <br />
            <br />
            Can promote Trainee FC&apos;s to full HQ/AS/VG tags and conduct van/bus fleets for
            trainee FC&apos;s.
          </BadgeButton>
          <BadgeButton name="Council" img={"./c.png"}>
            Member of the TDF council, which makes decisions that impact the community. <br />
            <br />
            Permitted to use TDF comms to run fleets and to take a fleet into Headquarters, Assault
            and Vanguard sites with SRP cover. <br />
            <br />
            Can promote Full FC&apos;s to FC Trainer and Trainee FC&apos;s to full HQ/AS/VG tags and
            conduct van/bus fleets for trainee FC&apos;.
          </BadgeButton>
        </BadgeDisplay>
        <Title>Other</Title>
        <BadgeDisplay>
          <BadgeButton name="Starter Pilot" img={"./starter.png"}>
            Pilot is new to TDF & Incursions and/or has starter skills.
          </BadgeButton>
          <BadgeButton name="Backchannel" img={"./b.png"}>
            Pilot has access to the back comms channel on TeamSpeak.
          </BadgeButton>
        </BadgeDisplay>
      </Content>
    </>
  );
}
