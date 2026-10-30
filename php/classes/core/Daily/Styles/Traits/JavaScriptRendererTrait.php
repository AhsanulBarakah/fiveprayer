<?php

namespace FivePrayer\Core\Daily\Styles\Traits;

defined('ABSPATH') || exit;

/**
 * Trait JavaScriptRendererTrait
 *
 * Handles rendering of dynamic JavaScript for prayer timetable interactivity.
 * Extracted from DailyStyleDynamic for code organization.
 */
trait JavaScriptRendererTrait
{
    public function outputBorderScript()
    {
        if (!empty($this->styleData)) {
            // 0 stays 0 (no border); only a missing value becomes the 1px default.
            $border_size = ($this->styleData['borderSize'] === null || $this->styleData['borderSize'] === '')
                ? '1'
                : $this->styleData['borderSize'];
            ?>
            <script class="fiveprayer-border-script">
            document.addEventListener('DOMContentLoaded', function() {
                var borderSize = '<?php echo esc_js($border_size . "px") ?>';
                var borderStyle = '<?php echo esc_js($this->styleData['borderStyle']) ?>';
                var borderColor = '<?php echo $this->styleData['colorBorderC'] ? "rgba(" . esc_js($this->styleData['colorBorderC']["r"] . "," . $this->styleData['colorBorderC']["g"] . "," . $this->styleData['colorBorderC']["b"] . "," . $this->styleData['colorBorderC']["a"]) . ")" : "rgba(0, 0, 0, 0.1)" ?>';
                
                function applyBorders() {
                    var cells = document.querySelectorAll('table.fiveprayer__printer th, table.fiveprayer__printer td, table.fiveprayer__DairyPrayer_ th, table.fiveprayer__DairyPrayer_ td, .fiveprayer__printer th, .fiveprayer__printer td, .fiveprayer__DairyPrayer_ th, .fiveprayer__DairyPrayer_ td');
                    cells.forEach(function(cell) {
                        cell.style.setProperty('border', borderSize + ' ' + borderStyle + ' ' + borderColor, 'important');
                        cell.style.setProperty('border-style', borderStyle, 'important');
                        cell.style.setProperty('border-width', borderSize, 'important');
                        cell.style.setProperty('border-color', borderColor, 'important');
                    });
                }
                
                // Apply borders immediately and watch for changes
                applyBorders();
                setTimeout(applyBorders, 100);
                setTimeout(applyBorders, 500);
                
                if (window.MutationObserver) {
                    new MutationObserver(applyBorders).observe(document.body, { childList: true, subtree: true });
                }
            });
            </script>
            <?php
        }
    }

