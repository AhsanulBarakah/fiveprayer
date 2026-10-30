<?php
// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Template file: included inside a function, so these are local variables, not globals.
if (!defined('ABSPATH')) {
    exit;
}
if (!empty($deprecated)) :
?>
<?php
// Reorganize data by page
$pages_data = [];
foreach ($deprecated as $old => $info) {
    foreach ($info['pages'] as $page) {
        $page_id = $page['id'];
        if (!isset($pages_data[$page_id])) {
            $pages_data[$page_id] = [
                'title' => $page['title'],
                'edit_link' => $page['edit_link'],
                'shortcodes' => []
            ];
        }
        $pages_data[$page_id]['shortcodes'][] = [
            'old' => $old,
            'new' => $info['new_shortcode']
        ];
    }
}
?>
<div class="fiveprayer-deprecation-manager" data-nonce="<?php echo esc_attr(wp_create_nonce('fp_dismiss_notice')); ?>">
    <div class="fiveprayer-deprecation-header">
        <div class="fiveprayer-header-content">
            <h2><i class="fas fa-exchange-alt"></i> Deprecated Shortcodes Detected</h2>
            <p>The following pages contain outdated shortcodes that need updating</p>
        </div>
        <button class="fiveprayer-dismiss-notice">
            <i class="fas fa-times"></i> Dismiss for 14 days
        </button>
    </div>

    <div class="fiveprayer-deprecation-list">
        <?php foreach ($pages_data as $page_id => $page_data) : 
            $shortcodes_count = count($page_data['shortcodes']);
        ?>
        <div class="fiveprayer-deprecation-item">
            <div class="fiveprayer-deprecation-summary">
                <div class="fiveprayer-deprecation-icon">
                    <i class="fas fa-file-alt"></i>
                </div>
                <div class="fiveprayer-deprecation-info">
                    <h3><?php echo esc_html($page_data['title']); ?></h3>
                    <div class="fiveprayer-deprecation-meta">
                        <span class="fiveprayer-shortcode-count">
                            <?php echo esc_html($shortcodes_count); ?> deprecated shortcode<?php echo esc_html($shortcodes_count !== 1 ? 's' : '') ?>
                        </span>
                    </div>
                </div>
                <button class="fiveprayer-deprecation-toggle" aria-expanded="false">
                    <i class="fas fa-chevron-down"></i>
                    <span class="fiveprayer-toggle-state">
                        <span class="fiveprayer-show-when-closed">Click To See Details</span>
                        <span class="fiveprayer-show-when-open" style="display: none;">Click To Hide Details</span>
                    </span>
                </button>
            </div>

            <div class="fiveprayer-deprecation-details">
                <div class="fiveprayer-shortcodes-list">
                    <?php foreach ($page_data['shortcodes'] as $shortcode) : ?>
                    <div class="fiveprayer-shortcode-item">
                        <div class="fiveprayer-shortcode-comparison">
                            <div class="fiveprayer-old-shortcode">
                                <h4><i class="fas fa-exclamation-triangle"></i> Old Version</h4>
                                <code>[<?php echo esc_html($shortcode['old']); ?>]</code>
                            </div>
                            <div class="fiveprayer-new-shortcode">
                                <h4><i class="fas fa-check-circle"></i> New Version</h4>
                                <code>[<?php echo esc_html($shortcode['new']); ?>]</code>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>

                <div class="fiveprayer-page-actions">
                    <a href="<?php echo esc_url($page_data['edit_link']); ?>" class="button button-primary" target="_blank">
                        <i class="fas fa-edit"></i> Edit Page
                    </a>
                </div>
            </div>
        </div>
        <?php endforeach; ?>
    </div>

    <div class="fiveprayer-deprecation-footer">
        <p><i class="fas fa-info-circle"></i>
            <?php if (\FivePrayer\Core\Security\SecurityHelper::get_sanitized_get_input('dismissed') === '1') : ?>
                Notice dismissed. It will reappear in 14 days if deprecated shortcodes remain.
            <?php else : ?>
                You can dismiss this notice, but it will return in 14 days if shortcodes aren't updated.
            <?php endif; ?>
        </p>
    </div>
</div>
<?php endif; ?>
