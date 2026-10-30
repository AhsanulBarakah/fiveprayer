// FivePrayer PrintCalendar.js - Independent print functionality

// Function to handle custom URL button clicks
function FP_handleCustomUrlButtonClick(event) {
    // Only handle clicks on elements with the fiveprayer-custom-url-btn class
    var target = event.target;
    
    // Walk up the DOM tree to find the button
    while (target && target !== document && target !== null) {
        if (target.classList && target.classList.contains('fiveprayer-custom-url-btn')) {
            break;
        }
        target = target.parentNode;
    }
    
    if (!target || target === document || target === null) {
        return;
    }
    
    // This is our button, handle the click
    event.preventDefault();
    
    var baseUrl = target.getAttribute('data-base-url');
    if (!baseUrl) {
        return;
    }
    
    var monthSelect = document.querySelector('.fiveprayer__select');
    var selectedMonth = '';
    
    if (monthSelect && monthSelect.value) {
        selectedMonth = monthSelect.value;
    }
    
    var url = new URL(baseUrl, window.location.origin);
    url.searchParams.set('print_month', selectedMonth);
    window.location.href = url.toString();
}

// Function to attach click listeners for custom URL buttons using event delegation
function FP_attachCustomUrlButtonListeners() {
    // Use event delegation on document to handle dynamically added buttons
    // Only bind once to prevent duplicate handlers
    if (typeof window.FP_customUrlListenerBound === 'undefined' || !window.FP_customUrlListenerBound) {
        // Use bubbling phase (not capture) to avoid interfering with other handlers
        document.addEventListener('click', FP_handleCustomUrlButtonClick, false);
        window.FP_customUrlListenerBound = true;
    }
}

// Flag to prevent binding the listener multiple times
if (typeof window.FP_customUrlListenerBound === 'undefined') {
    window.FP_customUrlListenerBound = false;
}

// Put freshly rendered timetable markup into the timetable container.
//
// The template renders the timetable's own wrapper (`#fiveprayer-div-to`) as
// part of its output, and the container that markup is inserted into *is* that
// wrapper. Assigning the response straight to `innerHTML` therefore nested a
// second element with the same id inside the first on every month change: two
// wrappers, one id, and the print and scroll lookups split between them.
// Adopt the new wrapper's classes onto the existing container and move its
// children up, so exactly one wrapper (and one id) stays on the page.
function FP_applyTimetableMarkup(container, html) {
    container.innerHTML = html;

    const FP_wrapper = Array.prototype.find.call(container.children, function (child) {
        return child.id === 'fiveprayer-div-to';
    });

    if (!FP_wrapper || FP_wrapper === container) {
        return;
    }

    if (FP_wrapper.className) {
        container.className = FP_wrapper.className;
    }

    while (FP_wrapper.firstChild) {
        container.appendChild(FP_wrapper.firstChild);
    }

    FP_wrapper.remove();
}

// Styles the print document starts from. They are appended after the
// timetable's own CSS, so they only repair what a print sheet would otherwise
// hide or clip.
const FP_PRINT_FRAME_CSS = `
    html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
    body { display: block !important; }
    img { max-width: 100%; }

    @media print {
        html, body { height: auto !important; min-height: 0 !important; overflow: visible !important; }

        /* The timetable's print sheet hides the page and then reveals the
           timetable inside it. This document holds nothing else, so keeping the
           timetable visible is enough — and it is what stops a page that starts
           hidden from printing blank when a theme's own print rules win. */
        body, body * { visibility: visible !important; }

        /* Thirteen columns on one sheet: the header text may wrap, so the
           table's widest word fits a column and the month table stays inside
           the paper width instead of growing past it and losing its
           right-hand prayers off the edge. */
        #fiveprayer-div-to { overflow: visible !important; }
        #fiveprayer-div-to-print { width: 100% !important; max-width: 100% !important; }
        #fiveprayer-div-to-print th,
        #fiveprayer-div-to-print td { white-space: normal !important; }

        @page { margin: 8mm; }
    }
`;

