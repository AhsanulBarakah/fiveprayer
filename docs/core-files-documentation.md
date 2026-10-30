# FivePrayer Core Files Documentation

## Overview
This document describes the core files that make up the FivePrayer plugin architecture. These files provide the essential functionality for displaying Muslim prayer times.

## Core File Descriptions

### 1. FivePrayerMain.php
**Location**: `php/FivePrayerMain.php`
**Purpose**: Main plugin entry point that contains the core plugin initialization and setup
**Key Functions**:
- Defines global constants for internal path helpers
- Initializes the autoloader for composer dependencies
- Sets up all modular components of the FivePrayer plugin
- Handles plugin activation, deactivation, and update processes
- Manages WordPress hooks and initialization sequences
- Includes all modular components (caching, scripts, shortcodes, etc.)
- Initializes ESI (Edge Side Includes) dynamic content handler when available

### 2. FivePrayer.php
**Location**: Root directory (`FivePrayer.php`)
**Purpose**: Main plugin file that WordPress recognizes as the plugin entry point
**Key Functions**:
- Contains WordPress plugin header information
- Includes the main plugin functionality from FivePrayerMain.php
- Registers activation and deactivation hooks
- Serves as the primary file that WordPress loads to recognize the plugin

### 3. Plugin.php
**Location**: `php/classes/core/Plugin.php`
**Purpose**: Core plugin class that handles the actual business logic and plugin operations
**Key Functions**:
- Manages the initialization of core services
- Registers WordPress hooks and filters
- Handles plugin-specific functionality
- Coordinates between different components of the plugin
- Acts as the main controller for plugin operations

## Modular Architecture

The FivePrayer plugin follows a modular architecture with the following components:

### Modules (in `php/modules/`):
- `FivePrayerCaching.php` - Handles all caching-related functionality
- `FivePrayerScripts.php` - Manages JavaScript enqueueing and script-related functionality
- `FivePrayerShortcodes.php` - Handles shortcode-related functionality
- `FivePrayerCron.php` - Manages cron job and scheduling functionality
- `FivePrayerLogging.php` - Handles all logging functionality
- `FivePrayerUtilities.php` - Contains various utility functions
- `FivePrayerDatabase.php` - Handles database-related functionality
- `FivePrayerBreakdance.php` - Handles Breakdance integration functionality

### Core Classes (in `php/classes/core/`):
Organized by functionality areas like Admin, Ajax, API, Assets, Blocks, Cache, Calendar, Daily, database, helpers, Logging, Media, Security, ShortCodes, etc.

## Key Features
- Time-sensitive content handling with dynamic updates
- Integration with popular caching plugins (WP Rocket, W3 Total Cache, etc.)
- Page builder compatibility (Elementor, Breakdance, etc.)
- ESI (Edge Side Includes) support for dynamic content
- Comprehensive logging system
- Automated cache clearing for time-sensitive content
- Cron-based cache refresh for accurate prayer times