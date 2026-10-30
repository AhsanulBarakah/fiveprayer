# BaseDynamicTag

## Overview
`BaseDynamicTag.php` is the foundational class for all FivePrayer dynamic tags in Elementor. It extends Elementor's core Tag class and provides shared functionality for retrieving and displaying prayer time data.

## Location
`php/classes/core/helpers/MetaField/Elementor/BaseDynamicTag.php`

## Key Features

### Core Functionality
- Extends Elementor's Tag class to provide dynamic content capabilities
- Implements security measures for data retrieval
- Provides unified data access through `UnifiedDataAccess`
- Handles word removal functionality for customized display

### Security Measures
- Validates post IDs before processing
- Sanitizes all input and output data
- Implements security helper for data validation
- Logs errors securely without exposing sensitive information

### Data Handling
- Retrieves prayer time data through `UnifiedDataAccess`
- Applies word removal rules based on admin settings
- Handles translation of time formats and numbers
- Manages caching for improved performance

### Dynamic Content Features
- Enqueues necessary scripts for live time updates
- Handles AJAX requests for dynamic content
- Supports word removal controls for customized display
- Integrates with admin-configured word removal rules

### Methods

#### `resolve_value($for_render)`
Retrieves and processes the value for the dynamic tag, applying security checks and word removal rules.

#### `render()`
Outputs the tag value in Elementor contexts that expect direct echoing.

#### `get_value($options)`
Returns the tag value when Elementor calls get_value().

#### `enqueue_secure_live_time_script()`
Enqueues necessary scripts for live time updates with security validation.

#### `remove_words_from_text($text, $words_to_remove)`
Removes specified words from text with security validation.

## Usage
This class is extended by all specific prayer time dynamic tags and is not used directly. It provides the foundation for all FivePrayer dynamic content in Elementor.