<?php

namespace FivePrayer\Core\Admin\Logging\Traits;

defined('ABSPATH') || exit;

trait LogAjaxHandlerTrait
{
    public function handle_ajax_get_logs(): void
    {
        check_ajax_referer('fiveprayer_log_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('Insufficient permissions.', 'fiveprayer'));
        }
        
        $search_term = sanitize_text_field(filter_input(INPUT_POST, 'search') ?: '');
        $filter_level = sanitize_text_field(filter_input(INPUT_POST, 'level') ?: '');
        $page = max(1, intval(filter_input(INPUT_POST, 'page', FILTER_VALIDATE_INT) ?: 1));
        $per_page = intval(filter_input(INPUT_POST, 'per_page', FILTER_VALIDATE_INT) ?: 50);

        $allowed_per_page = [10, 25, 50, 100, -1];
        if (!in_array($per_page, $allowed_per_page)) {
            $per_page = 10;
        }

        if ($per_page == -1) {
            $per_page = 999999;
        }
        
        $all_log_entries = \FivePrayer\Core\Logging\Logger::get_current_request_logs(1000);
        $total_logs = count($all_log_entries);
        
        if (!empty($search_term)) {
            $filtered_logs = [];
            foreach ($all_log_entries as &$entry) {
                if (stripos($entry['message'], $search_term) !== false || 
                    stripos($entry['level'], $search_term) !== false ||
                    stripos($entry['context'], $search_term) !== false ||
                    stripos($entry['caller'], $search_term) !== false) {
                    $filtered_logs[] = $entry;
                }
            }
            $all_log_entries = $filtered_logs;
            $total_logs = count($filtered_logs);
        }
        
        if (!empty($filter_level)) {
            $level_filtered_logs = [];
            foreach ($all_log_entries as &$entry) {
                if (strcasecmp($entry['level'], $filter_level) === 0) {
                    $level_filtered_logs[] = $entry;
                }
            }
            $all_log_entries = $level_filtered_logs;
            $total_logs = count($level_filtered_logs);
        }
        
        $total_pages = ceil(count($all_log_entries) / $per_page);
        $offset = ($page - 1) * $per_page;
        $log_entries = array_slice($all_log_entries, $offset, $per_page);
        
        $table_html = '';
        if (!empty($log_entries)) {
            $table_html .= '<table class="wp-list-table widefat fixed striped">';
            $table_html .= '<thead>';
            $table_html .= '<tr>';
            $table_html .= '<th style="width:120px;">' . esc_html__('Timestamp', 'fiveprayer') . '</th>';
            $table_html .= '<th style="width:80px;">' . esc_html__('Level', 'fiveprayer') . '</th>';
            $table_html .= '<th style="width:120px;">' . esc_html__('Context', 'fiveprayer') . '</th>';
            $table_html .= '<th style="width:150px;">' . esc_html__('Caller', 'fiveprayer') . '</th>';
            $table_html .= '<th style="width:100%;">' . esc_html__('Message', 'fiveprayer') . '</th>';
            $table_html .= '</tr>';
            $table_html .= '</thead>';
            $table_html .= '<tbody>';

            foreach ($log_entries as &$entry) {
                $level_class = strtolower($entry['level']);
                $timestamp = esc_html($entry['timestamp']);
                $level = '<span class="' . esc_attr($level_class) . '">' . esc_html($entry['level']) . '</span>';
                $context = esc_html($entry['context']) ?: '<em>None</em>';
                $caller = esc_html($entry['caller']) ?: '<em>Unknown</em>';
                $message = esc_html($entry['message']);

                $occurrence_info = '';
                if (isset($entry['occurrences']) && $entry['occurrences'] > 1) {
                    $occurrence_info = ' <span class="log-occurrence-badge">' . $entry['occurrences'] . '</span>';
                }

                $table_html .= '<tr>';
                $table_html .= '<td>' . $timestamp . '</td>';
                $table_html .= '<td>' . $level . '</td>';
                $table_html .= '<td>' . $context . '</td>';
                $table_html .= '<td>' . $caller . '</td>';
                $table_html .= '<td>' . $message . $occurrence_info . '</td>';
                $table_html .= '</tr>';
            }

            $table_html .= '</tbody>';
            $table_html .= '</table>';
        } else {
            $table_html = '<table class="wp-list-table widefat fixed striped"><tbody><tr><td colspan="5"><em>' . __('No log entries found matching your criteria.', 'fiveprayer') . '</em></td></tr></tbody></table>';
        }
        
        $pagination_html = '';
        if ($total_pages > 1) {
            $pagination_html .= '<div class="log-pagination">';
            
            if ($page > 1) {
                $pagination_html .= '<a href="#" class="log-page-link ajax-page-link" data-page="' . ($page - 1) . '" data-search="' . esc_attr($search_term) . '" data-level="' . esc_attr($filter_level) . '" data-perpage="' . $per_page . '">&laquo; ' . esc_html__('Previous', 'fiveprayer') . '</a>';
            }

            $start_page = max(1, $page - 2);
            $end_page = min($total_pages, $page + 2);

            if ($start_page > 1) {
                $pagination_html .= '<a href="#" class="log-page-link ajax-page-link" data-page="1" data-search="' . esc_attr($search_term) . '" data-level="' . esc_attr($filter_level) . '" data-perpage="' . $per_page . '">1</a>';
                if ($start_page > 2) {
                    $pagination_html .= '<span>...</span>';
                }
            }

            for ($i = $start_page; $i <= $end_page; $i++) {
                if ($i == $page) {
                    $pagination_html .= '<span class="log-page-current">' . $i . '</span>';
                } else {
                    $pagination_html .= '<a href="#" class="log-page-link ajax-page-link" data-page="' . $i . '" data-search="' . esc_attr($search_term) . '" data-level="' . esc_attr($filter_level) . '" data-perpage="' . $per_page . '">' . $i . '</a>';
                }
            }

            if ($end_page < $total_pages) {
                if ($end_page < $total_pages - 1) {
                    $pagination_html .= '<span>...</span>';
                }
                $pagination_html .= '<a href="#" class="log-page-link ajax-page-link" data-page="' . $total_pages . '" data-search="' . esc_attr($search_term) . '" data-level="' . esc_attr($filter_level) . '" data-perpage="' . $per_page . '">' . $total_pages . '</a>';
            }

            if ($page < $total_pages) {
                $pagination_html .= '<a href="#" class="log-page-link ajax-page-link" data-page="' . ($page + 1) . '" data-search="' . esc_attr($search_term) . '" data-level="' . esc_attr($filter_level) . '" data-perpage="' . $per_page . '">' . esc_html__('Next', 'fiveprayer') . ' &raquo;</a>';
            }
            
            $pagination_html .= '</div>';
        }
        
        $display_count = count($log_entries);
        $start_num = $offset + 1;
        $end_num = min($offset + $per_page, count($all_log_entries));
        $total_logs = count(Logger::get_current_request_logs(1000)); // Re-fetch for accurate total

        if (!empty($log_entries)) {
            $results_html = '<p style="margin-top: 15px;"><em>' . sprintf(
                /* translators: 1: first displayed entry number, 2: last displayed entry number, 3: total log entries. */
                esc_html__('Showing %1$d-%2$d of %3$d total log entries', 'fiveprayer'),
                $start_num,
                $end_num,
                $total_logs
            ) . '</em></p>';
        } else {
            $results_html = '<p style="margin-top: 15px;"><em>' . sprintf(
                /* translators: 1: first displayed entry number, 2: last displayed entry number, 3: total log entries. */
                esc_html__('Showing %1$d-%2$d of %3$d total log entries', 'fiveprayer'),
                0,
                0,
                $total_logs
            ) . '</em></p>';
        }

        $current_request_logs = \FivePrayer\Core\Logging\Logger::get_current_request_logs(1000);
        $current_request_count = count($current_request_logs);

        $stats_html = '';
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

            $stats_html = '<div class="log-statistics" style="background: #f0f0f0; padding: 10px; border-radius: 4px; margin-bottom: 15px;">';
            $stats_html .= '<h4>' . esc_html__('Current Request Log Statistics', 'fiveprayer') . '</h4>';
            $stats_html .= '<p><strong>' . esc_html__('Logs in Current Request:', 'fiveprayer') . '</strong> ' . esc_html($current_request_count) . '</p>';
            $stats_html .= '<p><strong>' . esc_html__('Unique Messages:', 'fiveprayer') . '</strong> ' . esc_html($unique_count) . '</p>';
            if ($duplicate_count > 0) {
                $stats_html .= '<p><strong style="color: #ff8700;">' . esc_html__('Duplicates in Request:', 'fiveprayer') . '</strong> ' . esc_html($duplicate_count) . '</p>';
            }

            if (!empty($level_counts)) {
                $stats_html .= '<p><strong>' . esc_html__('By Level:', 'fiveprayer') . '</strong> ';
                $level_parts = [];
                foreach ($level_counts as $level => $count) {
                    $level_parts[] = $level . ': ' . $count;
                }
                $stats_html .= esc_html(implode(', ', $level_parts));
                $stats_html .= '</p>';
            }

            $stats_html .= '</div>';
        }