// The timetable's own styles: the plugin's stylesheets plus the inline <style>
// blocks it prints (colour variables, the per-layout rules, live preview).
// Theme stylesheets are deliberately left out — that is what makes the print
// look the same on every theme.
function FP_collectTimetableStyles() {
    const FP_chunks = [];

    const FP_belongsToTimetable = function(id, href, text) {
        return /fiveprayer/i.test(id || '') || /fiveprayer/i.test(href || '') || /fiveprayer/i.test(text || '');
    };

    Array.prototype.forEach.call(document.styleSheets, function(sheet) {
        const FP_owner = sheet.ownerNode;
        if (!FP_owner) {
            return;
        }

        const FP_href = sheet.href || '';
        // An inline <style> has no href, so its text is what identifies it.
        const FP_text = sheet.href === null ? (FP_owner.textContent || '') : '';

        if (!FP_belongsToTimetable(FP_owner.id || '', FP_href, FP_text)) {
            return;
        }

        // Reuse the parsed rules: they are already readable (same origin) and
        // need no second request, so the frame is styled the moment it prints.
        try {
            if (sheet.cssRules) {
                for (let i = 0; i < sheet.cssRules.length; i++) {
                    FP_chunks.push(sheet.cssRules[i].cssText);
                }
                return;
            }
        } catch (error) {
            // Cross-origin stylesheet: not readable from here, fetch it instead.
        }

        if (FP_href) {
            FP_chunks.push('@import url("' + FP_href.replace(/"/g, '\\"') + '");');
        }
    });

    return FP_chunks.join('\n');
}

// Function to print only the timetable container.
//
// The timetable is printed from its own hidden iframe that holds the timetable
// and its styles — not the page it sits on. The old approach hid the page's
// other elements with `@media print`, which depended on every theme's print CSS
// behaving: a theme that hides <body>, repositions the content or prints its
// header and footer left a white page or extra furniture. With a frame, what
// reaches the printer is exactly the timetable, whatever the theme does.
function FP_printTimetable() {
    if (FP_printInProgress) {
        return;
    }

    const FP_printContent = document.getElementById('fiveprayer-div-to');
    if (!FP_printContent || !document.body) {
        return;
    }

    FP_printInProgress = true;

    const FP_frame = document.createElement('iframe');
    FP_frame.id = 'FP-print-frame';
    FP_frame.setAttribute('aria-hidden', 'true');
    FP_frame.setAttribute('tabindex', '-1');
    // A frame that is never laid out prints nothing, so it is rendered at page
    // size and parked off-screen instead of `display: none`.
    FP_frame.style.cssText = 'position:fixed;top:0;left:-10000px;width:1024px;height:768px;border:0;pointer-events:none;';
    document.body.appendChild(FP_frame);

    const FP_frameWindow = FP_frame.contentWindow;
    const FP_doc = FP_frameWindow.document;

    let FP_cleaned = false;

    const FP_cleanupPrint = function() {
        if (FP_cleaned) {
            return;
        }
        FP_cleaned = true;
        window.removeEventListener('afterprint', FP_cleanupPrint);
        FP_frameWindow.removeEventListener('afterprint', FP_cleanupPrint);
        FP_frame.remove();
        window.setTimeout(function() {
            FP_printInProgress = false;
        }, 500);
    };

    // A fresh, empty document: no part of the page's own markup is reused.
    FP_doc.open();
    FP_doc.write('<!DOCTYPE html><html><head><title></title></head><body></body></html>');
    FP_doc.close();

    const FP_addStyle = function(css, id) {
        const FP_style = FP_doc.createElement('style');
        FP_style.id = id;
        FP_style.textContent = css;
        FP_doc.head.appendChild(FP_style);
    };

    FP_addStyle(FP_collectTimetableStyles(), 'FP-print-timetable-styles');
    FP_addStyle(FP_PRINT_FRAME_CSS, 'FP-print-frame-styles');

    // `about:blank` has no base URL, so a relative image source (the printer
    // logo) would not resolve; point it at the page being printed.
    const FP_base = FP_doc.createElement('base');
    FP_base.href = document.baseURI || window.location.href;
    FP_doc.head.appendChild(FP_base);

    const FP_clone = FP_printContent.cloneNode(true);

    // The month picker and the print button are page controls, not timetable.
    FP_clone.querySelectorAll('#fiveprayer-no-print, .fiveprayer__printer_option, .fiveprayer-hide-on-print').forEach(function(element) {
        element.remove();
    });

    FP_doc.body.appendChild(FP_clone);

    let FP_printSent = false;

    const FP_printFrame = function() {
        if (FP_printSent) {
            return;
        }
        FP_printSent = true;

        try {
            FP_frameWindow.focus();
            FP_frameWindow.print();
        } catch (error) {
            FP_cleanupPrint();
        }
    };

    // Wait for the logo (if there is one) so it is not missing from the sheet,
    // but never hold the dialog for an image that will not load.
    const FP_pendingImages = Array.prototype.filter.call(FP_doc.images, function(image) {
        return !image.complete;
    });

    if (!FP_pendingImages.length) {
        window.setTimeout(FP_printFrame, 50);
    } else {
        let FP_remaining = FP_pendingImages.length;
        const FP_imageSettled = function() {
            FP_remaining -= 1;
            if (FP_remaining <= 0) {
                FP_printFrame();
            }
        };

        FP_pendingImages.forEach(function(image) {
            image.addEventListener('load', FP_imageSettled);
            image.addEventListener('error', FP_imageSettled);
        });

        window.setTimeout(FP_printFrame, 1500);
    }

    // Clean up when the dialog closes, plus a fallback in case the browser never
    // reports it (cancelled dialog, an embedded webview) so the print button
    // cannot stay stuck.
    FP_frameWindow.addEventListener('afterprint', FP_cleanupPrint);
    window.addEventListener('afterprint', FP_cleanupPrint);
    window.setTimeout(FP_cleanupPrint, 60000);
}

// Function to check URL for print parameter and trigger print
function FP_checkURLForPrintTrigger() {
    const urlParams = new URLSearchParams(window.location.search);
    const printTrigger = urlParams.get('fp_print');

    if (printTrigger === '1' || printTrigger === 'true') {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(FP_printTimetable, 500);
            });
        } else {
            setTimeout(FP_printTimetable, 500);
        }
    }
}

