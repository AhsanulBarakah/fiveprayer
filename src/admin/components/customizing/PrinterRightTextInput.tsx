/**
 * PrinterRightTextInput
 *
 * Five labeled printer input fields for right-side text lines.
 *
 * @module customizing/PrinterRightTextInput
 */
import React from "react";
import PrinterInputs from "./PrinterInputs";
import { usePrinterExtraStore } from "../../state/storePrinterExtra";
import { __ } from '@wordpress/i18n';

type Props = {};

const PrinterRightTextInput = (props: Props) => {
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
    <div className="space-y-0.5">
      <PrinterInputs value={printer_right1} label={__('printer_right1', 'fiveprayer')} type="text" />
      <PrinterInputs value={printer_right2} label={__('printer_right2', 'fiveprayer')} type="text" />
      <PrinterInputs value={printer_right3} label={__('printer_right3', 'fiveprayer')} type="text" />
      <PrinterInputs value={printer_right4} label={__('printer_right4', 'fiveprayer')} type="text" />
      <PrinterInputs value={printer_right5} label={__('printer_right5', 'fiveprayer')} type="text" />
      <PrinterInputs value={printer_right6} label={__('printer_right6', 'fiveprayer')} type="text" />
      <PrinterInputs value={printer_right7} label={__('printer_right7', 'fiveprayer')} type="text" />
    </div>
  );
};

export default PrinterRightTextInput;
