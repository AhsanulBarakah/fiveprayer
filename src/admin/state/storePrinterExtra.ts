/**
 * Printer Extra Store
 *
 * Holds printer configuration for the timetable printer layout.
 * Includes left/right text lines, logo URL, and enable/disable toggle.
 * UI-only store — not persisted separately (saved via batch API).
 *
 * @module storePrinterExtra
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/** Number of printer text lines available (7 left + 7 right) */
const PRINTER_LINE_COUNT = 7;

type State = {
	printer_left1: string;
	printer_left2: string;
	printer_left3: string;
	printer_left4: string;
	printer_left5: string;
	printer_left6: string;
	printer_left7: string;
	printer_right1: string;
	printer_right2: string;
	printer_right3: string;
	printer_right4: string;
	printer_right5: string;
	printer_right6: string;
	printer_right7: string;
	printer_boolean: boolean;
	printer_logo: string;
	printer_logo_url: string;
};

type Action = {
	updateprinter_left1: (v: State['printer_left1']) => void;
	updateprinter_left2: (v: State['printer_left2']) => void;
	updateprinter_left3: (v: State['printer_left3']) => void;
	updateprinter_left4: (v: State['printer_left4']) => void;
	updateprinter_left5: (v: State['printer_left5']) => void;
	updateprinter_left6: (v: State['printer_left6']) => void;
	updateprinter_left7: (v: State['printer_left7']) => void;
	updateprinter_right1: (v: State['printer_right1']) => void;
	updateprinter_right2: (v: State['printer_right2']) => void;
	updateprinter_right3: (v: State['printer_right3']) => void;
	updateprinter_right4: (v: State['printer_right4']) => void;
	updateprinter_right5: (v: State['printer_right5']) => void;
	updateprinter_right6: (v: State['printer_right6']) => void;
	updateprinter_right7: (v: State['printer_right7']) => void;
	updateprinter_boolean: (v: State['printer_boolean']) => void;
	updateprinter_logo: (v: State['printer_logo']) => void;
	updateprinter_logo_url: (v: State['printer_logo_url']) => void;
};

export const usePrinterExtraStore = create<State & Action>()(
	devtools((set) => ({
		printer_left1: "Address: 91-93 Address Rd, London PostCode: N7 ***",
		printer_left2: "Phone: 0208 123 ****",
		printer_left3: "Email: info@yourdomain.com",
		printer_left4: "Website: yourdomain.com",
		printer_left5: "Opening Times: Mon - Fri 9am - 5pm",
		printer_left6: "The text must not exceed seven lines.",
		printer_left7: "",
		printer_right1: "OTHER WAYS TO DONATE: Bank Transfer or Standing Order ",
		printer_right2: "Name Of The Bank Street Name Branch",
		printer_right3: "Sort Code: *** *** ***",
		printer_right4: "Account Number: *** *** ***",
		printer_right5: "You Dont Need All This Information use it as you see Fit",
		printer_right6: "",
		printer_right7: "",
		printer_boolean: false,
		printer_logo: "",
		printer_logo_url: "",

		updateprinter_left1: (v) => set(() => ({ printer_left1: v })),
		updateprinter_left2: (v) => set(() => ({ printer_left2: v })),
		updateprinter_left3: (v) => set(() => ({ printer_left3: v })),
		updateprinter_left4: (v) => set(() => ({ printer_left4: v })),
		updateprinter_left5: (v) => set(() => ({ printer_left5: v })),
		updateprinter_left6: (v) => set(() => ({ printer_left6: v })),
		updateprinter_left7: (v) => set(() => ({ printer_left7: v })),
		updateprinter_right1: (v) => set(() => ({ printer_right1: v })),
		updateprinter_right2: (v) => set(() => ({ printer_right2: v })),
		updateprinter_right3: (v) => set(() => ({ printer_right3: v })),
		updateprinter_right4: (v) => set(() => ({ printer_right4: v })),
		updateprinter_right5: (v) => set(() => ({ printer_right5: v })),
		updateprinter_right6: (v) => set(() => ({ printer_right6: v })),
		updateprinter_right7: (v) => set(() => ({ printer_right7: v })),
		updateprinter_boolean: (v) => set(() => ({ printer_boolean: v })),
		updateprinter_logo: (v) => set(() => ({ printer_logo: v })),
		updateprinter_logo_url: (v) => set(() => ({ printer_logo_url: v })),
	}),
	{ name: 'storePrinterExtra' })
);