// Flag to prevent multiple auto-print triggers (use var and check to avoid redeclaration errors)
if (typeof FP_autoPrintTriggered === 'undefined') {
    var FP_autoPrintTriggered = false;
}

// Flag to prevent print from being called multiple times
if (typeof FP_printInProgress === 'undefined') {
    var FP_printInProgress = false;
}

// Function to check if current page matches auto-print page URL and trigger print
function FP_checkAutoPrintPageUrl() {
    if (FP_autoPrintTriggered) {
        return;
    }

    const config = typeof fiveprayer_dynamic !== 'undefined' ? fiveprayer_dynamic :
                   (typeof fiveprayer_ajax !== 'undefined' ? fiveprayer_ajax : null);

    const autoPrintPageUrl = config && config.auto_print_page_url
        ? config.auto_print_page_url
        : '';

    if (!autoPrintPageUrl) {
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const printMonth = urlParams.get('print_month');

    if (!printMonth) {
        return;
    }

    const currentPath = window.location.pathname;
    const currentHref = window.location.href;

    const normalizedAutoPrintUrl = autoPrintPageUrl.toLowerCase().replace(/\/$/, '').replace(/^https?:\/\/[^\/]+/i, '');
    const normalizedCurrentPath = currentPath.toLowerCase().replace(/\/$/, '');

    const isExactMatch = normalizedCurrentPath === normalizedAutoPrintUrl;
    const isContainsMatch = normalizedCurrentPath.includes(normalizedAutoPrintUrl);
    const isHrefMatch = currentHref.includes(autoPrintPageUrl);

    if (isExactMatch || isContainsMatch || isHrefMatch) {
        FP_autoPrintTriggered = true;
        FP_selectMonthAndPrint(printMonth);
    }
}

// Function to select a month and then print
function FP_selectMonthAndPrint(monthValue) {
    const monthSelect = document.querySelector('.fiveprayer__select');
    if (!monthSelect) {
        setTimeout(FP_printTimetable, 500);
        return;
    }

    monthSelect.value = monthValue;

    const ajaxUrl = (typeof fiveprayer_ajax !== 'undefined' && fiveprayer_ajax.ajaxurl)
        ? fiveprayer_ajax.ajaxurl
        : '/wp-admin/admin-ajax.php';

    const nonce = (typeof fiveprayer_ajax !== 'undefined' && fiveprayer_ajax.nonce)
        ? fiveprayer_ajax.nonce
        : '';

    const formData = new FormData();
    formData.append('action', 'fiveprayer_load_timetable');
    formData.append('month', monthValue);
    formData.append('nonce', nonce);
    formData.append('fp_clear_cache', '1');

    fetch(ajaxUrl, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const container = document.getElementById('fiveprayer-div-to');
            if (container) {
                FP_applyTimetableMarkup(container, data.data);
            }

            setTimeout(() => {
                FP_printTimetable();
            }, 500);
        } else {
            setTimeout(FP_printTimetable, 500);
        }
    })
    .catch(error => {
        setTimeout(FP_printTimetable, 500);
    });
}

