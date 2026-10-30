/**
 * iFiiri client SDK - browser side.
 *
 * Two pieces of UI, both dependency free:
 *
 *  1. Consent: turns the markup rendered by Consent::render() into choices. The
 *     decision is saved over admin-ajax; only after an "opt in" does PHP send the
 *     first report.
 *
 *  2. The deactivation modal on the Plugins screen. The WordPress deactivate link
 *     is intercepted, and the modal offers a reason, an optional comment, a
 *     prominent "Skip & Deactivate" (sends nothing) and "Submit & Deactivate".
 *     Navigation is never blocked by the network: the AJAX call races a short
 *     timeout and the browser continues either way.
 *
 * @package iFiiri\SDK
 */

( function () {
	'use strict';

	var config = window.ifiiriSDK;
	var strings = ( config && config.i18n ) || {};

	if ( ! config ) {
		return;
	}

	// ---------------------------------------------------------------------
	// Part 1: consent
	// ---------------------------------------------------------------------

	/**
	 * Ask the server to store a consent decision.
	 *
	 * @param {string} product  Product slug.
	 * @param {string} decision yes|no|later.
	 * @return {Promise<Object>} Parsed JSON response.
	 */
	function saveConsent( product, decision ) {
		var payload = new window.URLSearchParams();

		payload.append( 'action', 'ifiiri_sdk_consent' );
		payload.append( 'nonce', config.consentNonce || '' );
		payload.append( 'product', product );
		payload.append( 'decision', decision );

		return window.fetch( config.ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
			body: payload.toString()
		} ).then( function ( response ) {
			return response.json();
		} );
	}

	/**
	 * Remove the prompt UI for a product once a decision exists.
	 *
	 * @param {string} product Product slug.
	 */
	function removeConsentUi( product ) {
		[ 'ifiiri-consent-modal-', 'ifiiri-consent-notice-' ].forEach( function ( prefix ) {
			var node = document.getElementById( prefix + product );

			if ( node ) {
				node.remove();
			}
		} );
	}

	/**
	 * Wire the consent buttons.
	 */
	function initConsent() {
		var buttons = document.querySelectorAll( '[data-ifiiri-consent]' );

		Array.prototype.forEach.call( buttons, function ( button ) {
			button.addEventListener( 'click', function ( event ) {
				event.preventDefault();

				var product = button.getAttribute( 'data-ifiiri-product' );
				var decision = button.getAttribute( 'data-ifiiri-consent' );
				var state = document.querySelector( '[data-ifiiri-state="' + product + '"]' );

				if ( ! product || ! decision ) {
					return;
				}

				button.disabled = true;

				saveConsent( product, decision )
					.then( function ( result ) {
						if ( ! result || ! result.success ) {
							throw new Error( 'failed' );
						}

						var message = ( result.data && result.data.message ) || '';

						if ( 'later' === decision ) {
							// Stay undecided: the server will render a slim notice next load.
							removeConsentUi( product );
							return;
						}

						if ( state ) {
							state.textContent = message;
						}

						window.setTimeout( function () {
							removeConsentUi( product );
						}, 1400 );
					} )
					.catch( function () {
						button.disabled = false;

						if ( state ) {
							state.textContent = strings.error || 'Could not save your choice.';
							state.classList.add( 'is-error' );
						}
					} );
			} );
		} );
	}

	// ---------------------------------------------------------------------
	// Part 2: deactivation feedback
	// ---------------------------------------------------------------------

	/**
	 * Find the iFiiri product a plugin row belongs to.
	 *
	 * @param {HTMLElement} row Plugins table row.
	 * @return {Object|null} Product config.
	 */
	function productForRow( row ) {
		var basename = row.getAttribute( 'data-plugin' ) || '';
		var slug = row.getAttribute( 'data-slug' ) || '';
		var products = config.products || [];
		var found = null;

		products.forEach( function ( product ) {
			if ( found ) {
				return;
			}

			if ( basename && product.basename === basename ) {
				found = product;
				return;
			}

			// Fallback: the directory part of the basename matches the slug.
			if ( basename && basename.indexOf( product.slug + '/' ) === 0 ) {
				found = product;
			}
		} );

		if ( ! found && slug ) {
			products.forEach( function ( product ) {
				if ( ! found && product.slug === slug ) {
					found = product;
				}
			} );
		}

		return found;
	}

	/**
	 * Submit feedback, then always continue to the deactivate URL.
	 *
	 * @param {Object} product  Product.
	 * @param {string} reason   Reason slug.
	 * @param {string} feedback Free-text feedback.
	 * @param {string} href     Deactivate URL to continue to.
	 */
	function submitAndLeave( product, reason, feedback, href ) {
		var payload = new window.URLSearchParams();
		var navigated = false;

		payload.append( 'action', 'ifiiri_sdk_deactivate' );
		payload.append( 'nonce', config.deactivateNonce || '' );
		payload.append( 'product', product.slug );
		payload.append( 'reason', reason );
		payload.append( 'feedback', feedback );

		/**
		 * Leave the page exactly once.
		 */
		function leave() {
			if ( ! navigated ) {
				navigated = true;
				window.location.href = href;
			}
		}

		// Never let a slow server hold up a deactivation.
		window.setTimeout( leave, 1500 );

		window.fetch( config.ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
			body: payload.toString()
		} )
			.then( leave )
			.catch( leave );
	}

	/**
	 * Build and show the deactivation modal.
	 *
	 * @param {Object} product     Product.
	 * @param {string} deactivateHref Link target to continue to.
	 */
	function openDeactivateModal( product, deactivateHref ) {
		var reasons = config.reasons || {};
		var overlay = document.createElement( 'div' );
		var panel = document.createElement( 'div' );
		var form = document.createElement( 'form' );
		var lastFocused = document.activeElement;

		overlay.className = 'ifiiri-modal ifiiri-modal--deactivate';
		overlay.setAttribute( 'role', 'dialog' );
		overlay.setAttribute( 'aria-modal', 'true' );

		panel.className = 'ifiiri-modal__panel';
		panel.setAttribute( 'aria-labelledby', 'ifiiri-deactivate-title' );

		var title = document.createElement( 'h2' );
		title.className = 'ifiiri-modal__title';
		title.id = 'ifiiri-deactivate-title';
		title.textContent = product.name + ' is being deactivated';
		panel.appendChild( title );

		var lede = document.createElement( 'p' );
		lede.className = 'ifiiri-modal__lede';
		lede.textContent = 'Would you tell us why? It takes a moment, and it is entirely optional.';
		panel.appendChild( lede );

		var list = document.createElement( 'div' );
		list.className = 'ifiiri-reason-list';

		Object.keys( reasons ).forEach( function ( slug, index ) {
			var label = document.createElement( 'label' );
			var radio = document.createElement( 'input' );
			var text = document.createElement( 'span' );

			radio.type = 'radio';
			radio.name = 'ifiiri-reason';
			radio.value = slug;

			if ( 0 === index ) {
				radio.checked = true;
			}

			text.textContent = reasons[ slug ];
			label.appendChild( radio );
			label.appendChild( text );
			list.appendChild( label );
		} );

		panel.appendChild( list );

		var feedbackWrap = document.createElement( 'div' );
		feedbackWrap.className = 'ifiiri-feedback-wrap';
		feedbackWrap.hidden = true;

		var feedbackLabel = document.createElement( 'label' );
		feedbackLabel.className = 'ifiiri-feedback-label';
		feedbackLabel.setAttribute( 'for', 'ifiiri-deactivate-feedback' );
		feedbackLabel.textContent = 'What went wrong? (optional)';

		var textarea = document.createElement( 'textarea' );
		textarea.id = 'ifiiri-deactivate-feedback';
		textarea.rows = 4;
		textarea.maxLength = 1000;
		textarea.placeholder = 'Any detail helps us fix it.';

		feedbackWrap.appendChild( feedbackLabel );
		feedbackWrap.appendChild( textarea );
		panel.appendChild( feedbackWrap );

		// Say so when nothing can be sent, instead of quietly discarding the
		// comment and letting the user believe it was delivered.
		if ( ! product.tracking ) {
			var switchedOff = document.createElement( 'p' );

			switchedOff.className = 'ifiiri-modal__note ifiiri-modal__note--warning';
			switchedOff.textContent = strings.noConsent || 'Anonymous usage reporting is off on this site, so this comment will not be sent.';
			panel.appendChild( switchedOff );
		}

		// The comment box belongs to "Other" alone: it appears when that option is
		// chosen and disappears again when another one is. Whatever was typed is
		// kept, so switching between options does not throw work away.
		list.addEventListener( 'change', function ( event ) {
			var isOther = 'other' === event.target.value;

			feedbackWrap.hidden = ! isOther;

			if ( isOther ) {
				textarea.focus();
			}
		} );

		var actions = document.createElement( 'div' );
		actions.className = 'ifiiri-modal__actions';

		var submit = document.createElement( 'button' );
		submit.type = 'submit';
		submit.className = 'button button-primary button-hero';
		submit.textContent = 'Submit & Deactivate';

		var skip = document.createElement( 'button' );
		skip.type = 'button';
		skip.className = 'button button-hero';
		skip.textContent = 'Skip & Deactivate';
		skip.addEventListener( 'click', function () {
			close();
			window.location.href = deactivateHref;
		} );

		var later = document.createElement( 'button' );
		later.type = 'button';
		later.className = 'button-link';
		later.textContent = 'Cancel';
		later.addEventListener( 'click', function () {
			close();
			if ( lastFocused && lastFocused.focus ) {
				lastFocused.focus();
			}
		} );

		actions.appendChild( submit );
		actions.appendChild( skip );
		actions.appendChild( later );
		panel.appendChild( actions );

		var note = document.createElement( 'p' );
		note.className = 'ifiiri-modal__note';
		note.textContent = 'Submitting is optional. Skipping sends nothing and deactivates the plugin straight away.';
		panel.appendChild( note );

		form.appendChild( panel );
		overlay.appendChild( form );
		document.body.appendChild( overlay );

		/**
		 * Tear the modal down and unbind its listeners.
		 */
		function close() {
			document.removeEventListener( 'keydown', onKeydown );
			overlay.remove();
		}

		/**
		 * Escape closes the modal, like any well-behaved dialog.
		 *
		 * @param {KeyboardEvent} event Key event.
		 */
		function onKeydown( event ) {
			if ( 'Escape' === event.key ) {
				close();
			}
		}

		document.addEventListener( 'keydown', onKeydown );

		form.addEventListener( 'submit', function ( event ) {
			event.preventDefault();

			var checked = panel.querySelector( 'input[name="ifiiri-reason"]:checked' );
			var reason = checked ? checked.value : 'other';

			// Only "Other" carries a comment. Text left in the hidden box must not
			// be submitted behind the user's back after they picked another reason.
			var feedback = 'other' === reason ? textarea.value : '';

			submitAndLeave( product, reason, feedback, deactivateHref );
		} );

		var firstRadio = panel.querySelector( 'input[name="ifiiri-reason"]' );

		if ( firstRadio ) {
			firstRadio.focus();
		}
	}

	/**
	 * Intercept deactivate links for iFiiri-enabled plugins.
	 */
	function initDeactivation() {
		var links = document.querySelectorAll( '#the-list .deactivate a, #the-list .row-actions a[href*="action=deactivate"]' );

		Array.prototype.forEach.call( links, function ( link ) {
			link.addEventListener( 'click', function ( event ) {
				var row = link.closest( 'tr' );
				var product = row ? productForRow( row ) : null;

				if ( ! product || ! product.configured ) {
					return;
				}

				event.preventDefault();
				openDeactivateModal( product, link.href );
			} );
		} );
	}

	document.addEventListener( 'DOMContentLoaded', function () {
		initConsent();
		initDeactivation();
	} );
}() );
