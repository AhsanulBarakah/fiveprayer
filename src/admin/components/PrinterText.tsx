/**
 * PrinterText
 *
 * Standalone printer text configuration with save functionality.
 *
 * @module PrinterText
 */
import React from "react";
import PrinterInputs from "./customizing/PrinterInputs";

import { usePrinterExtraStore } from "../state/storePrinterExtra";
import { usePostMeta } from "../hooks/usePostMeta";
import { __ } from '@wordpress/i18n';

type Props = {};

const PrinterText = (props: Props) => {
  const { appendDataPost } = usePostMeta();

  const {
    updateprinter_boolean,
    printer_left1,
    printer_left2,
    printer_left3,
    printer_left4,
    printer_left5,
    printer_left6,
    printer_left7,
    printer_right1,
    printer_right2,
    printer_right3,
    printer_right4,
    printer_right5,
    printer_right6,
    printer_right7,
    printer_boolean,
    printer_logo,
    printer_logo_url,
  } = usePrinterExtraStore((state) => state);

  const savePrinterExtra = () => {
    const data = {
      meta: "printer",
      value: {
        printer_left1,
        printer_left2,
        printer_left3,
        printer_left4,
        printer_left5,
        printer_left6,
        printer_left7,
        printer_right1,
        printer_right2,
        printer_right3,
        printer_right4,
        printer_right5,
        printer_right6,
        printer_right7,
        printer_boolean,
        printer_logo,
      },
    };
    appendDataPost(data);
  };

  return (
    <div className="min-w-min px-4 bg-white sidebar-fp ">
      <div className="p-2">
        <span className="text-slate-700 text-lg">{__('Left', 'fiveprayer')}</span>
        <PrinterInputs
          value={printer_left1}
          label={__('printer_left1', 'fiveprayer')}
          type="text"
        />
        <PrinterInputs
          value={printer_left2}
          label={__('printer_left2', 'fiveprayer')}
          type="text"
        />
        <PrinterInputs
          value={printer_left3}
          label={__('printer_left3', 'fiveprayer')}
          type="text"
        />
        <PrinterInputs
          value={printer_left4}
          label={__('printer_left4', 'fiveprayer')}
          type="text"
        />
        <PrinterInputs
          value={printer_left5}
          label={__('printer_left5', 'fiveprayer')}
          type="text"
        />
        <PrinterInputs
          value={printer_left6}
          label={__('printer_left6', 'fiveprayer')}
          type="text"
        />
        <PrinterInputs
          value={printer_left7}
          label={__('printer_left7', 'fiveprayer')}
          type="text"
        />
      </div>
      <div className="p-2">
        <span className="text-slate-700 text-lg">{__('Right', 'fiveprayer')}</span>
        <PrinterInputs
          value={printer_right1}
          label={__('printer_right1', 'fiveprayer')}
          type="text"
        />
        <PrinterInputs
          value={printer_right2}
          label={__('printer_right2', 'fiveprayer')}
          type="text"
        />
        <PrinterInputs
          value={printer_right3}
          label={__('printer_right3', 'fiveprayer')}
          type="text"
        />
        <PrinterInputs
          value={printer_right4}
          label={__('printer_right4', 'fiveprayer')}
          type="text"
        />
        <PrinterInputs
          value={printer_right5}
          label={__('printer_right5', 'fiveprayer')}
          type="text"
        />
        <PrinterInputs
          value={printer_right6}
          label={__('printer_right6', 'fiveprayer')}
          type="text"
        />
        <PrinterInputs
          value={printer_right7}
          label={__('printer_right7', 'fiveprayer')}
          type="text"
        />
      </div>
      <div className="p-2">
        <PrinterInputs
          value={printer_logo || printer_logo_url}
          label={__('printer_logo', 'fiveprayer')}
          type="text"
        />
      </div>
      <div className="p-2">
        <button
          onClick={() => savePrinterExtra()}
          className="p-2 rounded-xs text-base text-white bg-green-500"
        >{__('Save', 'fiveprayer')}</button>
        <input
          type="checkbox"
          onChange={() => updateprinter_boolean(!printer_boolean)}
          checked={printer_boolean}
          name="false"
          id=""
        />
      </div>
    </div>
  );
};

export default PrinterText;
