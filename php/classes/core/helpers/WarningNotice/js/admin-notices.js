document.addEventListener('DOMContentLoaded', function() {
    // Toggle functionality
    document.querySelectorAll('.fiveprayer-deprecation-toggle').forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const item = this.closest('.fiveprayer-deprecation-item');
            const details = item.querySelector('.fiveprayer-deprecation-details');
            const isExpanded = this.getAttribute('aria-expanded') === 'true';

            this.setAttribute('aria-expanded', !isExpanded);
            details.classList.toggle('active');

            const icon = this.querySelector('i');
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-up');

            item.querySelectorAll('.fiveprayer-toggle-state span').forEach(span => {
                span.style.display = 'none';
            });

            if (isExpanded) {
                item.querySelector('.fiveprayer-show-when-closed').style.display = 'inline';
            } else {
                item.querySelector('.fiveprayer-show-when-open').style.display = 'inline';
            }
        });
    });

    // Make summary clickable
    document.querySelectorAll('.fiveprayer-deprecation-summary').forEach(summary => {
        summary.addEventListener('click', function(e) {
            if (!e.target.closest('a, button, input')) {
                this.querySelector('.fiveprayer-deprecation-toggle').click();
            }
        });
    });

    // Dismiss functionality
    const dismissBtn = document.querySelector('.fiveprayer-dismiss-notice');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const notice = this.closest('.fiveprayer-deprecation-manager');
            const nonce = notice.dataset.nonce;

            const originalHTML = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Dismissing...';
            this.disabled = true;

            fetch(window.fpNoticeData?.ajaxurl || window.ajaxurl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'fp_dismiss_notice',
                    nonce: nonce
                })
            })
            .then(response => {
                if (!response.ok) throw new Error('Network error');
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    notice.style.opacity = '0';
                    setTimeout(() => {
                        window.location.href = data.data.redirect_url;
                    }, 300);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                this.innerHTML = originalHTML;
                this.disabled = false;
                alert('Failed to dismiss notice. Please try again.');
            });
        });
    }

    // Countdown timer
    function updateCountdown() {
        document.querySelectorAll('.fiveprayer-countdown').forEach(function (el) {
            let remaining = parseInt(el.dataset.remaining) - 1;
            el.dataset.remaining = remaining;

            if (remaining <= 0) {
                el.textContent = '(Now)';
                clearInterval(timer);
                location.reload();
            } else {
                const minutes = Math.floor(remaining / 60);
                const seconds = remaining % 60;
                el.textContent = `(${minutes}m ${seconds}s)`;
            }
        });
    }

    const timer = setInterval(updateCountdown, 1000);
    updateCountdown();
});