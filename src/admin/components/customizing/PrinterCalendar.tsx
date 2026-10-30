/**
 * PrinterCalendar
 *
 * Composes the printer preview layout with PrayerCalendar, left/right text, and logo.
 *
 * @module customizing/PrinterCalendar
 */
import * as React from "react";
import PrayerCalendar from "../prayerSetting/PrayerCalendar";
import { usePrinterExtraStore } from "../../state/storePrinterExtra";
import LeftPrinter from "./LeftPrinter";
import RightPrinter from "./RightPrinter";
import { __ } from '@wordpress/i18n';

const PrinterCalendar = () => {
  const { printer_logo_url, printer_logo } = usePrinterExtraStore(
    (state) => state
  );

  return (
    <div className="w-full overflow-x-auto">
      <div className="mx-auto max-w-[794px] p-[5mm] rounded-lg bg-white border border-gray-200 shadow-inner">
        {/* A4-proportioned grid matching print CSS exactly */}
        <div
          className="grid gap-[30px]"
          style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "4mm" }}
        >
          {/* Left Side - left aligned (matches .left-printer) */}
          <div className="text-left">
            <LeftPrinter />
          </div>

          {/* Center - Logo (matches .med-printer: padding-inline 48px, text-align center) */}
          <div style={{ paddingInline: "48px", textAlign: "center" }}>
            <img
              style={{ width: "160px", height: "130px", objectFit: "contain" }}
              src={printer_logo || printer_logo_url}
              alt={__('mosque logo', 'fiveprayer')}
            />
          </div>

          {/* Right Side - left aligned with padding (matches .right-printer) */}
          <div className="text-left" style={{ paddingLeft: "0.5rem" }}>
            <RightPrinter />
          </div>
        </div>

        {/* Calendar Table */}
        <PrayerCalendar show={false} />
      </div>
    </div>
  );
};

export default PrinterCalendar;
