/**
 * useCopyShortcode
 *
 * Copy-a-shortcode helper shared by the shortcode documentation pages.
 *
 * `navigator.clipboard` only exists in a secure context, so on a plain
 * `http://` WordPress admin the docs pages could not copy anything at all —
 * they only showed a warning telling the user to switch to HTTPS. This falls
 * back to the hidden-textarea + `document.execCommand('copy')` path, which
 * still works on http, so the Copy button succeeds either way.
 *
 * @module Docs/shortcodes/useCopyShortcode
 */
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { __ } from '@wordpress/i18n';

/** Write text to the clipboard, using the legacy path when needed. */
async function writeToClipboard(text: string): Promise<boolean> {
	if ( typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext ) {
		try {
			await navigator.clipboard.writeText( text );
			return true;
		} catch {
			// Permission denied or blocked — try the legacy path below.
		}
	}

	try {
		const area = document.createElement( 'textarea' );
		area.value = text;
		area.setAttribute( 'readonly', '' );
		area.setAttribute( 'aria-hidden', 'true' );
		area.style.position = 'fixed';
		area.style.top = '-1000px';
		area.style.opacity = '0';
		document.body.appendChild( area );

		// Remember the current selection so focus can be restored afterwards.
		const selection = document.getSelection();
		const previous = selection && selection.rangeCount > 0 ? selection.getRangeAt( 0 ) : null;

		area.select();
		const copied = document.execCommand( 'copy' );
		document.body.removeChild( area );

		if ( previous && selection ) {
			selection.removeAllRanges();
			selection.addRange( previous );
		}

		return copied;
	} catch {
		return false;
	}
}

/**
 * Returns the per-shortcode "copied" flags and a copy function that toasts the
 * result.
 */
export const useCopyShortcode = () => {
	const [ copied, setCopied ] = useState<Record<string, boolean>>( {} );

	const markCopied = useCallback( ( shortcode: string ) => {
		setCopied( ( prev ) => ( { ...prev, [ shortcode ]: true } ) );
		window.setTimeout( () => {
			setCopied( ( prev ) => ( { ...prev, [ shortcode ]: false } ) );
		}, 2000 );
	}, [] );

	const copy = useCallback(
		async ( shortcode: string ): Promise<boolean> => {
			const ok = await writeToClipboard( shortcode );

			if ( ok ) {
				markCopied( shortcode );
				toast.success( __( 'Shortcode copied to clipboard!', 'fiveprayer' ) );
			} else {
				toast.error( __( 'Could not copy automatically — select the shortcode and copy it manually.', 'fiveprayer' ) );
			}

			return ok;
		},
		[ markCopied ]
	);

	return { copied, copy };
};
