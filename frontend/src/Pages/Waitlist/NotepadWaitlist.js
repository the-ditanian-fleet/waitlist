import { Content } from "../../Components/Content";
import { Textarea } from "../../Components/Form";
import _ from "lodash";

function waitlistToFormatted(waitlist) {
  return waitlist.waitlist
    .map((entry) => {
      var charactersArray = [];
      var charactersMap = {};
      if (!entry.character) {
        return "";
      }
      _.forEach(entry.fits, (fit) => {
        if (!fit.character) {
          return;
        }
        var thisChar;
        if (!(fit.character.id in charactersMap)) {
          thisChar = { character: fit.character, fits: [] };
          charactersArray.push(thisChar);
          charactersMap[fit.character.id] = thisChar;
        } else {
          thisChar = charactersMap[fit.character.id];
        }

        thisChar.fits.push(fit);
      });

      return charactersArray
        .map((charData) => {
          var charName = `<a href="showinfo:1377//${charData.character.id}">${charData.character.name}</a>`;
          var fits = charData.fits.map((fit) => {
            const approval = fit.approved ? "" : ", CHECK FIT";
            return `${fit.category} (${fit.hull.name}${approval})`;
          });
          return charName + " " + fits.join(", ");
        })
        .join(" | ");
    })
    .join("\n");
}

export function NotepadWaitlist({ waitlist }) {
  return (
    <Content>
      <h2>Notepad waitlist</h2>
      <p>
        <strong>What is this?!</strong> When ESI is having trouble, the Invite button may not always
        work. To invite manually, or to switch to a channel-based waitlist, you can copy the
        existing waitlist into a notepad or channel MOTD by copying the code below. It will make the
        names linkable so that they can be invited by dragging into the fleet composition.
      </p>
      <Textarea readOnly style={{ width: "100%" }} rows="15">
        {waitlistToFormatted(waitlist)}
      </Textarea>
    </Content>
  );
}
