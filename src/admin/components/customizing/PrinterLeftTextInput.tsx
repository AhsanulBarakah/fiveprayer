/**
 * PrinterLeftTextInput
 *
 * Five labeled printer input fields for left-side text lines.
 *
 * @module customizing/PrinterLeftTextInput
 */
import React from 'react'
import PrinterInputs from './PrinterInputs'
import { usePrinterExtraStore } from '../../state/storePrinterExtra';
import { __ } from '@wordpress/i18n';

type Props = {}

const PrinterLeftTextInput = (props: Props) => {
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
    <div className="space-y-0.5">
      <PrinterInputs value={printer_left1} label={__('printer_left1', 'fiveprayer')} type="text" />
      <PrinterInputs value={printer_left2} label={__('printer_left2', 'fiveprayer')} type="text" />
      <PrinterInputs value={printer_left3} label={__('printer_left3', 'fiveprayer')} type="text" />
      <PrinterInputs value={printer_left4} label={__('printer_left4', 'fiveprayer')} type="text" />
      <PrinterInputs value={printer_left5} label={__('printer_left5', 'fiveprayer')} type="text" />
      <PrinterInputs value={printer_left6} label={__('printer_left6', 'fiveprayer')} type="text" />
      <PrinterInputs value={printer_left7} label={__('printer_left7', 'fiveprayer')} type="text" />
    </div>
  )
}

export default PrinterLeftTextInput