        $overall_stats = \FivePrayer\Core\Logging\Logger::get_log_statistics();
        if ($overall_stats['total_logs'] > $current_request_count) {
            $stats_html .= '<div class="log-statistics" style="background: #e8f4fd; padding: 10px; border-radius: 4px; margin-bottom: 15px;">';
            $stats_html .= '<h4>' . esc_html__('Overall Log Statistics', 'fiveprayer') . '</h4>';
            $stats_html .= '<p><strong>' . esc_html__('Total Logs (All Time):', 'fiveprayer') . '</strong> ' . esc_html($overall_stats['total_logs']) . '</p>';
            $stats_html .= '<p><strong>' . esc_html__('Unique Logs (All Time):', 'fiveprayer') . '</strong> ' . esc_html($overall_stats['unique_logs']) . '</p>';
            $stats_html .= '<p><strong>' . esc_html__('Total Duplicates (All Time):', 'fiveprayer') . '</strong> ' . esc_html($overall_stats['duplicate_count']) . '</p>';
            $stats_html .= '</div>';
        }

        wp_send_json_success([
            'table_html' => $table_html,
            'pagination_html' => $pagination_html,
            'results_html' => $results_html,
            'stats_html' => $stats_html,
            'total_logs' => $total_logs
        ]);
    }
}
