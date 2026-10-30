# FivePrayer Plugin Documentation Index

Welcome to the FivePrayer plugin documentation. This collection of documents provides comprehensive information about the plugin's features, architecture, and development practices.

## Table of Contents

### Core Documentation
- [Development Guide](DEVELOPMENT.md) - Main development documentation with references to other files
- [API Documentation](API-Documentation.md) - API endpoints and usage, including the standard `asr2` (second ‘Asr) field in every prayer-times payload
- [API Security](API-Security.md) - Brute force protection and email notifications
- [Core Files Documentation](core-files-documentation.md) - Overview of core plugin files
- [Utility Files Documentation](utility-files-documentation.md) - Documentation for utility functions
- [Readme Structure](Readme_Structure_core.md) - Information about the README structure

### Features
- [Shortcode Reference](SHORTCODES.md) - Every shortcode the plugin registers, including the deprecated tags and their replacements
- [TV Display Mode](TV_DISPLAY_MODE.md) - Step-by-step guide to turning a page into a full-screen TV display, including the layout width that decides which of your page builder's breakpoints the TV gets, how to match a custom breakpoint to that width, plus the mosque deployment workflow (one screen per masjid, shared configuration via export/import)
- [Share on Local Network](LOCAL_NETWORK_TESTING.md) - Share a locally-hosted site with the TV, phone or tablet on the same network using the computer's network IP, without touching the database, with a full Issues & Fixes troubleshooting guide (Windows firewall profiles, guest networks, client isolation, public-IP limits)

### Page Builder Integrations
- [Elementor Integration](elementor/index.md) - Elementor page builder integration
  - [Base Dynamic Tag](elementor/BaseDynamicTag.md)
  - [Abstract Field Tag](elementor/AbstractFieldTag.md)
  - [All Elementor Tags](elementor/elementor-integration.md)

#### Common Integration Components
- [Shared Element Integration Control](common/element-availability-control.md) - Common implementation for element availability

#### Oxygen Builder
- [Oxygen Integration Control](oxygen/oxygen-integration-control.md) - How to control Oxygen Builder integration

#### Breakdance Builder
- [Breakdance Overview](breakdance/breakdance-overview.md) - Overview of Breakdance integration
- [Breakdance Controls](breakdance/controls/breakdance-controls.md) - Breakdance controls documentation
- [Breakdance Conditions](breakdance/conditions/breakdance-conditions.md) - Conditions in Breakdance
- [Usage Guide](breakdance/usage/usage-guide.md) - How to use Breakdance elements
- [Troubleshooting](breakdance/troubleshooting/troubleshooting-guide.md) - Common issues and solutions
- [Dynamic Data](breakdance/dynamic-data/breakdance-dynamic-data.md) - Dynamic data in Breakdance
- [Integration Details](breakdance/integration/breakdance-integration.md) - Integration specifics
- [Installation Guide](breakdance/installation/installation-guide.md) - How to install and set up
- [Element Templates](breakdance/element-templates/element-templates.md) - Templates for creating elements
- [Development Guide](breakdance/development/development-guide.md) - Development guidelines for Breakdance
- [How to Add Elements](breakdance/how-to-add-elements/integration-documentation.md) - Adding new elements
- [Breakdance Integration Control](breakdance/breakdance-integration-control.md) - How to control Breakdance Builder integration

### Dynamic Tags
- [Dynamic Tags Refactoring](dynamic-tags/dynamic-tags-refactoring.md) - Information about the dynamic tags refactoring

### Technical Improvements
- [Cache Compatibility Analysis](cache_compatibility_analysis.md) - Analysis of cache compatibility
- [Cache Fixes Documentation](CACHE_FIXES_DOCUMENTATION.md) - Documentation for cache-related fixes
- [CSS Fixes Documentation](CSS_FIXES_DOCUMENTATION.md) - Documentation for CSS-related fixes
- [Custom Prayer Time Schedules](CustomPrayerTimeSchedules_Documentation.md) - Documentation for custom prayer time schedules

### Development Practices
- [Git Guide](GitGuide.md) - Git workflow and practices for the project

## Getting Started

1. Start with the [Development Guide](DEVELOPMENT.md) for an overview of key development concepts
2. Explore specific integrations based on your needs (Elementor, Oxygen, Breakdance)
3. Refer to the API documentation for programmatic usage
4. Check troubleshooting guides for common issues

## Contributing

See the [Git Guide](GitGuide.md) for information on contributing to the project.