# Usage Guide

## Getting Started

### In Breakdance Editor

1. **Accessing Elements**
   - Open the Breakdance editor for any page or post
   - Look for the "Five Prayer" category in the left panel
   - Expand the category to see all available elements

2. **Available Elements**
   - **Five Prayer Times**: Displays daily prayer times in a formatted layout
   - **Five Prayer Countdown**: Shows countdown to the next prayer time
   - **Five Prayer Schedule**: Complete daily prayer schedule with customizable layout
   - **Five Prayer Hijri Calendar**: Islamic Hijri calendar with prayer times

3. **Adding Elements to Page**
   - Drag and drop any element from the "Five Prayer" category
   - Drop it anywhere in your layout
   - The element will appear with default settings

### In Oxygen Builder

1. **Dynamic Fields**
   - Open Oxygen Builder for any page or post
   - Go to Dynamic Content → Insert Dynamic Content
   - Select "Five Prayer" category from the dropdown
   - Choose the specific prayer time field you need

2. **Element Integration**
   - The elements are also available in Oxygen's element panel
   - Look for the "Five Prayer" category in the elements list

## Element Configuration

### Five Prayer Times Element

#### Content Controls
- **Prayer Times Selection**: Choose which prayers to display (All, Fajr only, etc.)
- **Custom Prayer Selection**: Select specific prayers when using "Custom Selection" option
- **Show Iqamah Times**: Toggle to show or hide Iqamah times

#### Design Controls
- **Time Color**: Set color for prayer times
- **Prayer Name Color**: Set color for prayer names
- **Background Color**: Set background color for the element
- **Border Radius**: Adjust corner rounding

#### Settings Controls
- **Update Frequency**: How often the times update
- **Time Format**: 12-hour or 24-hour format

### Five Prayer Countdown Element

#### Content Controls
- **Target Prayer**: Select which prayer to count down to (Next, Fajr, Dhuhr, etc.)
- **Show Days/Hours/Minutes/Seconds**: Toggle visibility of time units
- **Custom Message**: Message to show when countdown reaches zero

#### Design Controls
- **Display Format**: Choose between blocks, inline, or circular display
- **Block Dimensions**: Set width and height for block display
- **Color Options**: Customize time, label, and background colors

#### Settings Controls
- **Auto Refresh**: Enable/disable automatic refresh
- **Refresh Interval**: Set refresh rate in seconds

### Five Prayer Schedule Element

#### Content Controls
- **Show Today Only**: Display only today's schedule
- **Show Prayer Names**: Toggle prayer name visibility
- **Show Iqamah Times**: Toggle Iqamah time visibility
- **Include Sunrise**: Show sunrise time
- **Time Format**: 12-hour or 24-hour format

#### Design Controls
- **Layout**: Horizontal, vertical, or grid layout
- **Color Options**: Customize various text and background colors
- **Spacing**: Adjust padding and margins

#### Settings Controls
- **Auto Update**: Enable automatic time updates
- **Highlight Current**: Highlight the current prayer
- **Show Countdown**: Display countdown to next prayer

### Five Prayer Hijri Calendar Element

#### Content Controls
- **Show Current Month**: Display current month
- **Show Gregorian/Hijri Dates**: Toggle date visibility
- **Highlight Today**: Highlight current date
- **Show Prayer Times**: Include prayer times in calendar

#### Design Controls
- **Calendar Size**: Small, medium, or large
- **Color Options**: Customize header, day names, and date colors
- **Background and Border**: Customize appearance

#### Settings Controls
- **Auto Update**: Enable automatic date updates
- **Show Week Numbers**: Display week numbers

## Dynamic Fields Usage

### Available Dynamic Fields

The following dynamic fields are available in both Breakdance and Oxygen:

- **Fajr Begins Time**
- **Sunrise Time** 
- **Dhuhr Begins Time**
- **Asr Begins Time**
- **Hanafi Begins Time (2 Mithl)** — the optional second ‘Asr (formerly listed as “Asr 2 Begins Time”); empty on days with none stored
- **Maghrib Begins Time**
- **Isha Begins Time**
- **Fajr Iqamah Time**
- **Dhuhr Iqamah Time**
- **Asr Iqamah Time**
- **Maghrib Iqamah Time**
- **Isha Iqamah Time**
- **Current Time**
- **Current Date**
- **Next Prayer Time**
- **Hijri Date**
- **Masjid Name**
- **Current Location**

### Using Dynamic Fields

1. **In Breakdance**:
   - Click on any text element
   - Click the dynamic data icon (usually `{}`)
   - Select "Five Prayer" category
   - Choose the desired field

2. **In Oxygen**:
   - Edit any element with text
   - Click "Insert Dynamic Content"
   - Select "Five Prayer" category
   - Choose the desired field

## Best Practices

### Performance Optimization
- Use only the elements you need
- Avoid multiple countdown elements on the same page
- Cache pages with prayer time elements appropriately

### Styling Tips
- Use consistent color schemes across elements
- Ensure good contrast for readability
- Test on different screen sizes
- Consider mobile-first design approach

### Content Management
- Regularly verify prayer times accuracy
- Update location settings as needed
- Monitor for any time zone changes

## Common Use Cases

### Homepage Display
- Use the Five Prayer Times element for prominent display
- Add countdown to next prayer in sidebar
- Include Hijri calendar for reference

### Prayer Time Pages
- Create dedicated pages for daily, weekly, or monthly schedules
- Use the schedule element for comprehensive views
- Add countdown timers for engagement

### Widget Areas
- Place countdown elements in widget areas
- Use compact versions for sidebar display
- Include dynamic date displays

## Troubleshooting

### Elements Not Updating
- Check that caching is properly configured
- Verify time zone settings
- Ensure server time is accurate

### Styling Issues
- Check for CSS conflicts
- Verify custom styles are properly applied
- Test in different browsers

### Dynamic Content Not Loading
- Verify dynamic field availability
- Check for JavaScript errors
- Ensure proper permissions