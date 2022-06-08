import { NotepadWaitlist } from "./NotepadWaitlist";

import styled from "styled-components";
import { XCard } from "./XCard";
import _ from "lodash";

const CategoryHeadingDOM = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  border-bottom: solid 2px ${(props) => props.theme.colors.accent2};
  > h2 {
    font-size: 1.2em;
    font-weight: 600;
    padding: 0.2em;
  }
  > div {
    display: flex;
    opacity: 0.7;
    > span {
      flex: 1;
      display: inline-flex;
      align-items: center;
      padding: 0.2em;
      img {
        width: 1.5em;
        height: 1.5em;
        border-radius: 2px;
        margin-right: 0.2em;
      }
    }
  }
`;

const CatHeadingSmall = styled(CategoryHeadingDOM)`
  border-radius: 5px;
  border: solid 1px ${(props) => props.theme.colors.accent2};
  padding: 0em 0.2em;
  > h2 {
    font-size: initial;
    font-weight: initial;
  }
`;

function CategoryHeading({ name, fleetComposition, altCol = true }) {
  if (!(fleetComposition && fleetComposition.members)) {
    return (
      <>
        {!altCol && name === "Alts" ? null : (
          <CategoryHeadingDOM>
            <h2>{name}</h2>
          </CategoryHeadingDOM>
        )}
      </>
    );
  }

  const categoryMembers = _.filter(
    fleetComposition.members,
    (member) => member.wl_category === name
  );
  if (!altCol && name === "Alts" && categoryMembers.length === 0) {
    return null;
  }

  var shipInfo = {};
  var shipCounts = {};
  _.forEach(categoryMembers, (member) => {
    shipInfo[member.ship.id] = member.ship;
    if (!shipCounts[member.ship.id]) shipCounts[member.ship.id] = 0;
    shipCounts[member.ship.id]++;
  });
  var shipCountsArr = _.map(shipCounts, (count, id) => [count, shipInfo[id]]);
  shipCountsArr.sort((a, b) => a[0] - b[0]);
  return (
    <>
      {!altCol && name === "Alts" ? (
        <CatHeadingSmall>
          <HeadingStyle name={name} shipCountsArr={shipCountsArr} />
        </CatHeadingSmall>
      ) : (
        <CategoryHeadingDOM>
          <HeadingStyle name={name} shipCountsArr={shipCountsArr} />
        </CategoryHeadingDOM>
      )}
    </>
  );
}

function HeadingStyle({ name, shipCountsArr }) {
  return (
    <>
      <h2>{name}</h2>
      <div>
        {shipCountsArr.map(([count, info]) => (
          <span key={info.id}>
            <img src={`https://images.evetech.net/types/${info.id}/icon?size=64`} alt={info.name} />
            {count}
          </span>
        ))}
      </div>
    </>
  );
}

const ColumnWaitlistDOM = styled.div`
  display: flex;
  @media (max-width: 480px) {
    flex-wrap: wrap;
    width: 100%;
  }
`;
ColumnWaitlistDOM.Category = styled.div`
  flex-grow: 1;
  flex-basis: 0;
  padding: 0.5em;

  > div {
    margin-bottom: 1.5em;
  }
  @media (max-width: 480px) {
    width: 100%;
    flex-basis: unset;
  }
`;

function ColumnWaitlist({ waitlist, onAction, fleetComposition, altCol }) {
  var categories = [];
  var categoryIndex = {};
  _.forEach(waitlist.categories, (category, i) => {
    if (!(category === "Alts" && !altCol)) {
      categories.push([category, []]);
      categoryIndex[category] = i;
    }
  });
  _.forEach(waitlist.waitlist, (entry) => {
    _.forEach(entry.fits, (fit) => {
      const categoryI = categoryIndex[altCol && fit.is_alt ? "Alts" : fit.category];
      categories[categoryI][1].push(
        <div key={fit.id}>
          <XCard entry={entry} fit={fit} onAction={onAction} />
        </div>
      );
    });
  });
  return (
    <>
      <ColumnWaitlistDOM>
        {categories.map((category) => (
          <ColumnWaitlistDOM.Category key={category[0]}>
            <CategoryHeading name={category[0]} fleetComposition={fleetComposition} />
            {category[1]}
            {category[1].length ? null : <em>Nobody here!</em>}
          </ColumnWaitlistDOM.Category>
        ))}
      </ColumnWaitlistDOM>
    </>
  );
}

