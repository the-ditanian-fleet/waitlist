import { Content } from "../../Components/Page";
import { NoteUI } from "./FittingSortDisplay";
import { ToastContext } from "../../contexts";
import { toaster } from "../../api";
import styled from "styled-components";
import React from "react";
import {
  CellHead,
  SmallCellHead,
  Table,
  TableHead,
  Row,
  TableBody,
  Cell,
} from "../../Components/Table";

const Yellow = styled.b`
  color:  #fc9936;
  &:hover:not(:disabled):not(.static) {
	cursor: pointer;
	color:  #ffad5c;
`;

export function ImplantTable({ type }) {
  const toastContext = React.useContext(ToastContext);
  var implants;
  if (type === "Hybrid") {
    implants = [
      "High-grade Amulet Alpha",
      "High-grade Amulet Beta",
      "High-grade Amulet Gamma",
      "High-grade Amulet Delta",
      "High-grade Amulet Epsilon",
    ];
  } else {
    implants = [
      "High-grade Ascendancy Alpha",
      "High-grade Ascendancy Beta",
      "High-grade Ascendancy Gamma",
      "High-grade Ascendancy Delta",
      "High-grade Ascendancy Epsilon",
    ];
  }
  return (
    <Content>
      <NoteUI variant={"danger"} width={"fit-content"}>
        {type === "Hybrid" ? (
          <p>Hybrid tagged fits require at least Amulet 1 - 5 to be flown. </p>
        ) : (
          <p>Can be used on all non-implant specific fits.</p>
        )}
      </NoteUI>
      <Table fullWidth>
        <TableHead>
          <Row>
            <SmallCellHead></SmallCellHead>
            <CellHead>ALL</CellHead>
            <CellHead>CQC</CellHead>
            <CellHead>SNIPER</CellHead>
            <CellHead>SPECIAL (not required)</CellHead>
          </Row>
        </TableHead>
        <TableBody>
          {implants.map((currentValue, index) => (
            <ImplantAllRow
              key={index}
              toast={toastContext}
              slot={index + 1}
              implant={currentValue}
            />
          ))}

          <Row>
            <Cell>
              <b>Slot 6</b>
            </Cell>
            {type === "Ascendancy" ? (
              <Cell>
                <CopyImplantText toast={toastContext} what={"WS-618"} /> higher warp speed or
                <br />
                <CopyImplantText toast={toastContext} what={"High-grade Ascendancy Omega"} /> if you
                have too much isk.
              </Cell>
            ) : (
              <Cell>
                <CopyImplantText toast={toastContext} what={"WS-618"} /> higher warp speed.
              </Cell>
            )}

            <Cell></Cell>
            <Cell></Cell>
            <Cell></Cell>
          </Row>

          <HardWires toastContext={toastContext} />
        </TableBody>
      </Table>
    </Content>
  );
}

function ImplantAllRow({ key, toast, slot, implant }) {
  return (
    <Row key={key}>
      <Cell>
        <b>Slot {slot}</b>
      </Cell>
      <Cell>
        <CopyImplantText toast={toast} what={implant} />
      </Cell>
      <Cell></Cell>
      <Cell></Cell>
      <Cell></Cell>
    </Row>
  );
}

function CopyImplantText({ toast, what }) {
  return (
    <Yellow
      onClick={(evt) => {
        CopyImplant(toast, what);
      }}
    >
      {what}
    </Yellow>
  );
}

function CopyImplant(toast, what) {
  toaster(
    toast,
    navigator.clipboard.writeText(what).then((success) => "Copied to clipboard")
  );
}

function HardWires({ toastContext }) {
  return (
    <>
      <Row>
        <Cell>
          <b>Slot 7</b>
        </Cell>
        <Cell>
          <CopyImplantText toast={toastContext} what={"Ogdin's Eye"} /> or
          <br />
          <CopyImplantText toast={toastContext} what={"MR-706"} /> better tracking
        </Cell>
        <Cell></Cell>
        <Cell></Cell>
        <Cell>
          <CopyImplantText toast={toastContext} what={"RA-706"} /> reps will use less cap, for logi
          only toon.
        </Cell>
      </Row>
      <Row>
        <Cell>
          <b>Slot 8</b>
        </Cell>
        <Cell>
          <CopyImplantText toast={toastContext} what={"EM-806"} /> more capacitor
        </Cell>
        <Cell></Cell>
        <Cell></Cell>
        <Cell>
          <CopyImplantText toast={toastContext} what={"MR-807"} /> higher webbing range, for
          vindicator only toon.
        </Cell>
      </Row>

      <Row>
        <Cell>
          <b>Slot 9</b>
        </Cell>
        <Cell>
          <CopyImplantText toast={toastContext} what={"RF-906"} /> higher rate of fire.
        </Cell>
        <Cell></Cell>
        <Cell></Cell>
        <Cell>
          <CopyImplantText toast={toastContext} what={"Pashan's Turret Customization Mindlink"} />{" "}
          if you have too much isk
        </Cell>
      </Row>
      <Row>
        <Cell>
          <b>Slot 10</b>
        </Cell>
        <Cell></Cell>
        <Cell>
          <CopyImplantText toast={toastContext} what={"LH-1006"} /> higher weapon damage
        </Cell>
        <Cell>
          <CopyImplantText toast={toastContext} what={"LE-1006"} /> higher weapon damage or <br />
          <CopyImplantText toast={toastContext} what={"Pashan's Turret Handling Mindlink"} /> if you
          have to much isk
        </Cell>
        <Cell>
          <CopyImplantText toast={toastContext} what={"HG-1006"} /> higher RAW armor or
          <br />
          <CopyImplantText toast={toastContext} what={"HG-1008"} /> if you have too much isk, for
          logi only pilots.
        </Cell>
      </Row>
    </>
  );
}
