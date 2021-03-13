import { NotepadWaitlist } from "./NotepadWaitlist";

import styled from "styled-components";
import { XCard } from "./XCard";
import _ from "lodash";

const ColumnWaitlistDOM = styled.div`
  display: flex;
  em {
    font-style: italic;
  }
`;
ColumnWaitlistDOM.Category = styled.div`
  flex-grow: 1;
  flex-basis: 0;
  padding: 0.5em;

  > h2 {
    font-size: 1.5em;
    margin-bottom: 0.5em;
  }
  > div {
    margin-bottom: 1.5em;
  }
`;

function ColumnWaitlist({ waitlist }) {
  var categories = [];
  var categoryIndex = {};
  _.forEach(waitlist.categories, (category, i) => {
    categories.push([category, []]);
    categoryIndex[category] = i;
  });
  _.forEach(waitlist.waitlist, (entry) => {
    _.forEach(entry.fits, (fit) => {
      const categoryI = categoryIndex[fit.category];
      categories[categoryI][1].push(
        <div key={fit.id}>
          <XCard entry={entry} fit={fit} />
        </div>
      );
    });
  });
  return (
    <>
      <ColumnWaitlistDOM>
        {categories.map((category) => (
          <ColumnWaitlistDOM.Category key={category[0]}>
            <h2>{category[0]}</h2>
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

function CompactWaitlist({ waitlist }) {
  var allCards = [];
  _.forEach(waitlist.waitlist, (entry) => {
    _.forEach(entry.fits, (fit) => {
      allCards.push(
        <div key={fit.id}>
          <XCard entry={entry} fit={fit} />
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

function LinearWaitlist({ waitlist }) {
  return (
    <LinearWaitlistDOM>
      {waitlist.waitlist.map((entry) => (
        <LinearWaitlistDOM.Entry key={entry.id}>
          {entry.fits.map((fit) => (
            <div key={fit.id}>
              <XCard fit={fit} entry={entry} />
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
    > h2 {
      font-size: 1.5em;
    }
  }
  th,
  td {
    padding: 0.5em;
  }
`;

function MatrixWaitlist({ waitlist }) {
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
              <h2>{category[0]}</h2>
            </th>
          ))}
        </tr>
        {waitlist.waitlist.map((entry) => {
          var byCategory = categories.map((cat) => []);
          _.forEach(entry.fits, (fit) => {
            byCategory[categoryIndex[fit.category]].push(
              <div key={fit.id}>
                <XCard fit={fit} entry={entry} />
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

  em {
    font-style: italic;
  }
  > div > h2 {
    padding: 0.333em 0 0 0.333em;
    font-size: 1.5em;
  }
`;
RowWaitlistDOM.Category = styled.div`
  padding: 0.5em 0.5em;
  display: flex;

  > div {
    margin: 0 0.75em;
  }
`;

function RowWaitlist({ waitlist }) {
  var categories = [];
  var categoryIndex = {};
  _.forEach(waitlist.categories, (category, i) => {
    categories.push([category, []]);
    categoryIndex[category] = i;
  });
  _.forEach(waitlist.waitlist, (entry) => {
    _.forEach(entry.fits, (fit) => {
      const categoryI = categoryIndex[fit.category];
      categories[categoryI][1].push(
        <div key={fit.id}>
          <XCard key={fit.id} entry={entry} fit={fit} />
        </div>
      );
    });
  });
  return (
    <>
      <RowWaitlistDOM>
        {categories.map((category) => (
          <div key={category[0]}>
            <h2>{category[0]}</h2>
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
};
