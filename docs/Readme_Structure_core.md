# 📦 FivePrayer Plugin

A modular WordPress plugin for managing prayer times, calendars, translations, and more. Built with modern PHP practices using PSR-4 autoloading.

---

### 📁 Breakdown of Directories and Files

#### **`php/classes/`**
This directory contains all the PHP classes for the plugin, organized by functionality. Composer's **PSR-4 autoloading** automatically loads classes from here.

---

#### **`core/`**
This is the main directory of your plugin, containing all core components:

##### 📅 `calendar/`
Handles calendar-related functionality such as monthly views, date conversions, and hijri/gregorian logic.

##### 📆 `daily/`
Manages features for daily prayer times, scheduling, and daily logic.

##### 🧩 `shortcodes/`
Contains all shortcode-related classes to render plugin output via WordPress shortcodes.

---

#### 🧭 `controllers/`
Manages the control flow for various plugin features.

- **`api/`**  
  Houses REST API-related logic and controllers.
  
  - `ApiControllerRegistrar.php` – Registers all API endpoints.  
  - `RestControllerBase.php` – Abstract base class for REST endpoints.  
  - `index.php` – Security index file.

  - **`endpoints/`**  
    Endpoint-specific REST controllers:
    - `PngUrlController.php`
    - `PrayerSettingsMetaController.php`
    - `PrayerTimeTableController.php`
    - `TranslateController.php`

---

#### 🗃 `database/`
Handles database operations and schema logic.

- `DatabaseChecker.php`  
- `DatabaseInitializer.php`  
- `FivePrayer_DatabaseMetaSettings.php`  
- `FivePrayer_DatabaseTranslations.php`  
- `SchemaHelper.php`  
- `SchemaSetup.php`  
- `VersionManager.php`

---

#### 🛠 `helpers/`
Contains helper classes and services.

- `helpers-init.php`  
- `PNGUploader.php`  
- `Validator.php`  

**`WarningNotice/`** – Admin notices and deprecation messaging:

- `DatabaseMissingNotice.php`  
- `DeprecatedShortcodeScanner.php`  
- `NoticeRenderer.php`  
- `NoticeScriptEnqueuer.php`  
- `WarningNotice.php`  

**Views, Styles, Scripts for Notices:**

- `views/deprecation-notice.php`  
- `css/admin-notices.css`  
- `css/deprecation-notice.css`  
- `js/admin-notices.js`

---

#### 🧾 `js/`
Global JavaScript files for admin interactivity.

- `injector.js`

---

#### 🔧 Other Core Files
- `Plugin.php` – Main plugin bootstrap and lifecycle logic.  
- `AdminMenu.php` – Registers plugin options and admin menu items.  
- `AdminHtmlInjector.php` – Injects admin HTML where needed.  
- `Assets.php` – Manages enqueuing of JS/CSS.  
- `Shortcodes.php` – Initializes and renders plugin shortcodes.

---

#### 🛡 Index Files
Used to prevent direct access to directories.

- `php/classes/index.php`  
- `php/classes/core/controllers/index.php`  
- `php/classes/core/controllers/api/index.php`

---

### ⚙️ Composer Autoloading

The plugin uses **PSR-4 autoloading** for all classes. Configuration in `composer.json`:

```json
"autoload": {
  "psr-4": {
    "FivePrayer\\": "php/classes/"
  }
}
