# Custom Prayer Time Schedules Feature Documentation

## Overview
The Custom Prayer Time Schedules feature allows administrators to define custom prayer times for specific dates or date ranges, overriding the default calculated prayer times. This is useful for special occasions, seasonal adjustments, or temporary changes.

## Components

### 1. Zustand Store (`useCustomPrayerTimeSchedulesStore.ts`)
Manages the state for custom prayer time schedules in memory.

#### Key Properties:
- `customSchedules`: Array of custom prayer time schedules
- `isCustomSchedulesEnabled`: Boolean flag to enable/disable custom schedules globally

#### Actions:
- `addSchedule(schedule)`: Add a new custom schedule
- `updateSchedule(id, updates)`: Update an existing schedule
- `removeSchedule(id)`: Remove a schedule by ID
- `toggleSchedule(id)`: Toggle a schedule's enabled status
- `toggleCustomSchedules(enabled)`: Enable/disable custom schedules globally
- `setCustomSchedules(schedules)`: Set all custom schedules at once
- `setIsCustomSchedulesEnabled(enabled)`: Set the global enabled flag

### 2. React Component (`CustomPrayerTimeSchedules.tsx`)
Main UI component that provides the interface for managing custom prayer time schedules.

#### Features:
- **Month-based Organization**: Schedules are grouped by month for easier navigation
- **Add/Edit Forms**: Forms to create and modify schedules with validation
- **Toggle Controls**: Individual and global toggle switches
- **Multi-month Support**: Ability to create schedules spanning multiple months
- **Day Selection**: Choose which days of the week the schedule applies to

#### Key Functions:
- `handleSubmit`: Handles form submission for adding/updating schedules
- `handleDeleteSchedule`: Deletes a schedule and saves to database
- `handleToggleSchedule`: Toggles individual schedule status
- `handleToggleCustomSchedules`: Toggles global custom schedules setting
- `saveCustomSchedulesToDatabase`: Manually saves all schedules to database

### 3. Backend API Endpoint (`PrayerSettingsMetaController.php`)
Handles the storage and retrieval of custom prayer time schedules in the database.

#### Database Storage:
- Table: `wp_fp_prayer_settings_meta`
- Meta Key: `custom-prayer-time-schedules`
- Value Format: JSON object containing state and version

#### Data Structure:
```json
{
  "state": {
    "customSchedules": [
      {
        "id": "unique-id",
        "name": "Schedule Name",
        "enabled": true,
        "startDate": "YYYY-MM-DD",
        "endDate": "YYYY-MM-DD",
        "prayerTimes": {
          "fajr": "HH:MM",
          "fajrIqamah": "HH:MM",
          "dhuhr": "HH:MM",
          "dhuhrIqamah": "HH:MM",
          "asr": "HH:MM",
          "asrIqamah": "HH:MM",
          "maghrib": "HH:MM",
          "maghribIqamah": "HH:MM",
          "isha": "HH:MM",
          "ishaIqamah": "HH:MM"
        },
        "prayerTimeEnabledFlags": {
          "isFajrEnabled": true,
          "isFajrIqamahEnabled": false,
          "isDhuhrEnabled": false,
          "isDhuhrIqamahEnabled": false,
          "isAsrEnabled": false,
          "isAsrIqamahEnabled": false,
          "isMaghribEnabled": false,
          "isMaghribIqamahEnabled": false,
          "isIshaEnabled": false,
          "isIshaIqamahEnabled": false
        },
        "daysOfWeek": [0, 1, 2, 3, 4, 5, 6],
        "dateOverrides": {...}
      }
    ],
    "isCustomSchedulesEnabled": true
  },
  "version": 0
}
```

## User Workflow

### Adding a New Schedule
1. Click "Add New Schedule" button
2. Fill in schedule details:
   - Schedule name
   - Prayer times and enable flags
   - Start and end dates
   - Days of week
3. Click "Save Schedule" to store in database

### Editing a Schedule
1. Click "Edit" on an existing schedule card
2. Modify the schedule details
3. Click "Update Schedule" to save changes to database

### Deleting a Schedule
1. Click "Delete" on a schedule card
2. Confirm deletion in the dialog
3. Schedule is removed from state and database

### Toggling Schedules
- Individual schedules can be toggled on/off using the toggle switch
- The global "Enable Custom Schedules" toggle controls whether custom schedules are active

## Technical Implementation Notes

### State Management
- Uses Zustand for client-side state management
- No localStorage persistence - data is fetched from database on load
- State changes are synchronized with the database when actions are performed

### Database Operations
- All changes trigger API calls to save the complete state to the database
- Uses WordPress REST API endpoint: `/wp-json/fiveprayer/v1/fp_prayersettings_meta`
- POST requests with `meta: 'custom-prayer-time-schedules'` and the complete state as value

### Data Validation
- Client-side validation for required fields
- Date validation to ensure end date is not before start date
- Time format validation

### Error Handling
- Toast notifications for success/error messages
- Graceful error handling for API failures
- Confirmation dialogs for destructive actions

## API Endpoints

### Storing Data
- **Method**: POST
- **Endpoint**: `/wp-json/fiveprayer/v1/fp_prayersettings_meta`
- **Data**: `{ meta: 'custom-prayer-time-schedules', value: schedulesData }`

### Retrieving Data
- **Method**: GET
- **Endpoint**: `/wp-json/fiveprayer/v1/fp_prayersettings_meta`
- **Returns**: Array of meta data including custom schedules

## Best Practices

1. **Performance**: Only save to database when users explicitly perform actions (not on every state change)
2. **Validation**: Always validate dates and times before saving
3. **User Experience**: Provide clear feedback when actions are successful or fail
4. **Data Integrity**: Preserve existing data when updating partial information
5. **Security**: Sanitize all input data before storing in database