# Troubleshooting Breakdance Integration

## Overview
This guide helps diagnose and resolve common issues with Breakdance element integration. Use this guide when elements don't appear, behave unexpectedly, or cause errors.

## Common Issues

### Elements Not Appearing in Editor

#### Problem
Elements don't show up in the Breakdance editor.

#### Solutions
1. **Check Breakdance Activation**
   - Verify Breakdance plugin is activated
   - Check for any error messages on activation

2. **Verify Category Registration**
   - Ensure category is registered before elements
   - Check that the category slug matches the element's category() method

3. **Validate Save Location Registration**
   - Confirm save location path is correct
   - Verify the directory structure matches the registered path
   - Check that element files exist in the correct locations

4. **Check Element File Loading**
   - Verify element files are properly structured
   - Confirm namespaces are correct
   - Ensure all required methods are implemented

5. **Review Hook Timing**
   - Make sure registration happens on `breakdance_loaded` action
   - Verify priority is appropriate (typically 9)

### Category Not Visible

#### Problem
Custom category doesn't appear in the Breakdance element panel.

#### Solutions
1. **Registration Timing**
   ```php
   add_action('breakdance_loaded', 'register_category', 9);
   ```

2. **Correct Controller Usage**
   ```php
   \Breakdance\Elements\ElementCategoriesController::getInstance()
       ->registerCategory('slug', 'Display Name');
   ```

3. **Check for Conflicts**
   - Verify no other plugin is using the same category slug
   - Ensure category name doesn't conflict with existing categories

### Elements Appear But Don't Function

#### Problem
Elements show in the editor but don't work properly.

#### Solutions
1. **Check Required Methods**
   - Verify all required methods are implemented
   - Confirm method signatures are correct

2. **Template Issues**
   - Check that template files exist and are readable
   - Verify Twig syntax is correct
   - Ensure property paths are valid

3. **Control Configuration**
   - Validate control definitions
   - Check property paths in controls
   - Verify control types are supported

### JavaScript Errors

#### Problem
JavaScript errors occur when using elements.

#### Solutions
1. **Dependency Registration**
   - Verify scripts are properly registered
   - Check script paths are correct
   - Ensure dependencies are loaded in correct order

2. **Inline Scripts**
   - Validate JavaScript syntax in inline scripts
   - Check for proper selector usage
   - Verify %%SELECTOR%% replacement works

### Styling Issues

#### Problem
Elements don't display styling correctly.

#### Solutions
1. **CSS Template Validation**
   - Check that CSS template syntax is correct
   - Verify property references are valid
   - Ensure %%SELECTOR%% is used properly

2. **Default Styles**
   - Confirm default CSS file exists
   - Check for CSS syntax errors
   - Verify class names match element output

## Debugging Steps

### 1. Enable Debug Mode
Add these to your wp-config.php:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

### 2. Check Breakdance Logs
Look for Breakdance-specific logs in:
- WordPress debug.log
- Breakdance's internal logging system
- Browser console for JavaScript errors

### 3. Verify Registration
Add temporary debugging to verify registration:

```php
function debug_registration() {
    error_log('Breakdance loaded - registration starting');
    
    if (class_exists('\Breakdance\Elements\ElementCategoriesController')) {
        error_log('Category controller exists');
        \Breakdance\Elements\ElementCategoriesController::getInstance()
            ->registerCategory('debug-test', 'Debug Test');
        error_log('Category registered');
    }
    
    if (class_exists('\Breakdance\ElementStudio')) {
        error_log('ElementStudio exists');
    }
}
add_action('breakdance_loaded', 'debug_registration', 9);
```

### 4. Check File Permissions
Ensure Breakdance can read your element files:
- Verify file permissions allow reading
- Confirm file paths are accessible
- Check that directories exist

## Specific Error Solutions

### "Class not found" Errors
- Verify namespaces are correct
- Check that files are properly included
- Confirm class names match file names
- Ensure autoloading is working

### "Method not found" Errors
- Verify all required methods are implemented
- Check method signatures match expectations
- Confirm inheritance is correct

### "Undefined function" Errors
- Check that Breakdance functions are available
- Verify hook timing
- Confirm Breakdance is fully loaded

### Template Rendering Issues
- Validate Twig syntax
- Check for undefined variables
- Verify property paths exist
- Confirm data types match expectations

## Testing Protocol

### 1. Basic Functionality Test
- Add element to page
- Verify it appears in editor
- Check that it renders on frontend
- Test all controls work

### 2. Responsive Behavior
- Test on different screen sizes
- Verify responsive controls work
- Check mobile-specific settings

### 3. Performance Test
- Measure loading times
- Check for resource conflicts
- Verify no memory leaks

### 4. Compatibility Test
- Test with different themes
- Verify with other plugins active
- Check different WordPress versions

## Prevention Strategies

### Code Quality
- Follow Breakdance's coding standards
- Use proper error handling
- Implement validation checks
- Write unit tests when possible

### Documentation
- Document all custom methods
- Comment complex logic
- Maintain update logs
- Create usage guides

### Version Control
- Use version control systems
- Test changes in staging
- Maintain backup copies
- Document breaking changes

## Support Resources

### Official Documentation
- Breakdance official documentation
- WordPress plugin development resources
- PHP best practices guides

### Community Support
- Breakdance community forums
- WordPress developer communities
- Stack Overflow for specific issues

### Professional Help
- Contact Breakdance support
- Hire experienced developers
- Consult official partners