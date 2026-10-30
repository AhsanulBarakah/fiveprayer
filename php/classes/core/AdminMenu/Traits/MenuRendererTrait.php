<?php

namespace FivePrayer\Core\AdminMenu\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\PathService;
use FivePrayer\Core\Assets;

trait MenuRendererTrait
{
    private $pathService;

    public function register(): void
    {
        add_action('admin_menu', [$this, 'register_menu']);
        add_action('admin_head', [$this, 'add_menu_icon_style']);
    }

    public function register_menu(): void
    {
        $icon_url = $this->pathService->getFileUrl('php/classes/core/Assets/fpicon.svg');

        add_menu_page(
            __('FivePrayer', 'fiveprayer'),
            __('FivePrayer', 'fiveprayer'),
            'manage_options',
            'fiveprayer',
            [$this, 'render_page'],
            $icon_url,
            25
        );

        \FivePrayer\Core\Logging\Logger::info('Memory Test submenu page is hidden from admin menu', 'AdminMenu');
    }

    public function add_menu_icon_style(): void
    {
        $icon_url = $this->pathService->getFileUrl('php/classes/core/Assets/fpicon.svg');
        $hover_icon_url = $this->pathService->getFileUrl('php/classes/core/Assets/fpiconhov.svg');

        echo '<style>
        #adminmenu .toplevel_page_fiveprayer .wp-menu-image {
            background-image: url("' . esc_url($icon_url) . '") !important;
            background-position: center;
            background-repeat: no-repeat;
            background-size: 20px 20px;
        }

        #adminmenu .toplevel_page_fiveprayer:hover .wp-menu-image,
        #adminmenu .toplevel_page_fiveprayer.wp-has-current-submenu .wp-menu-image {
            background-image: url("' . esc_url($hover_icon_url) . '") !important;
        }

        #adminmenu .toplevel_page_fiveprayer .wp-menu-image img {
            display: none !important;
        }
        </style>';
    }

    public function render_page(): void
    {
        $page = sanitize_text_field(filter_input(INPUT_GET, 'page') ?: '');
        $page = sanitize_title($page);

        if ($page === 'fiveprayer') {
            (new Assets())->enqueue_admin_page_assets();
        }

        // The admin bundle and its stylesheet are scoped to the `.fiveprayer`
        // class (postcss prefixes every rule with it), and the app mounts on
        // the id below. Both have to be on this element or the page renders an
        // unstyled, unmounted shell.
        echo '<div id="fiveprayer-admin-app" class="fiveprayer"></div>';
    }
}
