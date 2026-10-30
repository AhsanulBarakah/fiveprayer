/**
 * Button Component
 *
 * A styled button with optional label and file upload dialog trigger.
 * Used throughout the admin interface for actions like "Generate Calendar".
 *
 * @module ui/Button
 */
import React from 'react';
import Dialog from './Dialog';

type Props = {
	/** Label displayed above the button */
	label?: string;
	/** Button text */
	text?: string;
	/** Additional CSS classes for the button element */
	className?: string;
	/** CSS classes for the wrapper div */
	classBtnWrapper?: string;
	/** Click handler */
	onPress?: (e: React.MouseEvent<HTMLButtonElement>) => void;
	/** Optional dialog ref for file upload */
	refUpload?: React.RefObject<HTMLDialogElement | null>;
};

const Button = (props: Props) => {
	return (
		<div className={props?.classBtnWrapper || ''}>
			{props.label && <label className="block text-xs font-medium text-gray-600 mb-1.5">{props.label}</label>}
			<button
				onPointerDown={props.onPress}
				className={`h-10 w-full px-3 text-sm font-medium rounded-lg transition-colors focus:outline-hidden ${
					props?.className || 'bg-green-700 text-white hover:bg-green-800'
				}`}
			>
				{props.text}
			</button>
			{props.refUpload && <Dialog dialogRef={props.refUpload} />}
		</div>
	);
};

export default Button;
