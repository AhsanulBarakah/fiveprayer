<?php

namespace FivePrayer\Core\ShortCodes\Renderers\Traits;

defined('ABSPATH') || exit('May Allah Guide You, Ameen.');

trait PageBuilderTrait
{
    protected function isPageBuilderEditor(): bool
    {
        if (defined('ELEMENTOR_VERSION') && SecurityHelper::has_query_arg('elementor-preview')) {
            return true;
        }

        if (defined('FL_BUILDER_VERSION') && (SecurityHelper::has_query_arg('fl_builder') || SecurityHelper::has_query_arg('fl_builder_preview'))) {
            return true;
        }

        if (defined('ET_BUILDER_VERSION') && (SecurityHelper::has_query_arg('et_fb') || SecurityHelper::has_query_arg('et_preview'))) {
            return true;
        }

        if (defined('BRZ_VERSION') && (SecurityHelper::has_query_arg('brizy-edit') || SecurityHelper::has_query_arg('brizy-preview'))) {
            return true;
        }

        if (defined('VCV_VERSION') && (SecurityHelper::has_query_arg('vcv-editor') || SecurityHelper::has_query_arg('vcv-preview'))) {
            return true;
        }

        if (is_customize_preview()) {
            return true;
        }

        if (is_admin() && function_exists('get_current_screen')) {
            $screen = get_current_screen();
            if ($screen && $screen->is_block_editor) {
                return true;
            }
        }

        return false;
    }
}