// Function to attach the click event listener for printing
function FP_attachClickListenerPrinter() {
    // Remove existing listeners to prevent duplicates
    const FP_printButtons = document.querySelectorAll('.fiveprayer__clickPrint');
    FP_printButtons.forEach(button => {
        // Check if the button already has our listener attached
        if (!button.hasAttribute('data-FP-print-initialized')) {
            button.setAttribute('data-FP-print-initialized', 'true');
            button.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                FP_printTimetable();
            }, true);
        }
    });
    
    // Also attach to link elements with data-print-trigger attribute
    const FP_printLinks = document.querySelectorAll('[data-print-trigger="print"]');
    FP_printLinks.forEach(link => {
        if (!link.hasAttribute('data-FP-link-initialized')) {
            link.setAttribute('data-FP-link-initialized', 'true');
            link.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                FP_printTimetable();
            }, true);
        }
    });
}

// Function to handle month selection change
function FP_handleChange(event) {
    event.preventDefault(); // Prevent default form submission
    event.stopPropagation(); // Stop event from bubbling up

    // Store reference to the original form before updating the container
    const FP_originalForm = event.target.closest('form');
    const FP_month = event.target.value;
    const FP_container = document.getElementById('fiveprayer-div-to');

    if (!FP_month || !FP_container) {
        return;
    }

    // Store the original content in case of error, but don't show loading indicator
    const FP_originalContent = FP_container.innerHTML;

    // Prepare AJAX request using WordPress AJAX
    const FP_formData = new FormData();
    FP_formData.append('action', 'fiveprayer_load_timetable');
    FP_formData.append('month', FP_month);
    FP_formData.append('nonce', fiveprayer_ajax?.nonce || ''); // Nonce from WordPress localized script

    fetch(fiveprayer_ajax?.ajaxurl || window.ajaxurl || '/wp-admin/admin-ajax.php', {
        method: 'POST',
        body: FP_formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Store the current month value before updating the container
            const FP_requestedMonth = FP_month;

            FP_applyTimetableMarkup(FP_container, data.data);
            // Reinitialize any necessary JavaScript functionality after content is loaded
            FP_attachClickListenerPrinter(); // Reattach print button listener

            // Manipulate the select element immediately after content update to prevent visual flicker
            const FP_newSelect = FP_container.querySelector('.fiveprayer__select');
            if (FP_newSelect) {
                // Ensure the requested month value is set correctly
                const FP_monthToSelect = FP_requestedMonth;

                // Set the value directly on the select element to prevent flickering
                FP_newSelect.value = FP_monthToSelect;

                // Manually set the selected attribute on the correct option element
                const FP_options = FP_newSelect.querySelectorAll('option');
                FP_options.forEach(option => {
                    if (parseInt(option.value) === parseInt(FP_monthToSelect)) {
                        option.selected = true;
                        option.setAttribute('selected', 'selected');
                    } else {
                        option.selected = false;
                        option.removeAttribute('selected');
                    }
                });

                // Don't reattach the event listener here to avoid recursive calls
                // The global DOMContentLoaded listener will handle all elements on the page
                // Avoiding reattachment prevents the infinite loop issue
                
                // However, we need to reattach the change listener to the new select element
                // Remove any existing event listeners by cloning
                const FP_selectClone = FP_newSelect.cloneNode(true);
                FP_newSelect.parentNode.replaceChild(FP_selectClone, FP_newSelect);
                FP_selectClone.addEventListener('change', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    FP_handleChange(e);
                });
            }

            // Focus on the timetable container to maintain user position
            // Use setTimeout to ensure DOM is updated before scrolling
            setTimeout(() => {
                const FP_timetableContainer = document.getElementById('fiveprayer-div-to');
                if (FP_timetableContainer) {
                    // Using scrollIntoView with instant behavior to ensure it works reliably
                    FP_timetableContainer.scrollIntoView({ behavior: 'instant', block: 'start' });

                    // Then apply smooth scrolling if needed after a brief moment
                    setTimeout(() => {
                        FP_timetableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 10);
                } else {
                    // Fallback to the general container if the specific one isn't found
                    FP_container.scrollIntoView({ behavior: 'instant', block: 'start' });
                }
            }, 10); // Small delay to ensure DOM update
        } else {
            FP_container.innerHTML = FP_originalContent; // Revert to original content on error

            // Fallback to form submission if AJAX fails using the stored form reference
            if (FP_originalForm) {
                // Add a hidden field for cache clearing
                let FP_cacheField = FP_originalForm.querySelector('input[name="fp_clear_cache"]');
                if (!FP_cacheField) {
                    FP_cacheField = document.createElement('input');
                    FP_cacheField.type = 'hidden';
                    FP_cacheField.name = 'fp_clear_cache';
                    FP_cacheField.value = '1';
                    FP_originalForm.appendChild(FP_cacheField);
                } else {
                    FP_cacheField.value = '1';
                }

                // Submit the original form as fallback
                FP_originalForm.submit();
            }
        }
    })
    .catch(error => {
        FP_container.innerHTML = FP_originalContent; // Revert to original content on error

        // Fallback to form submission if AJAX fails using the stored form reference
        if (FP_originalForm) {
            // Add a hidden field for cache clearing
            let FP_cacheField = FP_originalForm.querySelector('input[name="fp_clear_cache"]');
            if (!FP_cacheField) {
                FP_cacheField = document.createElement('input');
                FP_cacheField.type = 'hidden';
                FP_cacheField.name = 'fp_clear_cache';
                FP_cacheField.value = '1';
                FP_originalForm.appendChild(FP_cacheField);
            } else {
                FP_cacheField.value = '1';
            }

            // Submit the original form as fallback
            FP_originalForm.submit();
        }
    });
}