const CompactWaitlistDOM = styled.div`
  display: flex;
  flex-wrap: wrap;
  > div {
    padding: 0.5em;
  }
`;

function CompactWaitlist({ waitlist, onAction }) {
  var allCards = [];
  _.forEach(waitlist.waitlist, (entry) => {
    _.forEach(entry.fits, (fit) => {
      allCards.push(
        <div key={fit.id}>
          <XCard entry={entry} fit={fit} onAction={onAction} />
        </div>
      );
    });
  });

  return <CompactWaitlistDOM>{allCards}</CompactWaitlistDOM>;
}

const LinearWaitlistDOM = styled.div``;
LinearWaitlistDOM.Entry = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 1em;
  > div {
    padding: 0.5em;
  }
`;

function LinearWaitlist({ waitlist, onAction }) {
  return (
    <LinearWaitlistDOM>
      {waitlist.waitlist.map((entry) => (
        <LinearWaitlistDOM.Entry key={entry.id}>
          {entry.fits.map((fit) => (
            <div key={fit.id}>
              <XCard fit={fit} entry={entry} onAction={onAction} />
            </div>
          ))}
        </LinearWaitlistDOM.Entry>
      ))}
    </LinearWaitlistDOM>
  );
}

const MatrixWaitlistDOM = styled.table`
  width: 100%;
  table-layout: fixed;
  text-align: left;

  > thead > tr > th {
    width: 1%;
  }
  th,
  td {
    padding: 0.5em;
  }
`;

function MatrixWaitlist({ waitlist, onAction, fleetComposition }) {
  var categories = [];
  var categoryIndex = {};
  _.forEach(waitlist.categories, (category, i) => {
    categories.push([category, []]);
    categoryIndex[category] = i;
  });

  return (
    <MatrixWaitlistDOM>
      <thead>
        <tr>
          {categories.map((category) => (
            <th key={category[0]}>
              <CategoryHeading name={category[0]} fleetComposition={fleetComposition} />
            </th>
          ))}
        </tr>
        {waitlist.waitlist.map((entry) => {
          var byCategory = categories.map((cat) => []);
          _.forEach(entry.fits, (fit) => {
            byCategory[categoryIndex[fit.is_alt ? "Alts" : fit.category]].push(
              <div key={fit.id}>
                <XCard fit={fit} entry={entry} onAction={onAction} />
              </div>
            );
          });
          return (
            <tr key={entry.id}>
              {byCategory.map((fits, i) => (
                <td key={i}>{fits}</td>
              ))}
            </tr>
          );
        })}
      </thead>
    </MatrixWaitlistDOM>
  );
}

const RowWaitlistDOM = styled.div`
  overflow-x: auto;
`;
RowWaitlistDOM.Category = styled.div`
  padding: 0.5em 0.5em;
  display: flex;

  > div {
    margin: 0 0.75em;
  }
`;

function RowWaitlist({ waitlist, onAction, fleetComposition }) {
  var categories = [];
  var categoryIndex = {};
  _.forEach(waitlist.categories, (category, i) => {
    categories.push([category, []]);
    categoryIndex[category] = i;
  });
  _.forEach(waitlist.waitlist, (entry) => {
    _.forEach(entry.fits, (fit) => {
      const categoryI = categoryIndex[fit.is_alt ? "Alts" : fit.category];
      categories[categoryI][1].push(
        <div key={fit.id}>
          <XCard key={fit.id} entry={entry} fit={fit} onAction={onAction} />
        </div>
      );
    });
  });
  return (
    <>
      <RowWaitlistDOM>
        {categories.map((category) => (
          <div key={category[0]}>
            <CategoryHeading name={category[0]} fleetComposition={fleetComposition} />
            <RowWaitlistDOM.Category>
              {category[1]}
              {category[1].length ? null : <em>Nobody here!</em>}
            </RowWaitlistDOM.Category>
          </div>
        ))}
      </RowWaitlistDOM>
    </>
  );
}

export {
  ColumnWaitlist,
  MatrixWaitlist,
  CompactWaitlist,
  LinearWaitlist,
  RowWaitlist,
  NotepadWaitlist,
  CategoryHeading,
};
