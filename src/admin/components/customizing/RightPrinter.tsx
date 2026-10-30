/**
 * RightPrinter
 *
 * Read-only preview of right-aligned printer text lines.
 *
 * @module customizing/RightPrinter
 */
import React from "react";
import { usePrinterExtraStore } from "../../state/storePrinterExtra";

const RightPrinter = () => {
  const {
    printer_right1,
    printer_right2,
    printer_right3,
    printer_right4,
    printer_right5,
    printer_right6,
    printer_right7,
  } = usePrinterExtraStore((state) => state);

  return (
    <div>
      <p style={{ fontSize: "12px", lineHeight: "1.4", margin: 0, padding: 0, whiteSpace: "pre-wrap" }}>{printer_right1}</p>
      <p style={{ fontSize: "12px", lineHeight: "1.4", margin: 0, padding: 0, whiteSpace: "pre-wrap" }}>{printer_right2}</p>
      <p style={{ fontSize: "12px", lineHeight: "1.4", margin: 0, padding: 0, whiteSpace: "pre-wrap" }}>{printer_right3}</p>
      <p style={{ fontSize: "12px", lineHeight: "1.4", margin: 0, padding: 0, whiteSpace: "pre-wrap" }}>{printer_right4}</p>
      <p style={{ fontSize: "12px", lineHeight: "1.4", margin: 0, padding: 0, whiteSpace: "pre-wrap" }}>{printer_right5}</p>
      <p style={{ fontSize: "12px", lineHeight: "1.4", margin: 0, padding: 0, whiteSpace: "pre-wrap" }}>{printer_right6}</p>
      <p style={{ fontSize: "12px", lineHeight: "1.4", margin: 0, padding: 0, whiteSpace: "pre-wrap" }}>{printer_right7}</p>
    </div>
  );
};

export default RightPrinter;
