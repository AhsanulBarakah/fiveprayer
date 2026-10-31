<?php
namespace FivePrayer\Core\Admin\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Security\SecurityHelper;

/** UI rendering helpers for admin settings pages. */
trait UiRendererTrait
{
    private function render_tabs(): void
    {
        $tabs = [
            'data_management' => __('Data Management', 'fiveprayer'),
            'translations' => __('Translations', 'fiveprayer'),
        ];
        $current = $this->get_current_tab();
        echo '<h2 class="nav-tab-wrapper">';
        foreach ($tabs as $key => $label) {
            $class = ($current === $key) ? ' nav-tab nav-tab-active' : ' nav-tab';
            $url = add_query_arg(['page' => 'fiveprayer-settings', 'tab' => $key], admin_url('admin.php'));
            printf('<a href="%s" class="%s">%s</a>', esc_url($url), esc_attr($class), esc_html($label));
        }
        echo '</h2>';
    }

    private function get_current_tab(): string
    {
        $tab = sanitize_text_field(filter_input(INPUT_GET, 'tab') ?: 'data_management');
        $tab = sanitize_key($tab);
        if ($tab === 'logging' || $tab === 'server_info') {
            $tab = 'data_management';
        }
        return $tab ?: 'data_management';
    }

    private function render_toast_notification(): void
    {
        // Same allowlist as the admin notice: the URL carries a code, never
        // message text, so only known strings are rendered.
        $fp_msg      = \FivePrayer\Core\Admin\SettingsAdmin::get_notice_message(
            sanitize_key((string) SecurityHelper::get_sanitized_get_input('fp_msg'))
        );
        $has_updated = SecurityHelper::has_query_arg('updated');
        $has_error   = SecurityHelper::has_query_arg('error');

        if ($fp_msg === '' || (!$has_updated && !$has_error)) {
            return;
        }

        $msg_type = $has_updated ? 'success' : 'error';
        echo '<style>
.fiveprayer-toast-fixed {
    position: fixed; top: 32px; right: 20px; padding: 14px 24px; border-radius: 6px;
    color: #fff; font-weight: 500; font-size: 14px; z-index: 99999; opacity: 1;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 400px; word-wrap: break-word;
    transition: opacity 0.3s ease, transform 0.3s ease;
}
.fiveprayer-toast-fixed.fade-out { opacity: 0; }
.fiveprayer-toast-fixed.success { background: #28a745; border-left: 4px solid #1e7e34; }
.fiveprayer-toast-fixed.error { background: #dc3545; border-left: 4px solid #bd2130; }
</style>';
        echo '<div id="fiveprayer-toast-msg" class="fiveprayer-toast-fixed ' . esc_attr($msg_type) . '">' . esc_html($fp_msg) . '</div>';
        echo '<script>
(function() {
    document.querySelectorAll(".fiveprayer-notice").forEach(function(el) { el.style.display = "none"; });
    var t = document.getElementById("fiveprayer-toast-msg");
    if (t) {
        setTimeout(function() {
            t.classList.add("fade-out");
            setTimeout(function() { t.remove(); }, 300);
        }, 4500);
        if (window.history.replaceState) {
            var url = new URL(window.location.href);
            url.searchParams.delete("fp_msg");
            url.searchParams.delete("updated");
            url.searchParams.delete("error");
            window.history.replaceState({}, "", url);
        }
    }
})();
</script>';
    }

    private function render_confirmation_modal(): void
    {
        echo '<style>
.fiveprayer-modal-overlay {
    display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); z-index: 100000; justify-content: center; align-items: center;
    backdrop-filter: blur(2px);
}
.fiveprayer-modal-overlay.active { display: flex; }
.fiveprayer-modal-box {
    background: #fff; border-radius: 12px; padding: 0; max-width: 420px; width: 90%;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: fiveprayer-modal-in 0.25s ease-out; overflow: hidden;
}
@keyframes fiveprayer-modal-in {
    from { transform: scale(0.9) translateY(20px); opacity: 0; }
    to { transform: scale(1) translateY(0); opacity: 1; }
}
.fiveprayer-modal-header { padding: 24px 24px 0 24px; display: flex; align-items: flex-start; gap: 14px; }
.fiveprayer-modal-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.fiveprayer-modal-icon.warning { background: #fef3cd; color: #856404; }
.fiveprayer-modal-icon.danger { background: #fde8e8; color: #b91c1c; }
.fiveprayer-modal-icon.info { background: #e0f2fe; color: #0369a1; }
.fiveprayer-modal-title { font-size: 16px; font-weight: 600; color: #1d2327; margin: 6px 0 4px 0; line-height: 1.4; }
.fiveprayer-modal-body { padding: 8px 24px 24px 24px; color: #50575e; font-size: 14px; line-height: 1.5; }
.fiveprayer-modal-actions { display: flex; gap: 10px; justify-content: flex-end; padding: 16px 24px; background: #f6f7f7; border-top: 1px solid #dcdcde; }
.fiveprayer-modal-actions .button { min-width: 80px; text-align: center; }
.fiveprayer-modal-actions .button.fiveprayer-btn-cancel { background: #f6f7f7; border: 1px solid #dcdcde; color: #50575e; }
.fiveprayer-modal-actions .button.fiveprayer-btn-cancel:hover { background: #eee; }
.fiveprayer-modal-actions .button.fiveprayer-btn-danger { background: #dc3232; border: 1px solid #dc3232; color: #fff; }
.fiveprayer-modal-actions .button.fiveprayer-btn-danger:hover { background: #b81b1b; border-color: #b81b1b; }
.fiveprayer-modal-actions .button.fiveprayer-btn-confirm { background: #2271b1; border: 1px solid #2271b1; color: #fff; }
.fiveprayer-modal-actions .button.fiveprayer-btn-confirm:hover { background: #135e96; border-color: #135e96; }
</style>';

        echo '<div id="fiveprayer-confirm-modal" class="fiveprayer-modal-overlay">';
        echo '  <div class="fiveprayer-modal-box" id="fiveprayer-modal-box">';
        echo '    <div class="fiveprayer-modal-header">';
        echo '      <div class="fiveprayer-modal-icon danger" id="fiveprayer-modal-icon">&#9888;</div>';
        echo '      <div class="fiveprayer-modal-title" id="fiveprayer-modal-title">' . esc_html__('Confirm Reset', 'fiveprayer') . '</div>';
        echo '    </div>';
        echo '    <div class="fiveprayer-modal-body" id="fiveprayer-modal-body">' . esc_html__('Are you sure you want to proceed?', 'fiveprayer') . '</div>';
        echo '    <div class="fiveprayer-modal-actions">';
        echo '      <button type="button" class="button fiveprayer-btn-cancel" id="fiveprayer-modal-cancel">' . esc_html__('Cancel', 'fiveprayer') . '</button>';
        echo '      <button type="button" class="button fiveprayer-btn-confirm" id="fiveprayer-modal-confirm">' . esc_html__('Yes, Proceed', 'fiveprayer') . '</button>';
        echo '    </div>';
        echo '  </div>';
        echo '</div>';

        echo '<script>
(function() {
    var overlay = document.getElementById("fiveprayer-confirm-modal");
    if (!overlay) return;
    var titleEl = document.getElementById("fiveprayer-modal-title");
    var bodyEl = document.getElementById("fiveprayer-modal-body");
    var iconEl = document.getElementById("fiveprayer-modal-icon");
    var confirmBtn = document.getElementById("fiveprayer-modal-confirm");
    var cancelBtn = document.getElementById("fiveprayer-modal-cancel");
    var pendingForm = null;

    function showModal(opts) {
        if (titleEl) titleEl.textContent = opts.title || "Confirm";
        if (bodyEl) bodyEl.textContent = opts.message || "";
        if (iconEl) { iconEl.className = "fiveprayer-modal-icon " + (opts.iconClass || "warning"); iconEl.innerHTML = opts.iconHTML || "&#9888;"; }
        if (confirmBtn) { confirmBtn.textContent = opts.confirmText || "Yes, Proceed"; confirmBtn.className = "button " + (opts.confirmClass || "fiveprayer-btn-confirm"); }
        if (cancelBtn) cancelBtn.textContent = opts.cancelText || "Cancel";
        overlay.classList.add("active");
        if (cancelBtn) setTimeout(function() { cancelBtn.focus(); }, 100);
    }
    function closeModal(result) {
        overlay.classList.remove("active");
        if (result && pendingForm) {
            var form = pendingForm; pendingForm = null;
            form.removeAttribute("data-confirm");
            var btn = document.createElement("input"); btn.type = "submit"; btn.style.display = "none";
            form.appendChild(btn); btn.click();
        } else { pendingForm = null; }
    }
    confirmBtn.onclick = function() { closeModal(true); };
    cancelBtn.onclick = function() { closeModal(false); };
    overlay.addEventListener("click", function(e) { if (e.target === overlay) closeModal(false); });
    document.addEventListener("keydown", function(e) { if (e.key === "Escape" && overlay.classList.contains("active")) closeModal(false); });
    document.addEventListener("submit", function(e) {
        var form = e.target;
        if (!form || !form.getAttribute || !form.hasAttribute("data-confirm")) return;
        e.preventDefault();
        var opts;
        try { opts = JSON.parse(form.getAttribute("data-confirm")); } catch (x) { return; }
        if (!opts || typeof opts !== "object") return;
        pendingForm = form;
        showModal(opts);
    });
})();
</script>';
    }

    private function render_translations_tab(): void
    {
        $import_nonce = wp_create_nonce('fiveprayer_import_translations');
        $soft_nonce   = wp_create_nonce('fiveprayer_reset_defaults_soft');
        $hard_nonce   = wp_create_nonce('fiveprayer_reset_defaults_hard');
        $export_nonce = wp_create_nonce('fiveprayer_export_translations');

        $this->render_toast_notification();
        $this->render_confirmation_modal();

        echo '<h2>' . esc_html__('Translations', 'fiveprayer') . '</h2>';
        echo '<p>' . esc_html__('Manage default translations, import/export custom translations, and reset behavior.', 'fiveprayer') . '</p>';

        // Export
        echo '<div class="card" style="margin-top: 20px;"><h3>' . esc_html__('Export Current Translations', 'fiveprayer') . '</h3>';
        echo '<p>' . esc_html__('Download all current translations as a JSON file for backup or migration.', 'fiveprayer') . '</p>';
        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
        echo '<input type="hidden" name="action" value="fiveprayer_export_translations" /><input type="hidden" name="_wpnonce" value="' . esc_attr($export_nonce) . '" />';
        submit_button(__('Download Translations JSON', 'fiveprayer'), 'primary');
        echo '</form></div>';

        // Import
        echo '<div class="card" style="margin-top: 20px;"><h3>' . esc_html__('Import Translations (JSON)', 'fiveprayer') . '</h3>';
        echo '<p>' . esc_html__('Import translations from a JSON file. This will merge with existing translations and preserve any custom languages you have added.', 'fiveprayer') . '</p>';
        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" enctype="multipart/form-data">';
        echo '<input type="hidden" name="action" value="fiveprayer_import_translations" /><input type="hidden" name="_wpnonce" value="' . esc_attr($import_nonce) . '" />';
        echo '<input type="file" name="translations_json" accept="application/json" required /> ';
        submit_button(__('Import to Database', 'fiveprayer'), 'primary');
        echo '</form></div>';

        // Soft Reset
        echo '<div class="card fiveprayer-card-success" style="margin-top: 20px;"><h3>' . esc_html__('Reset Defaults (Keep Custom Languages)', 'fiveprayer') . '</h3>';
        echo '<p>' . esc_html__('Restore default translation texts while keeping any custom languages you have added.', 'fiveprayer') . '</p>';
        $soft_opts = ['title' => __('Restore Defaults?', 'fiveprayer'), 'message' => __('This will restore default translation texts while keeping any custom languages you have added.', 'fiveprayer'), 'confirmText' => __('Yes, Restore Defaults', 'fiveprayer'), 'cancelText' => __('Cancel', 'fiveprayer'), 'iconClass' => 'info', 'iconHTML' => '&#9432;', 'confirmClass' => 'fiveprayer-btn-confirm'];
        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" data-confirm="' . esc_attr(wp_json_encode($soft_opts)) . '">';
        echo '<input type="hidden" name="action" value="fiveprayer_reset_defaults_soft" /><input type="hidden" name="_wpnonce" value="' . esc_attr($soft_nonce) . '" />';
        submit_button(__('Restore Default Texts Only', 'fiveprayer'), 'secondary');
        echo '</form></div>';

        // Hard Reset
        echo '<div class="card fiveprayer-card-danger" style="margin-top: 20px;"><h3>' . esc_html__('Hard Reset (Remove Custom Translations)', 'fiveprayer') . '</h3>';
        echo '<p>' . esc_html__('Delete all custom translations and restore to factory defaults.', 'fiveprayer') . '</p>';
        $hard_opts = ['title' => __('Hard Reset?', 'fiveprayer'), 'message' => __('Are you sure you want to hard reset all translations? This will remove all custom languages and restore factory defaults.', 'fiveprayer'), 'confirmText' => __('Yes, Reset Everything', 'fiveprayer'), 'cancelText' => __('Cancel', 'fiveprayer'), 'iconClass' => 'danger', 'iconHTML' => '&#9888;', 'confirmClass' => 'fiveprayer-btn-danger'];
        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" data-confirm="' . esc_attr(wp_json_encode($hard_opts)) . '">';
        echo '<input type="hidden" name="action" value="fiveprayer_reset_defaults_hard" /><input type="hidden" name="_wpnonce" value="' . esc_attr($hard_nonce) . '" />';
        submit_button(__('Reset to Defaults and Remove Custom', 'fiveprayer'), 'delete');
        echo '</form></div>';
    }

    private function render_data_management_tab(): void
    {
        $import_nonce = wp_create_nonce('fiveprayer_import_settings');
        $export_nonce = wp_create_nonce('fiveprayer_export_settings');
        $reset_nonce = wp_create_nonce('fiveprayer_reset_settings_defaults');
        $soft_reset_nonce = wp_create_nonce('fiveprayer_reset_settings_defaults_soft');

        $this->render_toast_notification();
        $this->render_confirmation_modal();

        echo '<h2>' . esc_html__('Prayer Settings Data Management', 'fiveprayer') . '</h2>';
        echo '<p>' . esc_html__('Export, import, or reset your prayer calculation settings.', 'fiveprayer') . '</p>';

        $this->render_performance_health_panel();

        // Export
        echo '<div class="card" style="margin-top: 20px;"><h3>' . esc_html__('Export Settings', 'fiveprayer') . '</h3>';
        echo '<p>' . esc_html__('Download all current prayer settings as a JSON file.', 'fiveprayer') . '</p>';
        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
        echo '<input type="hidden" name="action" value="fiveprayer_export_settings" /><input type="hidden" name="_wpnonce" value="' . esc_attr($export_nonce) . '" />';
        submit_button(__('Export Settings JSON', 'fiveprayer'), 'primary');
        echo '</form></div>';

        // Import
        echo '<div class="card" style="margin-top: 20px;"><h3>' . esc_html__('Import Settings', 'fiveprayer') . '</h3>';
        echo '<p>' . esc_html__('Import prayer settings from a JSON file.', 'fiveprayer') . '</p>';
        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" enctype="multipart/form-data">';
        echo '<input type="hidden" name="action" value="fiveprayer_import_settings" /><input type="hidden" name="_wpnonce" value="' . esc_attr($import_nonce) . '" />';
        echo '<input type="file" name="settings_json" accept="application/json" required /> ';
        submit_button(__('Import Settings', 'fiveprayer'), 'primary');
        echo '</form></div>';

        // Soft Reset
        echo '<div class="card fiveprayer-card-success" style="margin-top: 20px;"><h3>' . esc_html__('Restore Default Settings (Keep Custom Entries)', 'fiveprayer') . '</h3>';
        echo '<p>' . esc_html__('Restore default prayer calculation settings while keeping any custom entries.', 'fiveprayer') . '</p>';
        $soft_opts = ['title' => __('Restore Defaults?', 'fiveprayer'), 'message' => __('This will restore default prayer calculation settings while keeping any custom entries.', 'fiveprayer'), 'confirmText' => __('Yes, Restore Defaults', 'fiveprayer'), 'cancelText' => __('Cancel', 'fiveprayer'), 'iconClass' => 'info', 'iconHTML' => '&#9432;', 'confirmClass' => 'fiveprayer-btn-confirm'];
        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" data-confirm="' . esc_attr(wp_json_encode($soft_opts)) . '">';
        echo '<input type="hidden" name="action" value="fiveprayer_reset_settings_defaults_soft" /><input type="hidden" name="_wpnonce" value="' . esc_attr($soft_reset_nonce) . '" />';
        submit_button(__('Restore Defaults Only', 'fiveprayer'), 'secondary');
        echo '</form></div>';

        // Hard Reset
        echo '<div class="card fiveprayer-card-danger" style="margin-top: 20px;"><h3>' . esc_html__('Hard Reset (Remove All Custom Entries)', 'fiveprayer') . '</h3>';
        echo '<p>' . esc_html__('Delete all prayer calculation settings and restore to factory defaults.', 'fiveprayer') . '</p>';
        $hard_opts = ['title' => __('Hard Reset?', 'fiveprayer'), 'message' => __('Are you sure you want to hard reset all settings? This will remove all custom entries and restore factory defaults.', 'fiveprayer'), 'confirmText' => __('Yes, Reset Everything', 'fiveprayer'), 'cancelText' => __('Cancel', 'fiveprayer'), 'iconClass' => 'danger', 'iconHTML' => '&#9888;', 'confirmClass' => 'fiveprayer-btn-danger'];
        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" data-confirm="' . esc_attr(wp_json_encode($hard_opts)) . '">';
        echo '<input type="hidden" name="action" value="fiveprayer_reset_settings_defaults" /><input type="hidden" name="_wpnonce" value="' . esc_attr($reset_nonce) . '" />';
        submit_button(__('Hard Reset to Defaults', 'fiveprayer'), 'delete');
        echo '</form></div>';
    }

    /**
     * Render the performance health panel: persistent object-cache status and
     * the timetable index / sargable-query regression checks.
     */
    private function render_performance_health_panel(): void
    {
        if (!function_exists('fiveprayer_get_object_cache_status')) {
            return;
        }

        $cache = fiveprayer_get_object_cache_status();
        $check = function_exists('fiveprayer_run_timetable_query_regression_check')
            ? fiveprayer_run_timetable_query_regression_check()
            : ['passed' => false, 'checks' => []];

        echo '<details class="card" style="margin-top: 20px; padding: 0;">';
        echo '<summary style="cursor: pointer; padding: 14px 20px; font-size: 1.1em; font-weight: 600;">' . esc_html__('Performance Health', 'fiveprayer') . '</summary>';
        echo '<div style="padding: 0 20px 16px;">';
        echo '<table class="widefat striped" style="max-width: 820px;">';
        echo '<tbody>';

        // Persistent object cache.
        $cache_active = !empty($cache['enabled']);
        echo '<tr>';
        echo '<td style="width: 32%;"><strong>' . esc_html__('Persistent object cache', 'fiveprayer') . '</strong></td>';
        $cache_badge = $this->render_status_badge(
            $cache_active ? 'success' : 'warning',
            $cache_active ? __('Active', 'fiveprayer') : __('Inactive', 'fiveprayer')
        );
        echo '<td>' . wp_kses_post($cache_badge) . ' ' . esc_html($cache['backend']) . '</td>';
        echo '<td>' . esc_html(
            $cache_active
                ? __('Timetable and settings caches are shared across requests.', 'fiveprayer')
                : __('Caches are per-request only. A persistent object cache makes repeat page loads faster.', 'fiveprayer')
        ) . '</td>';
        echo '</tr>';

        // Server-side cache capabilities, so users can see what their host offers.
        $extensions    = isset($cache['extensions']) && is_array($cache['extensions']) ? $cache['extensions'] : array();
        $redis_ext     = !empty($extensions['redis']);
        $memcached_ext = !empty($extensions['memcached']);
        echo '<tr>';
        echo '<td><strong>' . esc_html__('Cache server extensions', 'fiveprayer') . '</strong></td>';
        echo '<td>';
        echo wp_kses_post(
            $this->render_status_badge(
                $redis_ext ? 'success' : 'warning',
                $redis_ext ? __('Redis extension: enabled', 'fiveprayer') : __('Redis extension: not installed', 'fiveprayer')
            )
        );
        echo ' ';
        echo wp_kses_post(
            $this->render_status_badge(
                $memcached_ext ? 'success' : 'warning',
                $memcached_ext ? __('Memcached extension: enabled', 'fiveprayer') : __('Memcached extension: not installed', 'fiveprayer')
            )
        );
        echo '</td>';
        echo '<td>' . esc_html__('PHP support for Redis/Memcached on this server. An enabled extension does not turn on caching by itself.', 'fiveprayer') . '</td>';
        echo '</tr>';

        // Timetable index and sargable-query regression checks.
        foreach ($check['checks'] as $item) {
            echo '<tr>';
            echo '<td><strong>' . esc_html($item['label']) . '</strong></td>';
            $check_badge = $this->render_status_badge(
                $item['passed'] ? 'success' : 'error',
                $item['passed'] ? __('Pass', 'fiveprayer') : __('Fail', 'fiveprayer')
            );
            echo '<td>' . wp_kses_post($check_badge) . '</td>';
            echo '<td>' . esc_html($item['detail']) . '</td>';
            echo '</tr>';
        }

        echo '</tbody></table>';

        // Automatic + manual connection test so users need to know nothing.
        $test_url   = esc_url_raw(rest_url('fiveprayer/v1/diagnostics/object-cache-connection'));
        $test_nonce = wp_create_nonce('wp_rest');
        echo '<p style="margin: 12px 0 0;">';
        echo '<button type="button" class="button" id="fiveprayer-cache-conn-test">' . esc_html__('Test cache connection', 'fiveprayer') . '</button>';
        echo ' <span id="fiveprayer-cache-conn-result" style="margin-left: 8px;"></span>';
        echo '</p>';
        printf(
            '<script>window.fpCacheConnTest = %s;</script>',
            wp_json_encode([
                'url'    => $test_url,
                'nonce'  => $test_nonce,
                'auto'   => !$cache_active,
                'labels' => [
                    'testing' => __('Checking this server for a Redis or Memcached cache…', 'fiveprayer'),
                    'found'   => __('Good news — your server provides a cache we can reach. Use this address in your cache plugin:', 'fiveprayer'),
                    'none'    => __('We could not reach any Redis or Memcached server. This is optional — you do not need to do anything if you do not have one. If you would like it, ask your host:', 'fiveprayer'),
                    'ask'     => __('"Do you provide Redis or Memcached object caching for WordPress, and how do I enable it?"', 'fiveprayer'),
                    'checked' => __('addresses checked', 'fiveprayer'),
                    'failed'  => __('The connection test could not run. Please try again.', 'fiveprayer'),
                ],
            ])
        );
        echo '<script>
        (function () {
            var cfg = window.fpCacheConnTest;
            var btn = document.getElementById("fiveprayer-cache-conn-test");
            var out = document.getElementById("fiveprayer-cache-conn-result");
            if (!cfg || !out) { return; }

            var hasRun = false;

            function run() {
                hasRun = true;
                if (btn) { btn.disabled = true; }
                out.style.color = "";
                out.textContent = cfg.labels.testing;
                fetch(cfg.url, { headers: { "X-WP-Nonce": cfg.nonce }, credentials: "same-origin" })
                    .then(function (res) { return res.json(); })
                    .then(function (data) {
                        if (data && data.any_reachable && data.reachable && data.reachable.length) {
                            var found = data.reachable.map(function (item) {
                                var where = item.target + (item.source ? " (" + item.source + ")" : "");
                                return item.backend + " " + where;
                            }).join(", ");
                            out.style.color = "#1e7e34";
                            out.textContent = cfg.labels.found + " " + found;
                        } else {
                            out.style.color = "#b32d2e";
                            out.textContent = cfg.labels.none + " " + cfg.labels.ask +
                                " (" + ((data && data.checked) ? data.checked : 0) + " " + cfg.labels.checked + ")";
                        }
                    })
                    .catch(function () { out.style.color = "#b32d2e"; out.textContent = cfg.labels.failed; })
                    .then(function () { if (btn) { btn.disabled = false; } });
            }

            if (btn) { btn.addEventListener("click", run); }
            if (cfg.auto && !hasRun) {
                // Only test automatically once the user opens the section.
                var panel = out.closest("details");
                if (panel && !panel.open) {
                    panel.addEventListener("toggle", function () { if (panel.open && !hasRun) { run(); } }, { once: true });
                } else {
                    run();
                }
            }
        })();
        </script>';

        $dropin_path   = defined('WP_CONTENT_DIR') ? WP_CONTENT_DIR . '/object-cache.php' : '';
        $dropin_exists = $dropin_path !== '' && file_exists($dropin_path);

        echo '<p style="margin: 12px 0 0; max-width: 820px;">';
        if ($cache_active) {
            echo '<strong>' . esc_html__('No action needed', 'fiveprayer') . '</strong><br>';
            echo esc_html__('A persistent object cache is already active and FivePrayer uses it automatically. Do not install another object-cache plugin — only one object-cache.php drop-in can be active at a time.', 'fiveprayer');
        } else {
            $capable = function_exists('fiveprayer_get_object_cache_capable_plugins')
                ? fiveprayer_get_object_cache_capable_plugins()
                : array();

            echo '<strong>' . esc_html__('You do not need to provide a host — this is optional', 'fiveprayer') . '</strong><br>';
            echo esc_html__('If you do not have a Redis or Memcached server, or you do not know its host or port, you do not need to worry and you do not need to do anything. This is only used to make repeat page loads faster, and FivePrayer works normally without it.', 'fiveprayer') . '<br><br>';
            echo '<strong>' . esc_html__('If you would like the extra speed, here is what to do', 'fiveprayer') . '</strong><br>';
            echo esc_html__('You do not need to understand it or edit any files — just follow these simple steps:', 'fiveprayer') . '<br>';
            echo esc_html__('1. Look at the result just above. We check this server for you automatically.', 'fiveprayer') . '<br>';

            if (!empty($capable)) {
                echo esc_html(sprintf(
                    /* translators: %s: comma-separated list of active caching plugin names. */
                    __('2. If a cache was found: open %s and turn on its Object Cache option. You do not need to install anything new.', 'fiveprayer'),
                    implode(', ', $capable)
                )) . '<br>';
            } else {
                echo esc_html__('2. If a cache was found: turn on the Object Cache option in your caching plugin (for example LiteSpeed Cache, W3 Total Cache or Redis Object Cache). You do not need to install anything new if you already use one.', 'fiveprayer') . '<br>';
            }

            echo esc_html__('3. If no cache was found: ask your host — "Do you provide Redis or Memcached object caching for WordPress, and how do I enable it?" Most hosts will switch it on for you.', 'fiveprayer') . '<br>';
            echo esc_html__('4. Reload this page after your host enables it. It should then say Active — there is nothing else you need to do.', 'fiveprayer');

            if ($dropin_exists) {
                echo '<br><br>' . esc_html__('For your host or developer: an object-cache.php file is present on this site but is not working, which stops a real cache from being used. Ask them to remove it so the cache plugin can install its own.', 'fiveprayer');
            }
        }
        echo '</p>';

        echo '</div></details>';
    }

    /**
     * Small inline status pill used by the health panel.
     *
     * @param string $type One of success, warning, error.
     */
    private function render_status_badge(string $type, string $text): string
    {
        $colors = [
            'success' => ['bg' => '#edfaef', 'fg' => '#1e7e34', 'border' => '#46b450'],
            'warning' => ['bg' => '#fef8e7', 'fg' => '#8a6d00', 'border' => '#dba617'],
            'error'   => ['bg' => '#fdeaea', 'fg' => '#b32d2e', 'border' => '#dc3232'],
        ];
        $color = $colors[$type] ?? $colors['warning'];

        return sprintf(
            '<span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:12px;font-weight:600;background:%1$s;color:%2$s;border:1px solid %3$s;">%4$s</span>',
            esc_attr($color['bg']),
            esc_attr($color['fg']),
            esc_attr($color['border']),
            esc_html($text)
        );
    }
}
