declare global {
  interface Window {
    FivePrayerData?: {
      ajaxUrl: string;
      adminUrl?: string;
      Site_title: string;
      Site_tagline: string;
      Current_user: string;
      siteUrl?: string;
      /**
       * Share on Local Network — sharing the site with the TV, phone or tablet on
       * the local network. State plus the nonce that saves it. Localized by
       * `FivePrayer\Core\Traits\AdminAssetsTrait`.
       */
      localTesting?: {
        enabled: boolean;
        active: boolean;
        host: string;
        requestIsLocal: boolean;
        nonce: string;
        ajaxAction: string;
        optionName: string;
        settingsHash: string;
      };
      /**
       * Delete all data on uninstall — the opt-in uninstall.php reads, plus the
       * nonce and action that save it. Localized by
       * `FivePrayer\Core\Admin\UninstallSettings`.
       */
      uninstallData?: {
        enabled: boolean;
        nonce: string;
        ajaxAction: string;
        optionName: string;
      };
      /**
       * TV Display Mode (turning one page or post into a full-screen display)
       * — one switch per post type, the layout width a display page is built
       * at, plus the nonce that saves them. Localized by
       * `FivePrayer\Core\Traits\AdminAssetsTrait`.
       */
      tvDisplay?: {
        /**
         * Switch state per post type, e.g. `{ page: true, post: false }`.
         * Pages and posts are switched on and off independently.
         */
        enabledMap: Record<string, boolean>;
        /** Post types that have a switch at all (e.g. page, post). */
        postTypes: string[];
        /** Human label per post type, e.g. `{ page: 'Pages' }`. */
        labels: Record<string, string>;
        nonce: string;
        ajaxAction: string;
        /** Option name per post type (kept for diagnostics). */
        optionNames: Record<string, string>;
        /** Ajax field naming the post type a save applies to. */
        scopeField: string;
        settingsHash: string;
        /**
         * Layout width (px) a display page is laid out at, i.e. the width the
         * page builder's media queries are measured against. `0` = Auto, which
         * leaves the page's viewport tag untouched.
         */
        canvasWidth: number;
        /** Widths offered in the list, e.g. `{ value: 1920, label: '...' }`. */
        /**
         * Every size a width list offers: the built-in ladder plus the site's
         * own named sizes.
         */
        canvasPresets: Array<{ value: number; label: string; height?: number }>;
        /** The built-in ladder on its own (kept for diagnostics). */
        canvasBuiltinPresets: Array<{ value: number; label: string; height?: number }>;
        /**
         * The site's own named sizes — what the “Your own sizes” editor of the
         * Layout width row starts from, and what it saves back.
         */
        customPresets: Array<{ value: number; label: string; height?: number }>;
        /** Ajax action that saves the named sizes (fields `names[]`, `widths[]`). */
        customPresetsAjaxAction: string;
        /** Most named sizes the site may keep. */
        customPresetsMax: number;
        /** Longest name a size may carry. */
        presetLabelMax: number;
        /** Option name the named sizes are stored in (kept for diagnostics). */
        presetsOption: string;
        /** Ajax action that saves the layout width. */
        canvasAjaxAction: string;
        /** Option name the layout width is stored in (kept for diagnostics). */
        canvasOption: string;
        /** Accepted range for a manually typed width, in pixels. */
        canvasMin: number;
        canvasMax: number;
        /** The accepted range as one sentence, for the "other width" field. */
        canvasRange: string;
        /**
         * Query argument that turns on the on-screen screen report on a display
         * page, e.g. `fiveprayer_tv_report`.
         */
        reportQueryArg: string;
        /**
         * Which screen the display is built for: `modern` (the whole screen is
         * visible) or `old` (an older TV that crops about 5% off each edge).
         */
        tvType: string;
        /** The TV types offered, e.g. `{ value, label, description }`. */
        tvTypeChoices: Array<{ value: string; label: string; description?: string }>;
        /** Ajax action that saves the TV type. */
        tvTypeAjaxAction: string;
        /** Option name the TV type is stored in (kept for diagnostics). */
        tvTypeOption: string;
        /** Percent of each edge the chosen screen can crop (0 or 5). */
        overscanPercent: number;
      };
      /**
       * The two editor-only design aids of the TV Display Mode page — Canvas
       * Force (lock the builder canvas to the display page's chosen size) and
       * the Safe Zone Guide (draw the overscan frame over it). Each has its own
       * switch, plus the nonce and action that save them. Localized by
       * `TvCanvasLocker::get_admin_state()`.
       */
      tvCanvas?: {
        /** Canvas Force switch: lock the editing canvas to width × height. */
        canvasForce: boolean;
        /** Safe Zone Guide switch: draw the overscan guide over the canvas. */
        safeZone: boolean;
        /** Nonce that saves either switch. */
        nonce: string;
        /** Ajax action that saves either switch. */
        ajaxAction: string;
        /** Ajax field naming which guide a save applies to. */
        guideField: string;
        /** Value of `guideField` that selects the Canvas Force switch. */
        canvasForceKey: string;
        /** Value of `guideField` that selects the Safe Zone Guide switch. */
        safeZoneKey: string;
        /** Width (percent of each edge) the guide marks as croppable. */
        marginPercent: number;
      };
      /** The site's `time_format` option, e.g. `g:i:s a`. */
      time_format?: string;
      wordpress_timezone: {
        gmt_offset: number;
        timezone_string: string;
        current_time: string;
        current_timestamp: number;
      };
    };
  }
}

export {};
