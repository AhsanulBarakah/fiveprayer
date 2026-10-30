/**
 * TimeWithSeconds
 *
 * Renders a timetable cell value (e.g. '04:38') with a tiny hover tooltip
 * showing the exact computed time including seconds (e.g. '04:38:12').
 *
 * The stored timetable only keeps minute precision, so the exact seconds are
 * recomputed at display time. The tooltip ALWAYS appears when hovered (as
 * long as the recomputed seconds are available) — no match guard, because
 * admins want to see the seconds regardless of whether a cell was generated,
 * tuned or overridden by a custom schedule.
 *
 * The tooltip is rendered with `position: fixed` at the cell's screen
 * position on hover. Absolute positioning inside the cell gets clipped by the
 * calendar's `overflow-x-auto` wrapper (which also clips the y-axis), so the
 * tooltip would be invisible for cells near the container edges — fixed
 * positioning escapes that clipping entirely and is always visible.
 *
 * @module components/customizing/prayerTable/TimeWithSeconds
 */
import React from 'react';
import styled from 'styled-components';
import type { SecondsEntry } from '../../../utils/computeDayTimes';
import { __ } from '@wordpress/i18n';

type Props = {
	/** The stored, displayed value (e.g. '04:38' or '4:38 AM'). */
	value: string;
	/** Recomputed time for this cell; optional. Shown in the tooltip when present. */
	exact?: SecondsEntry;
	/** Short label used in the tooltip, e.g. 'Fajr begins'. */
	label?: string;
};

const TimeCell = styled.td`
	position: relative;
	cursor: default;
`;

const Tip = styled.span`
	position: fixed;
	transform: translate(-50%, -100%);
	padding: 3px 7px;
	background: rgba(17, 24, 39, 0.95);
	color: #fff;
	font-size: 11px;
	line-height: 1.35;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
	border-radius: 4px;
	pointer-events: none;
	z-index: 99999;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
`;

const TimeWithSeconds: React.FC<Props> = ({ value, exact, label }) => {
	const cellRef = React.useRef<HTMLTableCellElement>(null);
	const [tipPos, setTipPos] = React.useState<{ left: number; top: number } | null>(null);

	const hasSeconds =
		!!exact &&
		typeof exact.exact === 'string' &&
		/^\d{2}:\d{2}:\d{2}$/.test(exact.exact);

	const handleMouseEnter = () => {
		if (!hasSeconds || !cellRef.current) return;
		const rect = cellRef.current.getBoundingClientRect();
		setTipPos({ left: rect.left + rect.width / 2, top: rect.top - 6 });
	};

	const handleMouseLeave = () => setTipPos(null);

	// Before/after: when Day-to-Day Smoothing changed this cell, the tooltip
	// shows the natural (unsmoothed) time → the stored (smoothed) seconds, so
	// the admin can SEE what smoothing did. When nothing changed only the
	// exact seconds are shown, as before.
	const hasBeforeAfter = hasSeconds && !!exact?.natural;

	return (
		<TimeCell ref={cellRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
			{value}
			{hasSeconds && tipPos && (
				<Tip style={{ left: tipPos.left, top: tipPos.top }}>
					{hasBeforeAfter ? (
						<>
							{label ? `${label} ` : ''}
							<span style={{ color: '#9ca3af' }}>{__('natural ', 'fiveprayer')}</span>
							{exact!.natural}
							{'  →  '}
							{exact!.exact}
						</>
					) : (
						<>
							{label ? `${label} ` : ''}
							{exact!.exact}
						</>
					)}
				</Tip>
			)}
		</TimeCell>
	);
};

export default TimeWithSeconds;