// Use MutationObserver to handle dynamically added content
function FP_initMutationObserver() {
    const FP_container = document.getElementById('fiveprayer-div-to');
    if (!FP_container) {
        return;
    }

    const FP_observer = new MutationObserver(function(mutations) {
        let FP_shouldReattach = false;
        mutations.forEach(function(mutation) {
            // Check if new nodes were added that might contain print buttons
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        // Check if the added node or its children contain print buttons
                        if (node.classList && node.classList.contains('fiveprayer__clickPrint')) {
                            FP_shouldReattach = true;
                        } else if (node.querySelector && node.querySelector('.fiveprayer__clickPrint')) {
                            FP_shouldReattach = true;
                        }
                        // Also check for select elements
                        if (node.classList && node.classList.contains('fiveprayer__select')) {
                            FP_shouldReattach = true;
                        } else if (node.querySelector && node.querySelector('.fiveprayer__select')) {
                            FP_shouldReattach = true;
                        }
                    }
                });
            }
        });

        if (FP_shouldReattach) {
            // Add a small delay to ensure DOM is fully updated
            setTimeout(() => {
                FP_attachClickListenerPrinter();
                // Also reattach select listeners
                const FP_newSelect = document.querySelector('.fiveprayer__select');
                if (FP_newSelect && !FP_newSelect.hasAttribute('data-FP-select-initialized')) {
                    const FP_selectClone = FP_newSelect.cloneNode(true);
                    FP_newSelect.parentNode.replaceChild(FP_selectClone, FP_newSelect);
                    FP_selectClone.setAttribute('data-FP-select-initialized', 'true');
                    FP_selectClone.addEventListener('change', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        FP_handleChange(e);
                    });
                }
            }, 50);
        }
    });

    FP_observer.observe(FP_container, {
        childList: true,
        subtree: true
    });
}

// Attach event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check URL for print trigger parameter
    FP_checkURLForPrintTrigger();

    // Check if current page matches auto-print page URL
    FP_checkAutoPrintPageUrl();

    // Initialize custom URL button handler
    FP_attachCustomUrlButtonListeners();

    const FP_selectElement = document.querySelector('.fiveprayer__select');
    if (FP_selectElement) {
        // Remove any existing event listeners to prevent duplicates by cloning the element
        const FP_selectClone = FP_selectElement.cloneNode(true);
        FP_selectElement.parentNode.replaceChild(FP_selectClone, FP_selectElement);
        FP_selectClone.addEventListener('change', function(e) {
            e.preventDefault();
            e.stopPropagation();
            FP_handleChange(e);
        });
    }

    // Also prevent form submission for the month selection form
    const FP_formElement = document.querySelector('#fiveprayer-no-print');
    if (FP_formElement) {
        FP_formElement.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // Trigger the change handler on the select element instead
            const FP_select = FP_formElement.querySelector('.fiveprayer__select');
            if (FP_select) {
                const FP_event = new Event('change', { bubbles: true, cancelable: true });
                FP_select.dispatchEvent(FP_event);
            }
            return false;
        });
    }

    FP_attachClickListenerPrinter();
    FP_initMutationObserver(); // Initialize observer to handle dynamic content
});

// Also initialize for page builders that load content dynamically
if (window.addEventListener) {
    window.addEventListener('load', function() {
        setTimeout(() => {
            FP_attachClickListenerPrinter();
        }, 500);
    });
}