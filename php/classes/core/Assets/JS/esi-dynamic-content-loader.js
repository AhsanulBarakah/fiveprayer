/**
 * ESI-Optimized Dynamic Content Loader for FivePrayer Plugin
 * Loads time-sensitive content via ESI when available, falls back to AJAX
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if we have elements that need dynamic content
    const dynamicElements = document.querySelectorAll('.fiveprayer-dynamic-content[data-content-type]');
    
    if (dynamicElements.length === 0) {
        return; // No dynamic content needed
    }
    
    // Check if ESI is available and preferred
    const hasESISupport = window.location.search.includes('esi=1') || 
                          document.querySelector('meta[name="esi-enabled"]') ||
                          typeof window.ESI !== 'undefined';
    
    if (hasESISupport) {
        // ESI is enabled, dynamic content should already be loaded by the server
        // Just initialize any necessary JavaScript for live updates
        initializeLiveUpdates();
    } else {
        // Fall back to AJAX-based loading for non-ESI environments
        loadDynamicContentViaAjax();

        // Keep next-prayer content fresh. A page cache can serve a stale next
        // prayer on first paint (the call above corrects it); this also covers
        // pages restored from the browser's back-forward cache and pages left
        // open across a prayer boundary.
        const nextPrayerElements = document.querySelectorAll('.fiveprayer-dynamic-content[data-content-type="next_prayer"]');
        if (nextPrayerElements.length > 0) {
            const refreshNextPrayerOnly = function() {
                nextPrayerElements.forEach(function(el) {
                    loadDynamicContent('next_prayer', el, el.dataset.field || '');
                });
            };
            window.addEventListener('pageshow', refreshNextPrayerOnly);
            document.addEventListener('visibilitychange', function() {
                if (document.visibilityState === 'visible') refreshNextPrayerOnly();
            });
            setInterval(refreshNextPrayerOnly, 60000);
        }
    }
});

/**
 * Initialize live updates for content that needs real-time updates
 */
function initializeLiveUpdates() {
    // Initialize live clock updates for current time elements
    const currentTimeElements = document.querySelectorAll('.fiveprayer-live-time, .fiveprayer-dynamic-content[data-field*="current_time"]');
    
    if (currentTimeElements.length > 0) {
        // Update every second
        setInterval(() => {
            const now = new Date();
            const timeString = now.toLocaleTimeString();
            
            currentTimeElements.forEach(el => {
                // Only update if the element doesn't have live-time class (already handled by live-time.js)
                if (!el.classList.contains('fiveprayer-live-time')) {
                    el.textContent = timeString;
                }
            });
        }, 1000);
    }
    
    // Initialize other live updates as needed
    initializeOtherLiveUpdates();
}

/**
 * Initialize other types of live updates
 */
function initializeOtherLiveUpdates() {
    // Check for elements that need periodic updates (like next prayer)
    const timedUpdateElements = document.querySelectorAll('.fiveprayer-dynamic-content[data-update-interval]');
    
    timedUpdateElements.forEach(el => {
        const interval = parseInt(el.dataset.updateInterval) || 60000; // Default to 1 minute
        
        setInterval(() => {
            // Re-fetch content via AJAX if needed
            refetchElementContent(el);
        }, interval);
    });
}

/**
 * Load dynamic content via AJAX for non-ESI environments
 */
function loadDynamicContentViaAjax() {
    // Prepare AJAX request
    const nonce = window.fiveprayer_dynamic?.nonce || '';
    
    if (!nonce) {
        console.error('FivePrayer: Missing nonce for AJAX request');
        return;
    }
    
    // Group elements by content type to minimize AJAX requests
    const contentGroups = {};
    
    document.querySelectorAll('.fiveprayer-dynamic-content[data-content-type]').forEach(element => {
        const contentType = element.dataset.contentType;
        const field = element.dataset.field || '';
        
        if (!contentGroups[contentType]) {
            contentGroups[contentType] = [];
        }
        
        contentGroups[contentType].push({
            element: element,
            field: field
        });
    });
    
    // Make AJAX requests for each content type
    Object.keys(contentGroups).forEach(contentType => {
        const elements = contentGroups[contentType];
        
        // For single prayer requests, we need to make individual requests per field
        if (contentType === 'single_prayer') {
            elements.forEach(item => {
                loadDynamicContent(contentType, item.element, item.field);
            });
        } else {
            // For other content types, we can batch them
            loadDynamicContent(contentType, elements.map(item => item.element)[0], elements[0]?.field || '');
        }
    });
}

/**
 * Load dynamic content via AJAX
 */
function loadDynamicContent(contentType, element, field = '') {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    
    formData.append('action', 'fiveprayer_dynamic_content');
    formData.append('nonce', window.fiveprayer_dynamic?.nonce || '');
    formData.append('content_type', contentType);
    
    if (field) {
        formData.append('field', field);
    }
    
    // Add cache-busting parameter to the URL
    const cacheBuster = Date.now() + Math.floor(Math.random() * 10000);
    const ajaxUrl = (window.fiveprayer_dynamic?.ajax_url || '/wp-admin/admin-ajax.php');
    xhr.open('POST', ajaxUrl + (ajaxUrl.indexOf('?') === -1 ? '?' : '&') + 'cb=' + cacheBuster, true);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    xhr.setRequestHeader('X-LiteSpeed-Cache-Control', 'no-cache');
    xhr.setRequestHeader('Pragma', 'no-cache');
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    
                    if (response.success && response.data) {
                        // Update all elements of this content type
                        let selector = `.fiveprayer-dynamic-content[data-content-type="${contentType}"]`;
                        if (field) {
                            selector += `[data-field="${field}"]`;
                        }
                        const elementsToUpdate = document.querySelectorAll(selector);
                        
                        elementsToUpdate.forEach(el => {
                            if (contentType === 'current_time' && response.data.time) {
                                el.textContent = response.data.time;
                            } else if (contentType === 'next_prayer' && response.data.name) {
                                el.textContent = response.data.name + ' ' + response.data.time;
                            } else if (contentType === 'single_prayer' && response.data.time) {
                                el.textContent = response.data.time;
                            }
                            
                            // Add class to indicate content has been loaded
                            el.classList.add('fiveprayer-content-loaded');
                        });
                    } else {
                        console.error('FivePrayer AJAX Error:', response.data?.error || 'Unknown error');
                    }
                } catch (e) {
                    console.error('FivePrayer JSON Parse Error:', e);
                }
            } else {
                console.error('FivePrayer AJAX Request Failed:', xhr.status);
            }
        }
    };
    
    xhr.send(formData);
}

/**
 * Refetch content for a specific element
 */
function refetchElementContent(element) {
    const contentType = element.dataset.contentType;
    const field = element.dataset.field || '';
    
    loadDynamicContent(contentType, element, field);
}

/**
 * Public API for manual content updates
 */
window.FivePrayerDynamicContent = {
    initializeLiveUpdates: initializeLiveUpdates,
    loadDynamicContent: loadDynamicContent,
    refetchElementContent: refetchElementContent
};