# Breakdance Documentation Overview

## Introduction

Breakdance is a WordPress page builder plugin that allows users to create websites using a visual drag-and-drop interface. It provides a comprehensive system for building pages, templates, headers, footers, and popups with advanced design capabilities.

## Core Architecture

### Elements System
- Elements are the building blocks of Breakdance pages
- Each element is defined as a PHP class extending `Breakdance\Elements\Element`
- Elements define content controls, design controls, and settings controls
- Built-in elements include sections, containers, headings, images, buttons, etc.

### Control System
- Controls define the UI for configuring elements
- Available control types: toggle, text, number, unit, dropdown, button_bar, section, etc.
- Controls can have conditions to show/hide based on other control values
- Layout options include vertical and inline arrangements

### Dynamic Data System
- Allows pulling data from various sources (posts, ACF fields, meta fields, etc.)
- Dynamic fields can be registered for use throughout the builder
- Supports string, image, gallery, and post data types
- Each field type extends from `Breakdance\DynamicData\Field`

## Key Components

### Elements
- Located in `plugin/elements/`
- Define the structure and functionality of page elements
- Each element has a unique slug and category

### Controls
- Controls are defined using helper functions like `control()` and `controlSection()`
- Options include type, layout, and conditional logic
- Support media queries and hover states

### Dynamic Data
- Located in `plugin/dynamic-data/`
- Provides data integration with WordPress
- Fields are registered and made available in the builder

## Conditions and Logic
- Conditions allow showing/hiding controls based on other values
- Uses path, operand, and value for conditional logic
- Supported operands: equals, not equals, is set, is not set, etc.