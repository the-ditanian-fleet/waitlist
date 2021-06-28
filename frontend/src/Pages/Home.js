import { Content } from "../Components/Page";
import { NavLink } from "react-router-dom";

export function Home() {
  return (
    <Content>
      <h2>Welcome to The Ditanian Fleet</h2>
      <p>
        Hello capsuleers, we would like to introduce you to the incursion community called The
        Ditanian Fleet (TDF). We are a new-bro friendly group where anyone is welcome. We have
        affordable starter fits, and we can help make you space rich, all we ask in return is you
        follow our upgrade policy to help the community excel and follow the rules! We exclude any
        pilot that has previous history of ganking, and we have a no tolerance policy for racism,
        sexism or anti-social behaviour.
      </p>
      <p>
        The Ditanian Fleet is an armor doctrine incursion community. We run Vanguards (10 person),
        Assaults (20 person), and Headquarters (40 person) Incursion sites. We have fleet commanders
        from all over the world, so you should be able to join a fleet nearly 24/7.
      </p>
      <p>
        Check out our <NavLink to="/guide">Guides</NavLink> section for all the information you need
        to get started, see <NavLink to="/guide/newbro">new-bro guide</NavLink>,{" "}
        <NavLink to="/guide/xup">first fleet guide</NavLink> etc, and also join the in-game chat
        channel <em>TDF-Official</em>, you will find the mailing lists for fits and other usual
        information in the MOTD (message of the day), we look forward to flying with you!
      </p>
      <h3>Armor Vs Shields</h3>
      <p>
        Unsure about joining an Armor fleet due to your skills being geared towards shield tanking?
        Here are just some advantages an Armor fleet has over a shield fleet:
      </p>
      <ul>
        <li>
          Armor fleets are far safer, as your tank is not cap dependent. So, if you get neuted out
          by an Outuni NPC your tank will not turn off, this means your much safer if you end up in
          sticky situation. We also use the Nestor battleship which is equal to two conventional
          tech 2 logistic cruisers and has the ability to allow you to refit your ship on the fly.
        </li>
        <li>
          With our low slots being used for tanking, the mid slots on our ships are free for damage
          application mods such as webifiers and tracking computers, giving us much better damage
          application.
        </li>
      </ul>
      <h3>What are Incursions?</h3>
      <p>
        Incursions are automated events introduced with the Incursion expansion in which the NPC
        faction known as the Sansha&apos;s Nation, led by Sansha Kuvakei, invade space in an attempt
        to conquer it for themselves. Capsuleers must fight off Sansha&apos;s forces in order to
        return the contested space back into an area which can be safely occupied.
      </p>
      <p>
        Incursions are high-end PvE fleet content, well above that of regular level four missions.
        The introduction of incursions to the game added some much-needed fleet content in highsec
        space. It also gives people a very controlled environment to train up their skills as a
        logistics pilot, as well as giving people a feel for organized fleets. Incursion fleets rely
        on buffers and resists supported by logistics ships in order to survive. The NPCs you face
        in incursions use electronic warfare, capacitor warfare as well as playing on speed and
        signature to their advantage.
      </p>
    </Content>
  );
}
