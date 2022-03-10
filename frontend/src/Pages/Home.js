import { Content } from "../Components/Page";
import { NavLink } from "react-router-dom";
import { NavButton } from "../Components/Form";

export function Home() {
  return (
    <>
      <Content>
        <h2>Welcome to The Ditanian Fleet</h2>
        <p>
          Hello capsuleers, we would like to introduce you to the EVE Online incursion community
          called The Ditanian Fleet (TDF). We are a new-bro friendly group where all are welcome. We
          have affordable starter fits, and we can help make you space rich, all we ask in return is
          you follow our upgrade policy to help the community excel and follow the rules! We exclude
          pilots that have a previous history of ganking, and we have a no tolerance policy for
          racism, sexism or anti-social behaviour.
        </p>
        <p>
          The Ditanian Fleet is an armor doctrine incursion community. We run Vanguards (10 person),
          Assaults (20 person), and Headquarters (40 person) Incursion sites. We have fleet
          commanders from all over the world, so you should be able to join a fleet nearly 24/7.
        </p>
        <p>
          Check out our <NavLink to="/guide">Guides</NavLink> section for all the information you
          need to get started, see <NavLink to="/guide/newbro">new-bro guide</NavLink>,{" "}
          <NavLink to="/guide/xup">first fleet guide</NavLink> etc, also join the in-game chat
          channel <em>TDF-Official</em>, where you will find the mailing lists for fits and other
          usual information in the MOTD (message of the day), we look forward to flying with you!
        </p>
        <h3>Why Fly TDF?</h3>
        <ul>
          <li>
            Armor fleets are far safer, as your tank is passive and thus not cap dependent. If you
            get neuted your tank will not turn off, this gives you that extra bit of room for error
            should you need it.
          </li>
          <li>
            With our low slots being used for tanking, the mid slots on our ships are free for
            damage application mods such as webifiers and tracking computers, giving us great damage
            application.
          </li>
          <li>
            Our upgrade policy ensures that everyone in the fleet is constantly improving and
            contributing to that ever-important factor, your ISK per hour.
          </li>
          <li>
            We provide peace of mind with our SRP (ship replacement program), so should you lose
            your ship due to logi or FC error, you will be reimbursed.
          </li>
        </ul>
        <h3>What are Incursions?</h3>
        <p>
          Incursions are automated events introduced with the Incursion expansion in which the NPC
          faction known as the Sansha&apos;s Nation, led by Sansha Kuvakei, invade space in an
          attempt to conquer it for themselves. Capsuleers must fight off Sansha&apos;s forces in
          order to return the contested space back to an area which can be safely occupied.
        </p>
        <p>
          Incursions are high-end PvE fleet content, well above that of regular level four missions,
          where you can earn upwards of 200mil ISK/h on average. The introduction of incursions to
          the game added some much-needed fleet content in highsec space. It also gives people a
          very controlled environment to train up their skills as a logistics pilot, as well as
          giving people a feel for organized fleets. Incursion fleets rely on buffers and resists
          supported by logistics ships in order to survive. The NPCs you face in incursions use
          electronic warfare, capacitor warfare as well as playing on speed and signature to their
          advantage and this helps to teach you many of the ingame mechanics you may face.
        </p>
      </Content>
      <NavButton variant={"secondary"} to={`/legal`}>
        Legal
      </NavButton>
    </>
  );
}