    public function outputFunctionalityScript()
    {
        ?>
        <script class="fiveprayer-functionality-script">
        document.addEventListener('DOMContentLoaded', function() {
            
            // Print functionality - only for elements that are NOT handled by PrintCalendar.js
            function initPrintFunctionality() {
                var printButtons = document.querySelectorAll('.fiveprayer__clickPrint');
                printButtons.forEach(function(button) {
                    // Skip initialization if button is already handled by PrintCalendar.js (has FP-print-initialized attribute)
                    // OR if button is inside a container that has its own print handler
                    if (button.hasAttribute('data-FP-print-initialized') || 
                        button.closest('#fiveprayer-div-to') || 
                        button.closest('.fiveprayer__printer')) {
                        // This button is handled by PrintCalendar.js or is in a special container, skip it
                        return;
                    }

                    if (!button.hasAttribute('data-fiveprayer-initialized')) {
                        button.setAttribute('data-fiveprayer-initialized', 'true');
                        button.addEventListener('click', function(e) {
                            e.preventDefault();

                            // Hide everything except the monthly timetable
                            var allElements = document.body.querySelectorAll('*');
                            var timetable = document.querySelector('.fiveprayer__printer');

                            // Store the original display properties to restore later
                            var originalDisplays = {};
                            var elementsToHide = [];

                            allElements.forEach(function(el) {
                                if (el !== timetable && !timetable.contains(el)) {
                                    // Save original display value
                                    originalDisplays[el.uniqueID || el.textContent.substring(0, 10)] = el.style.display;
                                    if (el.style.display !== 'none') {
                                        el.style.display = 'none';
                                        elementsToHide.push(el);
                                    }
                                }
                            });

                            // Show only the timetable and its parent containers
                            if (timetable) {
                                var parent = timetable;
                                while (parent && parent !== document.body) {
                                    parent.style.display = 'block';
                                    parent = parent.parentElement;
                                }
                                timetable.style.display = 'table';

                                // Show timetable content
                                var timetableElements = timetable.querySelectorAll('*');
                                timetableElements.forEach(function(el) {
                                    el.style.display = '';
                                });
                            }

                            // Print and then restore - use a flag to prevent loops
                            var printWindow = window;
                            var originalAfterPrint = printWindow.afterprint;
                            var printHandled = false; // Flag to prevent multiple executions

                            printWindow.afterprint = function() {
                                if (printHandled) return; // Prevent multiple executions
                                printHandled = true;

                                // Restore original display values
                                elementsToHide.forEach(function(el) {
                                    var key = el.uniqueID || el.textContent.substring(0, 10);
                                    el.style.display = originalDisplays[key] || '';
                                    el.removeAttribute('data-print-hidden');
                                });

                                // Reset the afterprint handler to original
                                printWindow.afterprint = originalAfterPrint;
                            };

                            window.print();

                            // Alternative restoration approach with a small delay to handle cancellation
                            // Only run if the afterprint handler hasn't already run
                            setTimeout(function() {
                                if (printHandled) return; // Skip if afterprint already handled it

                                // Restore all elements after printing/cancellation
                                elementsToHide.forEach(function(el) {
                                    var key = el.uniqueID || el.textContent.substring(0, 10);
                                    el.style.display = originalDisplays[key] || '';
                                    el.removeAttribute('data-print-hidden');
                                });
                            }, 1500); // Increased timeout to ensure print dialog is closed

                            return false;
                        }, true);
                    }
                });
            }
            
            // Month selection functionality with AJAX
            function initMonthSelection() {
                // Handle both select elements (old and new classes)
                var monthSelects = document.querySelectorAll('.fiveprayer-select-print select, .fiveprayer__select');
                monthSelects.forEach(function(select) {
                    // Skip if already handled by PrintCalendar.js
                    if (select.hasAttribute('data-FP-print-initialized') || 
                        select.closest('#fiveprayer-div-to')) {
                        return;
                    }
                    
                    if (!select.hasAttribute('data-fiveprayer-initialized')) {
                        select.setAttribute('data-fiveprayer-initialized', 'true');
                        
                        // Prevent the hosting theme/plugins from auto-submitting the form on change
                        var parentForm = select.closest('form');
                        if (parentForm && !parentForm.hasAttribute('data-fiveprayer-submit-guard')) {
                            parentForm.setAttribute('data-fiveprayer-submit-guard', 'true');
                            parentForm.addEventListener('submit', function(ev){
                                if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
                                if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
                                if (ev && typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
                                return false;
                            }, true);
                        }

                        select.addEventListener('change', function(e) {
                            e.preventDefault(); // Prevent default form submission
                            e.stopPropagation(); // Stop event from bubbling up

                            var month = this.value;
                            var container = document.getElementById('fiveprayer-div-to');
                            
                            if (!month || !container) return;

                            // Store the original content in case of error, but don't show loading indicator
                            var originalContent = container.innerHTML;
                            var requestedMonth = month;

                            // Prepare AJAX request using WordPress AJAX
                            var formData = new FormData();
                            formData.append('action', 'fiveprayer_load_timetable');
                            formData.append('month', month);
                            formData.append('nonce', typeof fiveprayer_ajax !== 'undefined' ? fiveprayer_ajax.nonce : ''); // Nonce from WordPress localized script

                            fetch(typeof fiveprayer_ajax !== 'undefined' ? fiveprayer_ajax.ajaxurl : (window.ajaxurl || '/wp-admin/admin-ajax.php'), {
                                method: 'POST',
                                body: formData
                            })
                            .then(function(response) {
                                return response.json();
                            })
                            .then(function(data) {
                                if (data.success) {
                                    container.innerHTML = data.data;
                                    // Reinitialize any necessary JavaScript functionality after content is loaded
                                    
                                    // Reattach month change listener if needed in the new content
                                    var newSelect = container.querySelector('.fiveprayer__select');
                                    if (newSelect) {
                                        // Set the selected value to the month that was just requested
                                        newSelect.value = requestedMonth;
                                        
                                        // Manually set the selected attribute on the correct option
                                        var options = newSelect.querySelectorAll('option');
                                        options.forEach(function(option) {
                                            if (option.value == requestedMonth) {
                                                option.selected = true;
                                                option.setAttribute('selected', 'selected');
                                            } else {
                                                option.selected = false;
                                                option.removeAttribute('selected');
                                            }
                                        });
                                        
                                        // Simply reattach the event listener without creating a recursive call
                                        // Don't try to remove the current handler using arguments.callee as it's deprecated
                                        // The new content will have fresh event listeners from the DOMContentLoaded handler
                                    }
                                    
                                    // Focus on the timetable container to maintain user position
                                    // Use setTimeout to ensure DOM is updated before scrolling
                                    setTimeout(function() {
                                        var timetableContainer = document.getElementById('fiveprayer-div-to');
                                        if (timetableContainer) {
                                            // Using scrollIntoView with instant behavior to ensure it works reliably
                                            timetableContainer.scrollIntoView({ behavior: 'instant', block: 'start' });
                                            
                                            // Then apply smooth scrolling if needed after a brief moment
                                            setTimeout(function() {
                                                timetableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }, 10);
                                        } else {
                                            // Fallback to the general container if the specific one isn't found
                                            container.scrollIntoView({ behavior: 'instant', block: 'start' });
                                        }
                                    }, 10); // Small delay to ensure DOM update
                                } else {
                                    console.error('Error loading timetable:', data.data || data);
                                    container.innerHTML = originalContent; // Revert to original content on error
                                    
                                    // Fallback to form submission if AJAX fails
                                    var form = this.closest('form');
                                    if (form) {
                                        // Add a hidden field for cache clearing
                                        var cacheField = document.createElement('input');
                                        cacheField.type = 'hidden';
                                        cacheField.name = 'fp_clear_cache';
                                        cacheField.value = '1';
                                        form.appendChild(cacheField);
                                        
                                        // Submit the form as fallback
                                        form.submit();
                                    }
                                }
                            })
                            .catch(function(error) {
                                console.error('Error loading timetable:', error);
                                container.innerHTML = originalContent; // Revert to original content on error
                                
                                // Fallback to form submission if AJAX fails
                                var form = this.closest('form');
                                if (form) {
                                    // Add a hidden field for cache clearing
                                    var cacheField = document.createElement('input');
                                    cacheField.type = 'hidden';
                                    cacheField.name = 'fp_clear_cache';
                                    cacheField.value = '1';
                                    form.appendChild(cacheField);
                                    
                                    // Submit the form as fallback
                                    form.submit();
                                }
                            });
                        });
                    }
                });
            }
            
            // Highlight functionality - current date row (only for horizontal timetable)
            function initHighlightFunctionality() {
                // Prevent multiple initialization by checking if already initialized
                if (typeof window.fiveprayerHighlightInitialized === 'undefined') {
                    window.fiveprayerHighlightInitialized = true;

                    // Add highlight to current date row (only for horizontal timetable)
                    function highlightCurrentDate() {
                        // Get all timetable containers
                        var timetableContainers = document.querySelectorAll('.fiveprayer__printer');

                        // Process each container separately to avoid cross-contamination
                        timetableContainers.forEach(function(container) {
                            var now = new Date();
                            var currentDate = now.getDate();
                            var currentMonth = now.getMonth() + 1; // Months are 0-indexed
                            var currentYear = now.getFullYear();

                            // Format current date as Y-m-d for comparison
                            var currentDateString = currentYear + '-' +
                                (currentMonth < 10 ? '0' : '') + currentMonth + '-' +
                                (currentDate < 10 ? '0' : '') + currentDate;

                            // Target only rows within this specific container
                            var prayerRows = container.querySelectorAll('tbody tr');

                            // Track if we've found and highlighted the current date to avoid multiple highlights in this container
                            var currentDateHighlighted = false;

                            prayerRows.forEach(function(row, index) {
                                if (index === 0) return; // Skip header row

                                // Check if this row is visible (not hidden by month selection)
                                if (row.style.display === 'none') {
                                    return; // Skip hidden rows
                                }

                                // Use the data-date attribute instead of parsing displayed text
                                var rowDate = row.getAttribute('data-date');
                                if (rowDate && rowDate === currentDateString && !currentDateHighlighted) {
                                    row.classList.add('fiveprayer__today_row');
                                    currentDateHighlighted = true; // Mark that we've added the highlight
                                }
                            });
                        });
                    }

                    // Initial highlight
                    highlightCurrentDate();

                    // Update every minute (in case date changes at midnight) - only set once
                    if (typeof window.fiveprayerHighlightInterval === 'undefined') {
                        window.fiveprayerHighlightInterval = setInterval(highlightCurrentDate, 60000);
                    }
                }
            }
            
            // Initialize all functionality
            function initAll() {
                // Only initialize if PrintCalendar.js is NOT present or not handling the elements
                var hasPrintCalendarJS = typeof FP_printTimetable === 'function';
                
                if (hasPrintCalendarJS) {
                    // PrintCalendar.js is loaded, only initialize highlighting
                    // Let PrintCalendar.js handle print functionality AND month selection
                    initHighlightFunctionality();
                } else {
                    // PrintCalendar.js is not loaded, initialize everything
                    initPrintFunctionality();
                    initMonthSelection();
                    initHighlightFunctionality();
                }
            }
            
            // Run immediately and after delays for dynamic content
            initAll();
            setTimeout(initAll, 100);
            setTimeout(initAll, 500);
            setTimeout(initAll, 1000);
            setTimeout(initAll, 2000);
            setTimeout(initAll, 3000);
            setTimeout(initAll, 5000);
            
            // Watch for DOM changes
            if (window.MutationObserver) {
                new MutationObserver(function() {
                    setTimeout(initAll, 100);
                }).observe(document.body, { childList: true, subtree: true });
            }
            
            // Also run on window load for page builders
            if (window.addEventListener) {
                window.addEventListener('load', function() {
                    setTimeout(initAll, 500);
                });
            }
            
            // Additional check for dynamically loaded content in page builders
            if (typeof jQuery !== 'undefined' && jQuery.fn.on) {
                jQuery(document).on('fiveprayer:contentUpdated', function() {
                    setTimeout(initAll, 100);
                });
            }
            
            // Immediate check for page builders that might have missed DOMContentLoaded
            setTimeout(function() {
                initAll();
            }, 50);
        });
        </script>
        <?php
    }
}
