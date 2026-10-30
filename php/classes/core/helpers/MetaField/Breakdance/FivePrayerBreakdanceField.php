<?php

namespace FivePrayer\Core\Helpers\MetaField\Breakdance;

use FivePrayer\Core\ShortCodes\Data\ShortCodeMap;
use FivePrayer\Core\Security\SecurityHelper;
use FivePrayer\Core\Logging\Logger;
use FivePrayer\Core\Helpers\MetaField\Breakdance\Components\BreakdanceFieldControls;
use FivePrayer\Core\Helpers\MetaField\Breakdance\Components\WordRemovalUtility;
use FivePrayer\Core\Helpers\MetaField\Breakdance\Components\FieldDataManager;

defined('ABSPATH') || exit;

/**
 * Breakdance Field Class for FivePrayer
 */
if (function_exists('\Breakdance\DynamicData\registerField') && class_exists('\Breakdance\DynamicData\StringField')) {
    class FivePrayerBreakdanceField extends \Breakdance\DynamicData\StringField
    {
        protected array $fieldData;

        /**
         * @return string
         */
        public function __construct($fieldData)
        {
            $this->fieldData = $fieldData;
        }

        /**
         * @return string
         */
        public function label()
        {
            return $this->fieldData['label'];
        }

        /**
         * @return string
         */
        public function category()
        {
            return $this->fieldData['category'];
        }

        /**
         * @return string
         */
        public function subcategory()
        {
            return $this->fieldData['group'];
        }

        /**
         * @return array
         */
        public function returnTypes()
        {
            // Specify the return types for this field
            return ['string'];
        }

        /**
         * @return array
         */
        public function controls()
        {
            // Use the BreakdanceFieldControls component to get controls
            if (BreakdanceFieldControls::isTitleField($this->fieldData['slug'])) {
                return BreakdanceFieldControls::getTitleFieldControls();
            }
            
            return [];
        }

        /**
         * @return string
         */
        public function slug()
        {
            return 'fiveprayer_field_' . $this->fieldData['slug'];
        }

        /**
         * @return \Breakdance\DynamicData\StringData
         */
        public function handler($attributes): \Breakdance\DynamicData\StringData
        {
            $field_key = $this->fieldData['slug'];

            // Validate field key against allowed values to prevent injection
            $allowed_fields = array_values(ShortCodeMap::ACTIVE_SHORTCODES);
            if (!in_array($field_key, $allowed_fields, true)) {
                return \Breakdance\DynamicData\StringData::emptyString();
            }

            $post_id = get_the_ID();
            if (!$post_id) {
                return \Breakdance\DynamicData\StringData::emptyString();
            }

            // Use FieldDataManager to get the field data
            $meta_value = FieldDataManager::getFieldData($field_key, $post_id);

            // Apply word removal functionality if this is a title field
            $meta_value = WordRemovalUtility::applyWordRemoval($meta_value, $field_key, $attributes);

            return \Breakdance\DynamicData\StringData::fromString($meta_value);
        }
    }
}