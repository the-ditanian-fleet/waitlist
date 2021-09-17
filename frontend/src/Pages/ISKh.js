import React from "react";
import varint from "varint";
import { Buffer } from "buffer";
import { Textarea, NavButton } from "../Components/Form";
import { Table, TableHead, TableBody, Row, Cell, CellHead } from "../Components/Table";
import { PageTitle } from "../Components/Page";
import { useLocation } from "react-router";
import { formatDatetime, formatDuration } from "../Util/time";
import { formatNumber } from "../Util/number";
import _ from "lodash";
import styled from "styled-components";

function encodeArray(numbers) {
  var buffer = [];
  for (const number of numbers) {
    varint.encode(Math.round(number), buffer, buffer.length);
  }

  // Add a checksum byte with a simple xor
  var check = 85;
  for (const byte of buffer) {
    check ^= byte;
  }
  buffer.push(check);

  // Encode base64
  buffer = Buffer.from(buffer);
  const encoded = buffer
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
  return encoded;
}

function decodeString1(encoded) {
  var buffer = Buffer.from(encoded, "base64");
  var pos = 0;
  var check = 0;
  for (const byte of buffer) {
    check ^= byte;
  }
  if (check !== 85) {
    throw new Error("Checksum mismatch!");
  }

  var result = [];
  while (pos < buffer.byteLength - 1) {
    result.push(varint.decode(buffer, pos));
    pos += varint.decode.bytes;
  }
  return result;
}

function encodeData(input) {
  return (
    "1" +
    encodeArray([
      input.isk,
      input.lp,
      input.sites,
      input.startTime,
      input.endTime - input.startTime,
      input.minTime,
      input.maxTime,
      input.chars,
    ])
  );
}

function decodeData(encoded) {
  if (encoded[0] === "1") {
    const numbers = decodeString1(encoded.slice(1));
    return {
      isk: numbers[0],
      lp: numbers[1],
      sites: numbers[2],
      startTime: numbers[3],
      endTime: numbers[3] + numbers[4],
      minTime: numbers[5],
      maxTime: numbers[6],
      chars: numbers[7],
    };
  } else {
    throw new Error("Cannot decode input");
  }
}

function createPayoutTable() {
  var result = {};
  for (const [siteType, payout, lp, normalGrid] of [
    ["Mothership (highsec)", 63000000, 14000, 80],
    ["HQ (highsec)", 31500000, 7000, 40],
    ["AS (highsec)", 18200000, 3500, 20],
    ["VG (highsec)", 10395000, 1400, 10],
  ]) {
    for (var overgrid = 0; overgrid < 11; overgrid++) {
      const payoutFactor = 1 - 0.0725 * overgrid - 0.0025 * overgrid ** 2;
      const thisPayout = Math.round(payout * payoutFactor);
      if (result[thisPayout]) {
        throw new Error("Two sites give the same payout?!");
      }

      result[thisPayout] = {
        siteType,
        payout: thisPayout,
        lp: Math.round(lp * payoutFactor),
        normalPayout: payout,
        normalLp: lp,
        onGrid: overgrid ? normalGrid + overgrid : null,
      };
    }
  }
  return result;
}

const PAYOUTS = createPayoutTable();

function parseWallet(input) {
  var lines = [];

  for (const line of input.split("\n")) {
    var [datetime, origin, value, _balance, description] = line.split(/\t|\s{2,}/); // eslint-disable-line
    if (!origin || !description || !value) {
      continue;
    }

    if (!value.match(/ISK/)) {
      continue;
    }
    if (!(origin.match(/reward payout/i) && description.match(/concord/i))) {
      continue;
    }

    value = value.replace(/[.,]\d{2} /, " "); // cents
    value = value.replaceAll(/[.,]/g, "");
    value = Math.round(parseFloat(value));

    const [date, time] = datetime.split(/ /);
    const dtStr = `${date.replaceAll(".", "-")}T${time}Z`;
    const dtObj = new Date(dtStr);

    lines.push({
      time: dtObj,
      value,
    });
  }

  lines = _.sortBy(lines, ["time", "value"]);
  var lastTime = null;
  var chars = 1;
  var siteTimes = [];
  var result = {
    isk: 0,
    lp: 0,
    sites: 0,
    chars: 1,
    raw: [],
  };
  for (const entry of lines) {
    if (!lastTime) {
      lastTime = entry.time;
      result.sites += 1;
    } else if (lastTime.getTime() !== entry.time.getTime()) {
      siteTimes.push((entry.time.getTime() - lastTime.getTime()) / 1000);
      lastTime = entry.time;
      chars = 1;
      result.sites += 1;
    } else {
      // Completed at the same time? It's an alt!
      chars += 1;
      if (result.chars < chars) {
        result.chars = chars;
      }
    }

    result.isk += entry.value;

    const payout = PAYOUTS[entry.value];
    if (payout) {
      result.lp += payout.lp;
    }

    result.raw.push({
      time: entry.time.getTime() / 1000,
      isk: entry.value,
      lp: payout ? payout.lp : null,
      onGrid: payout ? payout.onGrid : null,
    });
  }

  if (siteTimes.length < 1) {
    return null;
  }

  result.minTime = Math.min(...siteTimes);
  result.maxTime = Math.max(...siteTimes);
  result.startTime = Math.min(...result.raw.map((row) => row.time));
  result.endTime = Math.max(...result.raw.map((row) => row.time));

  return result;
}

