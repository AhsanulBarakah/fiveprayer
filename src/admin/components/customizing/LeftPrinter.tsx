/**
 * LeftPrinter
 *
 * Read-only preview of left-aligned printer text lines.
 *
 * @module customizing/LeftPrinter
 */
import React from "react";
import { usePrinterExtraStore } from "../../state/storePrinterExtra";

const LeftPrinter = () => {
  const {
    printer_left1,
    printer_left2,
    printer_left3,
    printer_left4,
    printer_left5,
    printer_left6,
    printer_left7,
  } = usePrinterExtraStore((state) => state);

  return (
    <div>
      <p style={{ fontSize: "12px", lineHeight: "1.4", margin: 0, padding: 0, whiteSpace: "pre-wrap" }}>{printer_left1}</p>
      <p style={{ fontSize: "12px", lineHeight: "1.4", margin: 0, padding: 0, whiteSpace: "pre-wrap" }}>{printer_left2}</p>
      <p style={{ fontSize: "12px", lineHeight: "1.4", margin: 0, padding: 0, whiteSpace: "pre-wrap" }}>{printer_left3}</p>
      <p style={{ fontSize: "12px", lineHeight: "1.4", margin: 0, padding: 0, whiteSpace: "pre-wrap" }}>{printer_left4}</p>
      <p style={{ fontSize: "12px", lineHeight: "1.4", margin: 0, padding: 0, whiteSpace: "pre-wrap" }}>{printer_left5}</p>
      <p style={{ fontSize: "12px", lineHeight: "1.4", margin: 0, padding: 0, whiteSpace: "pre-wrap" }}>{printer_left6}</p>
      <p style={{ fontSize: "12px", lineHeight: "1.4", margin: 0, padding: 0, whiteSpace: "pre-wrap" }}>{printer_left7}</p>
    </div>
  );
};

export default LeftPrinter;
