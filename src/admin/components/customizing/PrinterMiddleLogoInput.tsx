/**
 * PrinterMiddleLogoInput
 *
 * Logo upload/display input for the printer middle section.
 *
 * @module customizing/PrinterMiddleLogoInput
 */
import React from "react";
import { usePrinterExtraStore } from "../../state/storePrinterExtra";
import { useGetMetaPrinter } from "../../hooks/useGetMetaPrinter";
import { __ } from '@wordpress/i18n';

type Props = {};

const PrinterMiddleLogoInput = (props: Props) => {
  const { printer_logo, printer_logo_url, updateprinter_logo } = usePrinterExtraStore(
    (state) => state
  );
  const { liveUpdateMetaPrinter } = useGetMetaPrinter();
  const [logoUrl, setLogoUrl] = React.useState(printer_logo || printer_logo_url || '');

  React.useEffect(() => {
    setLogoUrl(printer_logo || printer_logo_url || '');
  }, [printer_logo, printer_logo_url]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setLogoUrl(url);
    updateprinter_logo(url);
    liveUpdateMetaPrinter({ meta: 'printer_logo', value: url });
  };

  return (
    <div className="w-full space-y-4">
      {/* Logo Preview */}
      <div className="flex items-center justify-center w-full h-40 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={__('Mosque Logo', 'fiveprayer')}
            className="max-h-full max-w-full object-contain p-2"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="text-center">
            <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
            <p className="text-xs text-gray-400 mt-1">{__('No logo set', 'fiveprayer')}</p>
          </div>
        )}
      </div>

      {/* Logo URL Input */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">{__('Logo Image URL', 'fiveprayer')}</label>
        <input
          type="url"
          value={logoUrl}
          onChange={handleLogoChange}
          placeholder={__('https://example.com/logo.png', 'fiveprayer')}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 focus:outline-hidden transition-all placeholder:text-gray-300"
        />
      </div>
    </div>
  );
};

export default PrinterMiddleLogoInput;
