/**
 * PrinterPage
 *
 * Page wrapper rendering the PrinterTimeTable editor.
 *
 * @module customizing/pages/PrinterPage
 */
import PrinterTimeTable from "../PrinterTimeTable";
import { __ } from '@wordpress/i18n';

type Props = {};

const PrinterPage = ( props: Props ) => {

	return (
		<div className="max-w-5xl mx-auto p-6 space-y-8">
			{/* Header */}
			<div className="text-center">
				<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white mb-4 shadow-lg shadow-blue-500/25">
					<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
					</svg>
				</div>
				<h1 className="text-2xl font-bold text-gray-900">{__('Printer Page Customizer', 'fiveprayer')}</h1>
				<p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">{__('Customize the layout of your printed prayer timetable. Add your mosque details on the left and right sides, upload a logo, and preview the result below.', 'fiveprayer')}</p>
			</div>

			{/* Main Content */}
			<PrinterTimeTable />

			{/* Help Tips */}
			<div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
				<div className="flex items-start gap-3">
					<svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
					</svg>
					<div className="text-sm text-blue-800">
						<p className="font-medium mb-1">{__('Tips', 'fiveprayer')}</p>
						<ul className="space-y-1 text-blue-700">
							<li>{__('• The alignment of left/right text and logo is a visual guide only.', 'fiveprayer')}</li>
							<li>{__('• Always check the final result in the print window (Ctrl+P).', 'fiveprayer')}</li>
							<li>{__('• Use up to 7 lines for left and right text sections.', 'fiveprayer')}</li>
							<li>{__('• Toggle the checkbox to show/hide the printer section on the calendar.', 'fiveprayer')}</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PrinterPage;