export function ISKhCalc() {
  const [input, setInput] = React.useState("");
  const parsed = parseWallet(input);
  const dataStr = parsed ? encodeData(parsed) : null;

  return (
    <>
      <PageTitle>ISK/h calculator</PageTitle>
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1, padding: "0.5em" }}>
          <em>
            Go to your in-game wallet, select all incursion payouts, and hit Ctrl-C. Then, paste
            them here. Note: this calculator currently only works for English EVE clients.
          </em>
          <Textarea
            value={input}
            onChange={(evt) => setInput(evt.target.value)}
            rows="10"
            style={{ width: "100%" }}
          />
          <div style={{ padding: "1em" }}>
            <ResultDisplay dataStr={dataStr} />
          </div>
        </div>
        {parsed && (
          <div style={{ flex: 2, padding: "0.5em" }}>
            <Table fullWidth>
              <TableHead>
                <Row>
                  <CellHead>Time</CellHead>
                  <CellHead>ISK</CellHead>
                  <CellHead>LP</CellHead>
                  <CellHead>On grid</CellHead>
                </Row>
              </TableHead>
              <TableBody>
                {parsed.raw.map((row, i) => (
                  <Row key={i}>
                    <Cell>{formatDatetime(new Date(row.time * 1000))}</Cell>
                    <Cell>{formatNumber(row.isk)}</Cell>
                    <Cell>{formatNumber(row.lp)}</Cell>
                    <Cell>{formatNumber(row.onGrid)}</Cell>
                  </Row>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}

export function ISKh() {
  const queryParams = new URLSearchParams(useLocation().search);
  const dataStr = queryParams.get("d") || "";

  return (
    <>
      <div>
        <NavButton exact to="/isk-h/calc">
          Calculator
        </NavButton>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <ResultDisplay dataStr={dataStr} />
      </div>
    </>
  );
}

const ResultDOM = styled.div`
  ${(props) => `
    max-width: 500px;
    border-radius: 10px;
    text-align: center;
    border: solid 1px ${props.theme.colors.accent4};

    > h1 {
      margin-top: 0.5em;
      font-size: 2em;
      font-weight: 600;
      filter: drop-shadow(0px 1px 1px ${props.theme.colors.shadow});
    }
    > h2 {
      font-size: 1.5em;
      font-weight: 600;
    }
    > * {
      padding-left: 1em;
      padding-right: 1em;
    }

    hr {
      border: 0;
      margin-top: 0.75em;
    }
    p:last-child {
      border-top: solid 1px ${props.theme.colors.accent3};
      font-size: 0.8em;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }
    a {
      color: ${props.theme.colors.text};
      text-decoration: none;
    }
  `}
`;

function ResultDisplay({ dataStr }) {
  if (!dataStr) {
    return null;
  }
  var decoded;
  try {
    decoded = decodeData(dataStr);
  } catch (e) {
    return <em>Failed to load results</em>;
  }

  const duration = decoded.endTime - decoded.startTime;
  const iskH = Math.round(decoded.isk / (duration / 3600) / (decoded.sites / (decoded.sites - 1)));
  const url = window.location.origin + `/isk-h?d=${dataStr}`;

  return (
    <>
      <ResultDOM>
        <h1>{formatNumber(iskH)} ISK/h</h1>
        <h2>
          {formatNumber(decoded.isk)} ISK + {formatNumber(decoded.lp)} LP
        </h2>
        <hr />
        <p>{formatNumber(decoded.sites)} sites completed</p>
        {decoded.chars > 1 && (
          <p>{formatNumber(decoded.chars)} characters included in payout calculation</p>
        )}
        <hr />
        <p>
          {formatDuration(decoded.minTime)} ~ {formatDuration(decoded.maxTime)} (average{" "}
          {formatDuration(Math.round(duration / (decoded.sites - 1)))})
        </p>
        <p>
          {formatDatetime(new Date(decoded.startTime * 1000))} ++ {formatDuration(duration)}
        </p>
        <p>
          <a href={url}>{url}</a>
        </p>
      </ResultDOM>
    </>
  );
}
