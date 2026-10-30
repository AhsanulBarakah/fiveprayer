/**
 * Hijri Date Updater for FivePrayer (Vanilla JS)
 * 
 * Handles automatic refreshing of Hijri dates at midnight
 */
(function () {
    'use strict';

    class HijriDateUpdater {
        constructor() {
            // Cache frequently used values
            this.ajaxUrl = window.fiveprayer_ajax?.ajaxurl || '';
            this.nonce = window.fiveprayer_ajax?.nonce || '';
            this.lastRefresh = 0;
            this.refreshCooldown = 1000; // 1 second cooldown between refreshes
            
            // Cache selectors
            this.selectors = {
                hijraDate: '.fiveprayer-hijri-date',
                timestamp: '.fiveprayer-timestamp',
                dynamicContainer: '.fiveprayer-dynamic[data-fiveprayer-sc="Fp_Single_Hijra_Date"]',
                body: 'body'
            };
            
            // Cache elements to avoid repeated DOM queries
            this.cachedElements = new Map();
            
            this.init();
        }

        init() {
            this.bindEvents();
            this.scheduleMidnightRefresh();
            this.refreshHijriDate(); // Refresh on page load
        }

        bindEvents() {
            document.addEventListener('fiveprayer:refresh_hijri_date', () => this.refreshHijriDate());

            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    this.refreshHijriDate();
                }
            });
        }
        
        // Cache DOM elements to avoid repeated queries
        getElements(selector) {
            if (!this.cachedElements.has(selector)) {
                this.cachedElements.set(selector, document.querySelectorAll(selector));
            }
            return this.cachedElements.get(selector);
        }

        scheduleMidnightRefresh() {
            const now = new Date();
            const midnight = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 1,
                0, 0, 10
            );

            const msToMidnight = midnight - now;
            if (msToMidnight > 0) {
                setTimeout(() => {
                    this.refreshHijriDate(true);
                    this.scheduleMidnightRefresh(); // Schedule again for next night
                }, msToMidnight);
            }
        }

        async refreshHijriDate(force = false) {
            // Prevent excessive refreshes
            const now = Date.now();
            if (!force && now - this.lastRefresh < this.refreshCooldown) {
                return;
            }
            this.lastRefresh = now;

            // Use cached elements to avoid repeated DOM queries
            const hijraDateElements = this.getElements(this.selectors.hijraDate);
            const dynamicContainers = this.getElements(this.selectors.dynamicContainer);
            const allContainers = [...hijraDateElements, ...dynamicContainers];

            if (allContainers.length === 0) return;

            if (!force) {
                const lastUpdate = localStorage.getItem('fiveprayer_last_hijri_update');
                const today = new Date().toDateString();

                if (lastUpdate === today) return; // Already updated today
            }

            try {
                // Reuse FormData to reduce object creation
                const formData = new FormData();
                formData.append('action', 'fiveprayer_dynamic_content');
                formData.append('content_type', 'hijri_date');
                formData.append('nonce', this.nonce);
                formData.append('_', now); // Cache buster

                const response = await fetch(this.ajaxUrl, {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                if (!response.ok) throw new Error('Network response was not ok');
                const result = await response.json();

                if (result.success && result.data?.html) {
                    // Batch DOM updates for better performance
                    requestAnimationFrame(() => {
                        allContainers.forEach(el => {
                            el.innerHTML = result.data.html;
                        });
                    });

                    localStorage.setItem('fiveprayer_last_hijri_update', new Date().toDateString());

                    const event = new Event('fiveprayer:hijri_date_updated');
                    document.dispatchEvent(event);
                }
            } catch (error) {
                console.error('Failed to update Hijri date:', error);
            }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (typeof window.fiveprayer_ajax !== 'undefined') {
            new HijriDateUpdater();
        }
    });

})();
