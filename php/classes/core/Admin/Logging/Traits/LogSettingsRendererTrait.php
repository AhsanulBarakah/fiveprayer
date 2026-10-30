<?php

namespace FivePrayer\Core\Admin\Logging\Traits;

defined('ABSPATH') || exit;

trait LogSettingsRendererTrait
{
    public function render_logging_settings(): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'fiveprayer'));
        }

        $log_level = get_option('fiveprayer_log_level', 'none');
        $nonce = wp_create_nonce('fiveprayer_save_logging_settings');

        echo '<div class="card" style="background:#fff;padding:20px;border:1px solid #ccd0d4;border-radius:4px;margin:20px 0;">';
        echo '<h2>' . esc_html__('Logging Settings', 'fiveprayer') . '</h2>';
        
        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
        echo '<input type="hidden" name="action" value="fiveprayer_save_logging_settings" />';
        echo '<input type="hidden" name="_wpnonce" value="' . esc_attr($nonce) . '" />';
        
        echo '<table class="form-table">';
        echo '<tr>';
        echo '<th scope="row">' . esc_html__('Log Level', 'fiveprayer') . '</th>';
        echo '<td>';
        echo '<select name="log_level" id="log_level">';
        
        $log_levels = [
            'none' => __('None - No logging', 'fiveprayer'),
            'error' => __('Error - Errors only', 'fiveprayer'),
            'warning' => __('Warning - Warnings and errors', 'fiveprayer'),
            'info' => __('Info - Info, warnings and errors', 'fiveprayer'),
            'debug' => __('Debug - All messages', 'fiveprayer')
        ];
        
        foreach ($log_levels as $value => $label) {
            echo '<option value="' . esc_attr($value) . '" ';
            selected($log_level, $value);
            echo '>' . esc_html($label) . '</option>';
        }
        
        echo '</select>';
        echo '<p class="description">' . esc_html__('Set the level of detail for logging. Higher levels include more information but may impact performance.', 'fiveprayer') . '</p>';
        echo '</td>';
        echo '</tr>';
        
        echo '<tr>';
        echo '<th scope="row">' . esc_html__('Current Log Level', 'fiveprayer') . '</th>';
        echo '<td>';
        $current_label = $log_levels[$log_level] ?? $log_levels['none'];
        echo '<code>' . esc_html($current_label) . '</code>';
        echo '<p class="description">' . esc_html__('Current logging level is active.', 'fiveprayer') . '</p>';
        echo '</td>';
        echo '</tr>';
        
        echo '</table>';
        
        submit_button(__('Save Logging Settings', 'fiveprayer'), 'primary', 'submit', false);
        echo '</form>';

        // Show custom log file information
        $log_file_path = \FivePrayer\Core\Logging\Logger::get_log_file_path();
        $log_file_size = \FivePrayer\Core\Logging\Logger::get_log_file_size();
        
        echo '<div class="card" style="background:#f9f9f9;padding:15px;border:1px solid #ccd0d4;border-radius:4px;margin:20px 0;">';
        echo '<h3>' . esc_html__('Plugin Log File', 'fiveprayer') . '</h3>';
        
        if (file_exists($log_file_path)) {
            $size_mb = round($log_file_size / (1024 * 1024), 2);
            echo '<p><strong>' . esc_html__('Log File Status:', 'fiveprayer') . '</strong> ' . esc_html__('Active', 'fiveprayer') . '</p>';
            echo '<p><strong>' . esc_html__('File Size:', 'fiveprayer') . '</strong> ' . esc_html($size_mb . ' MB', 'fiveprayer') . '</p>';
            echo '<p><strong>' . esc_html__('File Location:', 'fiveprayer') . '</strong> <code>' . esc_html($log_file_path) . '</code></p>';
            
            // The log directory is blocked from direct web access (see
            // LogFileManagerTrait::protect_log_directory()); the authenticated
            // download handler above is the only way to read the file.
            echo '<p><a href="' . esc_url(add_query_arg(['action' => 'fiveprayer_download_log_file', '_wpnonce' => wp_create_nonce('fiveprayer_download_log_file')], admin_url('admin-post.php'))) . '" class="button button-secondary">' . esc_html__('Download Log File', 'fiveprayer') . '</a></p>';
        } else {
            echo '<p><strong>' . esc_html__('Log File Status:', 'fiveprayer') . '</strong> ' . esc_html__('No log file exists yet. Enable logging and perform some actions to generate logs.', 'fiveprayer') . '</p>';
        }
        
        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" style="margin-top: 15px;">';
        echo '<input type="hidden" name="action" value="fiveprayer_clear_logs" />';
        echo '<input type="hidden" name="_wpnonce" value="' . esc_attr(wp_create_nonce('fiveprayer_clear_logs')) . '" />';
        echo '<p class="description">' . esc_html__('Clear the custom FivePrayer log file. System logs will continue to be written to the server\'s error log.', 'fiveprayer') . '</p>';
        submit_button(__('Clear Plugin Log File', 'fiveprayer'), 'secondary', 'clear_logs', false);
        echo '</form>';
        
        echo '</div>';
        
        // Add log table view
        $this->render_log_table();
    }

    private function render_log_table(): void
    {
        echo '<div class="card">';
        echo '<h3>' . esc_html__('Recent Plugin Logs', 'fiveprayer') . '</h3>';
        
        echo '<div style="margin-bottom: 15px; display:flex; gap: 10px; align-items: center; flex-wrap: wrap;">';
        echo '<div style="display:flex; gap: 5px; align-items: center; flex-wrap: wrap;">';

        echo '<input type="text" id="log_search_input" placeholder="' . esc_attr__('Search logs...', 'fiveprayer') . '" class="log-search-box" />';

        echo '<select name="log_level" id="log_level_filter" class="log-level-select">';
        echo '<option value="">' . esc_html__('All Levels', 'fiveprayer') . '</option>';
        $levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR'];
        foreach ($levels as &$level) {
            echo '<option value="' . esc_attr($level) . '">' . esc_html($level) . '</option>';
        }
        echo '</select>';

        echo '<select name="log_per_page" id="log_per_page" class="log-per-page-select">';
        $per_page_options = [10, 25, 50, 100, -1];
        foreach ($per_page_options as &$option) {
            if ($option == -1) {
                $display_text = 'All';
                $value = '-1';
            } else {
                $display_text = $option . ' per page';
                $value = $option;
            }
            echo '<option value="' . esc_attr($value) . '">' . esc_html($display_text) . '</option>';
        }
        echo '</select>';

        echo '<button type="button" id="log_filter_btn" class="button button-secondary log-button">' . esc_html__('Filter', 'fiveprayer') . '</button>';
        echo '<button type="button" id="log_clear_filters_btn" class="button button-secondary log-button" style="display:none;">' . esc_html__('Clear Filters', 'fiveprayer') . '</button>';
        echo '</div>';
        echo '</div>';
        
        echo '<div id="log_loading_indicator" class="log-loading" style="display:none;"></div>';
        echo '<div id="logs_table_container">';

        $current_request_logs = \FivePrayer\Core\Logging\Logger::get_current_request_logs(1000);
        $current_request_count = count($current_request_logs);

        if ($current_request_count > 0) {
            $level_counts = [];
            $unique_messages = [];
            $duplicate_count = 0;

            foreach ($current_request_logs as &$entry) {
                $level = strtoupper($entry['level']);
                $level_counts[$level] = ($level_counts[$level] ?? 0) + 1;

                $message_key = $entry['message'] . '|' . $entry['level'] . '|' . $entry['context'];
                if (isset($unique_messages[$message_key])) {
                    $duplicate_count++;
                } else {
                    $unique_messages[$message_key] = true;
                }
            }

            $unique_count = count($unique_messages);

            echo '<div class="log-statistics" style="background: #f0f0f0; padding: 10px; border-radius: 4px; margin-bottom: 15px;">';
            echo '<h4>' . esc_html__('Current Request Log Statistics', 'fiveprayer') . '</h4>';
            echo '<p><strong>' . esc_html__('Logs in Current Request:', 'fiveprayer') . '</strong> ' . esc_html($current_request_count) . '</p>';
            echo '<p><strong>' . esc_html__('Unique Messages:', 'fiveprayer') . '</strong> ' . esc_html($unique_count) . '</p>';
            if ($duplicate_count > 0) {
                echo '<p><strong style="color: #ff8700;">' . esc_html__('Duplicates in Request:', 'fiveprayer') . '</strong> ' . esc_html($duplicate_count) . '</p>';
            }

            if (!empty($level_counts)) {
                echo '<p><strong>' . esc_html__('By Level:', 'fiveprayer') . '</strong> ';
                $level_parts = [];
                foreach ($level_counts as $level => $count) {
                    $level_parts[] = $level . ': ' . $count;
                }
                echo esc_html(implode(', ', $level_parts));
                echo '</p>';
            }

            echo '</div>';
        }

        $overall_stats = \FivePrayer\Core\Logging\Logger::get_log_statistics();
        if ($overall_stats['total_logs'] > $current_request_count) {
            echo '<div class="log-statistics" style="background: #e8f4fd; padding: 10px; border-radius: 4px; margin-bottom: 15px;">';
            echo '<h4>' . esc_html__('Overall Log Statistics', 'fiveprayer') . '</h4>';
            echo '<p><strong>' . esc_html__('Total Logs (All Time):', 'fiveprayer') . '</strong> ' . esc_html($overall_stats['total_logs']) . '</p>';
            echo '<p><strong>' . esc_html__('Unique Logs (All Time):', 'fiveprayer') . '</strong> ' . esc_html($overall_stats['unique_logs']) . '</p>';
            echo '<p><strong>' . esc_html__('Total Duplicates (All Time):', 'fiveprayer') . '</strong> ' . esc_html($overall_stats['duplicate_count']) . '</p>';
            echo '</div>';
        }

        echo '<div class="log-skeleton-container">';
        echo '<table class="wp-list-table widefat fixed striped">';
        echo '<thead>';
        echo '<tr>';
        echo '<th style="width:120px;">' . esc_html__('Timestamp', 'fiveprayer') . '</th>';
        echo '<th style="width:80px;">' . esc_html__('Level', 'fiveprayer') . '</th>';
        echo '<th style="width:120px;">' . esc_html__('Context', 'fiveprayer') . '</th>';
        echo '<th style="width:150px;">' . esc_html__('Caller', 'fiveprayer') . '</th>';
        echo '<th style="width:100%;">' . esc_html__('Message', 'fiveprayer') . '</th>';
        echo '</tr>';
        echo '</thead>';
        echo '<tbody>';
        for ($i = 0; $i < 5; $i++) {
            echo '<tr>';
            echo '<td><div class="skeleton-line" style="height: 20px; background: #f0f0f0; margin: 5px 0; border-radius: 4px;"></div></td>';
            echo '<td><div class="skeleton-line" style="height: 20px; background: #f0f0f0; margin: 5px 0; border-radius: 4px;"></div></td>';
            echo '<td><div class="skeleton-line" style="height: 20px; background: #f0f0f0; margin: 5px 0; border-radius: 4px;"></div></td>';
            echo '<td><div class="skeleton-line" style="height: 20px; background: #f0f0f0; margin: 5px 0; border-radius: 4px;"></div></td>';
            echo '<td><div class="skeleton-line" style="height: 20px; background: #f0f0f0; margin: 5px 0; border-radius: 4px;"></div></td>';
            echo '</tr>';
        }
        echo '</tbody>';
        echo '</table>';
        echo '</div>';
        
        echo '<script type="text/javascript">
        jQuery(document).ready(function($) {
            var nonce = "' . esc_js(wp_create_nonce('fiveprayer_log_nonce')) . '";

            function loadLogs(page, search, level, perPage) {
                $.ajax({
                    url: ajaxurl,
                    type: "POST",
                    data: {
                        action: "fiveprayer_get_logs",
                        page: page,
                        search: search,
                        level: level,
                        per_page: perPage,
                        nonce: nonce
                    },
                    success: function(response) {
                        if (response.success) {
                            $("#logs_table_container").html(response.data.stats_html + response.data.table_html + response.data.pagination_html + response.data.results_html);
                            if (search || level) {
                                $("#log_clear_filters_btn").show();
                            } else {
                                $("#log_clear_filters_btn").hide();
                            }
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error("Error loading logs:", error);
                        $("#logs_table_container").html("<p>Error loading logs. Please refresh the page.</p>");
                    }
                });
            }

            // Load logs on page load
            loadLogs(1, "", "", 10);

            var searchTimeout;
            $("#log_search_input").on("input", function() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(function() {
                    var searchVal = $("#log_search_input").val();
                    var levelVal = $("#log_level_filter").val();
                    var perPage = $("#log_per_page").val() || 50;
                    loadLogs(1, searchVal, levelVal, perPage);
                    if (searchVal || levelVal) {
                        $("#log_clear_filters_btn").show();
                    } else {
                        $("#log_clear_filters_btn").hide();
                    }
                }, 500);
            });

            $("#log_level_filter").change(function() {
                var searchVal = $("#log_search_input").val();
                var levelVal = $(this).val();
                var perPage = $("#log_per_page").val() || 50;
                loadLogs(1, searchVal, levelVal, perPage);
                if (searchVal || levelVal) {
                    $("#log_clear_filters_btn").show();
                } else {
                    $("#log_clear_filters_btn").hide();
                }
            });

            $("#log_per_page").change(function() {
                var searchVal = $("#log_search_input").val();
                var levelVal = $("#log_level_filter").val();
                var perPage = $(this).val();
                loadLogs(1, searchVal, levelVal, perPage);
            });

            $("#log_filter_btn").click(function() {
                var searchVal = $("#log_search_input").val();
                var levelVal = $("#log_level_filter").val();
                var perPage = $("#log_per_page").val() || 10;
                loadLogs(1, searchVal, levelVal, perPage);
                if (searchVal || levelVal) {
                    $("#log_clear_filters_btn").show();
                } else {
                    $("#log_clear_filters_btn").hide();
                }
            });

            $("#log_clear_filters_btn").click(function() {
                $("#log_search_input").val("");
                $("#log_level_filter").val("");
                $("#log_per_page").val(10);
                loadLogs(1, "", "", 10);
                $(this).hide();
            });

            $(document).on("click", ".ajax-page-link", function(e) {
                e.preventDefault();
                var page = $(this).data("page");
                var search = $(this).data("search");
                var level = $(this).data("level");
                var perPage = $(this).data("perpage") || $("#log_per_page").val() || 50;
                $("#log_search_input").val(search);
                $("#log_level_filter").val(level);
                $("#log_per_page").val(perPage);
                loadLogs(page, search, level, perPage);
                $("html, body").animate({ scrollTop: $("#logs_table_container").offset().top - 100 }, 300);
            });
        });
        </script>';
        
        echo '</div>';
        echo '</div>';
    }
}
