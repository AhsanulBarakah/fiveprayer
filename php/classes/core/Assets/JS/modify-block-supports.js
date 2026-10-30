/**
 * WordPress dependencies
 */
const { addFilter } = wp.hooks;

/**
 * Adds border support to Container Prayer block.
 *
 * @param {Object} settings - The original block settings.
 * @param {string} name - The name of the block.
 *
 * @returns {Object} The modified block settings with added border support.
 */
function addBorderSupport( settings, name ) {
    // Only apply to our Container Prayer block
    if ( name !== 'fiveprayer/container-prayer' ) {
        return settings;
    }

    // If the block doesn't have supports, create them
    if ( ! settings?.supports ) {
        settings.supports = {};
    }

    return Object.assign( {}, settings, {
        supports: Object.assign( settings.supports, {
            __experimentalBorder: {
                color: true,
                style: true,
                width: true,
                radius: true,
                __experimentalDefaultControls: {
                    color: true,
                    style: true,
                    width: true,
                    radius: true,
                }
            }
        })
    });
}

addFilter(
    'blocks.registerBlockType',
    'fiveprayer/add-border-support',
    addBorderSupport,
);
