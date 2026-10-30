# FivePrayer Plugin Structure

This document explains the organized folder structure of the FivePrayer plugin.

## Root Directory Structure

```
fiveprayer/
├── Fiveprayer.php              # Main plugin entry point
├── README.md                   # Plugin readme (WordPress)
├── LICENSE.txt                 # GPL license
├── composer.json               # PHP dependencies
├── package.json                # Node.js dependencies
├── pnpm-lock.yaml              # Dependency lock file
├── webpack.config.js           # Webpack bundler config
├── tailwind.config.js          # Tailwind CSS config
├── postcss.config.js           # PostCSS config
├── tsconfig.json               # TypeScript config
├── .babelrc                    # Babel transpiler config
├── .gitignore                  # Git ignore rules
│
├── blocks/                     # Gutenberg blocks
│   ├── single-prayer/
│   ├── timetable-prayer/
│   └── container-prayer/
│
├── php/                        # Main PHP source code
│   └── classes/core/           # Core classes and helpers
│
├── src/                        # React admin source code
│   ├── admin/                  # Admin UI components
│   └── app/                    # Main app components
│
├── docs/                       # Documentation files
│   ├── INDEX.md
│   ├── API-Documentation.md
│   └── ...
│
├── fiveprayercore-special/     # Debug & utility files (moved outside plugin dir)
│   ├── README.md               # This folder's documentation
│   ├── debug-*.php             # Debug tools
│   ├── test-*.php              # Test scripts
│   └── dev-tools/              # Development tools
│
├── utils/                      # Utility files
│   └── dynamic-loader-styles.css  # Referenced by main plugin
│
├── build-admin/                # Built admin assets
├── build-blocks/               # Built block assets
├── node_modules/               # Node.js dependencies
└── vendor/                     # Composer dependencies
```

## About the `fiveprayercore-special/` Folder

The `fiveprayercore-special/` folder (located alongside the plugin directory, not inside it) contains debug and utility files that were moved from the plugin root to:
- Keep the plugin root clean and organized
- Separate debug/test files from production code
- Prevent Plugin Check from scanning these files

### Files in `fiveprayercore-special/`

**Debug PHP Files:**
- `check-db-values.php` - Debug tool to check database values for printer settings
- `debug-printer-button.php` - Debug interface for printer button settings
- `debug-hijra-status.php` - Debug tool for Hijra calendar status
- `force-english-fix.php` - Testing tool for English language fixes
- `test-current-time.php` - Testing tool for current time functionality
- `test-set-autoprint.php` - Testing tool for auto-print settings

**Backup Files:**
- `Fiveprayer.php.backup` - Backup of the main plugin file
- `prefix}fp_prayer_settings_meta` - Database settings export file

**Test & Utility Files:**
- `dev-tools/` - Development tools including db-query-monitor and system tests
- `elementor-pro_back/` - Elementor Pro plugin backup/reference
- `reports/` - Generated diagnostic reports from watchdog tests
- `cache_functionality_test.php` - Cache testing script
- `FivePrayerWatchdog.php` - Plugin diagnostic tool
- `ImprovedTestUtilityHelper.php` - Test utility helper
- `test-modules.php` - Module testing script
- `UtilityHelper.php` - General utility helper functions

## File Categories

### Production Files (root level)
- `Fiveprayer.php` - Main plugin bootstrap
- Config files (`.babelrc`, `webpack.config.js`, etc.)
- `README.md`, `LICENSE.txt` - Essential documentation

### Source Code
- `php/` - Object-oriented PHP with namespaces
- `src/` - React/TypeScript admin interface
- `blocks/` - Gutenberg block definitions

### Build Output
- `build-admin/` - Compiled admin JavaScript/CSS
- `build-blocks/` - Compiled block JavaScript/CSS

### Development & Testing
- `fiveprayercore-special/` - Debug scripts, tests, and dev tools (outside plugin dir)
- `docs/` - Technical documentation

### Dependencies
- `node_modules/` - Node.js packages
- `vendor/` - Composer packages

## Access

Debug files in `fiveprayercore-special/` are accessed via direct URL:
```
your-site.com/wp-content/plugins/fiveprayercore-special/filename.php
```

**Note:** Some debug files require admin access (`manage_options` capability).