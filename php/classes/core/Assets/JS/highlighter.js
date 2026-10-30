// Wait for DOM and data to be ready
function initializeFivePrayerHighlighter() {
    try {
        // Check if the data structure exists
        if (!window.fiveprayerHighlighter || typeof window.fiveprayerHighlighter !== 'object') {
            // Data might not be ready yet, wait a bit and retry
            setTimeout(initializeFivePrayerHighlighter, 100);
            return;
        }

        // Validate the nextPrayer value
        const nextPrayer = window.fiveprayerHighlighter.nextPrayer;
        if (!nextPrayer || typeof nextPrayer !== 'string') {
            console.error('FivePrayer Highlighter: Invalid nextPrayer value: ' + nextPrayer);
            return;
        }

        // Sanitize and normalize the input while preserving Unicode characters
        const sanitizedNextPrayer = nextPrayer
            .toLowerCase() // Convert to lowercase
            .normalize('NFC') // Normalize Unicode characters (NFC is better for display)
            .trim();

        if (!sanitizedNextPrayer) {
            console.error('FivePrayer Highlighter: Empty sanitized prayer name');
            return;
        }

        // Select elements with proper sanitization
        const elements = document.querySelectorAll('.fiveprayer_highlight [data-prayer]');
        
        if (!elements.length) {
            // No elements found - exit silently
            return;
        }

        // Clear all active classes first
        elements.forEach(el => {
            el.classList.remove('fiveprayer_active');
        });

        // Update active prayer
        elements.forEach(el => {
            // Get and sanitize the prayer data attribute
            const prayer = el.getAttribute('data-prayer');
            if (!prayer) {
                console.error('FivePrayer Highlighter: Element missing data-prayer attribute');
                return;
            }

            const sanitizedPrayer = prayer
                .toLowerCase() // Convert to lowercase
                .normalize('NFC') // Normalize Unicode characters (NFC is better for display)
                .trim();

            // Compare sanitized values
            if (sanitizedPrayer === sanitizedNextPrayer) {
                el.classList.add('fiveprayer_active');
            }
        });

        // Add timestamp to ensure cache busting
        const timestamp = window.fiveprayerHighlighter.timestamp;
        if (timestamp) {
            // console.log('FivePrayer Highlighter: Timestamp:', timestamp);
        }

    } catch (error) {
        console.error('FivePrayer Highlighter Error:', error);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFivePrayerHighlighter);
} else {
    // DOM is already ready, run immediately
    initializeFivePrayerHighlighter();
}