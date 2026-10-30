<?php
// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Template file: included inside a function, so these are local variables, not globals.

if (!defined('ABSPATH')) {
    exit;
}

/**
 * @var array $propertiesData
 */

// Extract content and design properties
$content = $propertiesData['content'] ?? [];
$design = $propertiesData['design'] ?? [];
$settings = $propertiesData['settings'] ?? [];

// Get selected prayers
$selected_prayers = $content['prayer_times_selection']['selected_prayers']['value'] ?? 'all';
$show_iqamah = $content['prayer_times_selection']['show_iqamah']['value'] ?? false;

// Define all prayer types and their corresponding shortcode names
$all_prayers = [
    'fajr' => ['name' => 'Fajr', 'shortcode' => 'Fp_Single_Fajr_Begins_time', 'iqamah_shortcode' => 'Fp_Single_Fajr_Iqamah_time'],
    'sunrise' => ['name' => 'Sunrise', 'shortcode' => 'Fp_Single_Sunrise_Begins_time', 'iqamah_shortcode' => null],
    'dhuhr' => ['name' => 'Dhuhr', 'shortcode' => 'Fp_Single_Dhuhr_Begins_time', 'iqamah_shortcode' => 'Fp_Single_Dhuhr_Iqamah_time'],
    'asr' => ['name' => 'Asr', 'shortcode' => 'Fp_Single_Asr_Begins_time', 'iqamah_shortcode' => 'Fp_Single_Asr_Iqamah_time'],
    'maghrib' => ['name' => 'Maghrib', 'shortcode' => 'Fp_Single_Maghrib_Begins_time', 'iqamah_shortcode' => 'Fp_Single_Maghrib_Iqamah_time'],
    'isha' => ['name' => 'Isha', 'shortcode' => 'Fp_Single_Isha_Begins_time', 'iqamah_shortcode' => 'Fp_Single_Isha_Iqamah_time']
];

// Determine which prayers to show
$prayers_to_show = [];
if ($selected_prayers === 'all') {
    $prayers_to_show = array_keys($all_prayers);
} elseif ($selected_prayers === 'custom') {
    $custom_prayers_config = $content['custom_prayer_selection'] ?? [];
    $prayers_to_show = [];
    
    // Check each prayer individually based on the toggle configuration
    if (!empty($custom_prayers_config['fajr_enabled']['value'])) $prayers_to_show[] = 'fajr';
    if (!empty($custom_prayers_config['sunrise_enabled']['value'])) $prayers_to_show[] = 'sunrise';
    if (!empty($custom_prayers_config['dhuhr_enabled']['value'])) $prayers_to_show[] = 'dhuhr';
    if (!empty($custom_prayers_config['asr_enabled']['value'])) $prayers_to_show[] = 'asr';
    if (!empty($custom_prayers_config['maghrib_enabled']['value'])) $prayers_to_show[] = 'maghrib';
    if (!empty($custom_prayers_config['isha_enabled']['value'])) $prayers_to_show[] = 'isha';
} else {
    $prayers_to_show = [$selected_prayers];
}

?>

<div class="fiveprayer-times-element <?php echo !empty($settings['classes']) ? esc_attr($settings['classes']) : ''; ?>">
    <?php foreach ($prayers_to_show as &$prayer_key): ?>
        <?php if (isset($all_prayers[$prayer_key])): ?>
            <?php 
            $prayer_info = $all_prayers[$prayer_key];
            $prayer_name = $prayer_info['name'];
            $prayer_shortcode = $prayer_info['shortcode'];
            $iqamah_shortcode = $prayer_info['iqamah_shortcode'];
            ?>
            
            <div class="prayer-item <?php echo esc_attr($prayer_key); ?>">
                <span class="prayer-name"><?php echo esc_html($prayer_name); ?></span>
                <span class="prayer-time">
                    <?php echo do_shortcode('[' . $prayer_shortcode . ']'); ?>
                </span>
                
                <?php if ($show_iqamah && $iqamah_shortcode !== null): ?>
                    <span class="iqamah-time">
                        (Iqamah: <?php echo do_shortcode('[' . $iqamah_shortcode . ']'); ?>)
                    </span>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    <?php endforeach; ?>
</div>