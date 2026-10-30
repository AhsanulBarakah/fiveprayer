import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, ToggleControl, TextControl, Button, ButtonGroup } from '@wordpress/components';
import ServerSideRender from '@wordpress/server-side-render';
import { useState } from '@wordpress/element';
import './editor.scss';

const shortcodes = [
    { value: 'fajr_begins', label: 'Fajr Begins Time' },
    { value: 'fajr_iqamah', label: 'Fajr Iqamah Time' },
    { value: 'fajr_name', label: 'Fajr Name' },
    { value: 'dhuhr_begins', label: 'Dhuhr Begins Time' },
    { value: 'dhuhr_iqamah', label: 'Dhuhr Iqamah Time' },
    { value: 'dhuhr_name', label: 'Dhuhr Name' },
    { value: 'asr_begins', label: 'Asr Begins Time' },
    { value: 'asr_second_begins', label: 'Asr 2 Begins Time (2 Mithl)' },
    { value: 'asr_iqamah', label: 'Asr Iqamah Time' },
    { value: 'asr_name', label: 'Asr Name' },
    { value: 'maghrib_begins', label: 'Maghrib Begins Time' },
    { value: 'maghrib_iqamah', label: 'Maghrib Iqamah Time' },
    { value: 'maghrib_name', label: 'Maghrib Name' },
    { value: 'isha_begins', label: 'Isha Begins Time' },
    { value: 'isha_iqamah', label: 'Isha Iqamah Time' },
    { value: 'isha_name', label: 'Isha Name' },
    { value: 'midnight', label: 'Midnight Time' },
    { value: 'midnight_name', label: 'Midnight Name' },
    { value: 'prayer_times_for_today', label: 'Prayer Times For Today' },
    { value: 'current_title', label: 'The Current Prayer' },
    { value: 'masjid_name', label: 'Masjid Name' },
    { value: 'current_location', label: 'Current Location' },
    { value: 'sunrise', label: 'Sunrise Time' },
    { value: 'sunrise_name', label: 'Sunrise Name' },
    { value: 'currentDate', label: 'Current Date' },
    { value: 'hijra_date', label: 'Hijra Date' },
    { value: 'current_time', label: 'Current Time' },
    { value: 'next_prayer_begins_time', label: 'Next Prayer Begins Time' },
    { value: 'next_prayer_begins_title', label: 'Next Prayer Begins Title' },
    { value: 'next_prayer_iqamah_time', label: 'Next Prayer Iqamah Time' },
    { value: 'next_prayer_iqamah_title', label: 'Next Prayer Iqamah Title' },
    { value: 'single_prayer_begins_title', label: 'Single Prayer Begins Title' },
    { value: 'single_prayer_iqamah_title', label: 'Single Prayer Iqamah Title' },
    { value: 'next_prayer_title', label: 'Next Prayer Title' }
];

const elementTags = [
    { label: 'Paragraph', value: 'p' },
    { label: 'Div', value: 'div' },
    { label: 'Span', value: 'span' },
    { label: 'Section', value: 'section' },
    { label: 'Article', value: 'article' },
    { label: 'Aside', value: 'aside' },
    { label: 'Header', value: 'header' },
    { label: 'Footer', value: 'footer' },
    { label: 'Main', value: 'main' },
    { label: 'Nav', value: 'nav' },
    { label: 'H1', value: 'h1' },
    { label: 'H2', value: 'h2' },
    { label: 'H3', value: 'h3' },
    { label: 'H4', value: 'h4' },
    { label: 'H5', value: 'h5' },
    { label: 'H6', value: 'h6' },
    { label: 'Time', value: 'time' }

];

export default function Edit({ attributes, setAttributes }) {
    const blockProps = useBlockProps();
    const { 
        shortcode, 
        removeNextWord, 
        removeSpecificWord,
        elementTag,
        customId,
        customClass,
        customAttributes 
    } = attributes;

    const [newAttribute, setNewAttribute] = useState({ name: '', value: '', nameError: null });
    const [editingAttributeIndex, setEditingAttributeIndex] = useState(null);

    const isRelevantShortcode = [
        'next_prayer_begins_title',
        'next_prayer_iqamah_title',
        'single_prayer_begins_title',
        'single_prayer_iqamah_title'
    ].includes(shortcode);

    const handleShortcodeChange = (newShortcode) => {
        setAttributes({ 
            shortcode: newShortcode,
            isCurrentTime: newShortcode === 'current_time',
            removeNextWord: false,
            removeSpecificWord: '' 
        });
    };

    const addCustomAttribute = () => {
        if (newAttribute.name && newAttribute.value && !newAttribute.nameError) {
            const sanitizedName = newAttribute.name
                .toLowerCase()
                .replace(/[^a-z0-9-_:]/g, '')
                .trim();

            setAttributes({
                customAttributes: [
                    ...customAttributes, 
                    { name: sanitizedName, value: newAttribute.value.replace(/"/g, '&quot;') }
                ]
            });
            
            // Reset the input
            setNewAttribute({ name: '', value: '', nameError: null });
        }
    };

    const removeCustomAttribute = (indexToRemove) => {
        setAttributes({
            customAttributes: customAttributes.filter((_, index) => index !== indexToRemove)
        });
        // Reset editing state
        setEditingAttributeIndex(null);
    };

    const startEditingAttribute = (index) => {
        setEditingAttributeIndex(index);
        setNewAttribute({
            name: customAttributes[index].name,
            value: customAttributes[index].value,
            nameError: null
        });
    };

    const saveEditedAttribute = () => {
        if (editingAttributeIndex !== null) {
            const updatedAttributes = [...customAttributes];
            const sanitizedName = newAttribute.name
                .toLowerCase()
                .replace(/[^a-z0-9-_:]/g, '')
                .trim();

            updatedAttributes[editingAttributeIndex] = {
                name: sanitizedName,
                value: newAttribute.value.replace(/"/g, '&quot;')
            };

            setAttributes({ customAttributes: updatedAttributes });
            
            // Reset editing state
            setEditingAttributeIndex(null);
            setNewAttribute({ name: '', value: '', nameError: null });
        }
    };

    const sanitizeAttributeName = (name) => {
        const allowedPrefixes = [
            'data-', 
            'aria-', 
            'role', 
            'title'
        ];

        const sanitizedName = name
            .toLowerCase()
            .replace(/[^a-z0-9-_:]/g, '')
            .trim();

        const isValidAttribute = allowedPrefixes.some(prefix => 
            sanitizedName.startsWith(prefix) || 
            sanitizedName === 'role' || 
            sanitizedName === 'title'
        );

        return {
            isValid: isValidAttribute,
            sanitizedName: isValidAttribute ? sanitizedName : null,
            errorMessage: isValidAttribute ? null : __('Only data-*, aria-*, role, and title attributes are allowed.', 'fiveprayer')
        };
    };

    const validateAttributeNameWhileTyping = (value) => {
        const { isValid, errorMessage } = sanitizeAttributeName(value);
        
        setNewAttribute(prev => ({ 
            ...prev, 
            name: value,
            nameError: !isValid ? errorMessage : null
        }));
    };

    return (
        <div {...blockProps}>
            <InspectorControls>
                <PanelBody 
                    title={__('Single Prayer Settings', 'fiveprayer')} 
                    initialOpen={true}
                >
                    <SelectControl
                        label={__('Select Single Prayer', 'fiveprayer')}
                        value={shortcode}
                        options={shortcodes}
                        onChange={handleShortcodeChange}
                        __nextHasNoMarginBottom
                    />

                    {isRelevantShortcode && (
                        <>
                            <ToggleControl
                                label={__('Remove second word', 'fiveprayer')}
                                checked={removeNextWord}
                                onChange={(newVal) => setAttributes({ removeNextWord: newVal })}
                            />

                            <TextControl
                                label={__('Remove specific word', 'fiveprayer')}
                                value={removeSpecificWord}
                                onChange={(newVal) => setAttributes({ removeSpecificWord: newVal })}
                                help={__('Enter exact word to remove (case-sensitive)', 'fiveprayer')}
                                __nextHasNoMarginBottom
                            />
                        </>
                    )}
                </PanelBody>

                <PanelBody 
                    title={__('Prayer Block Settings', 'fiveprayer')} 
                    initialOpen={false}
                >
                    <SelectControl
                        label={__('Container Element', 'fiveprayer')}
                        value={elementTag}
                        options={elementTags}
                        onChange={(value) => setAttributes({ elementTag: value })}
                        help={__('Choose the HTML element for this prayer block', 'fiveprayer')}
                        __nextHasNoMarginBottom
                    />

                    <TextControl
                        label={__('Custom ID', 'fiveprayer')}
                        value={customId}
                        onChange={(value) => setAttributes({ 
                            customId: value.replace(/[^a-zA-Z0-9-_]/g, '') 
                        })}
                        help={__('Unique identifier for this prayer block', 'fiveprayer')}
                        __nextHasNoMarginBottom
                    />

                    <TextControl
                        label={__('Custom Class', 'fiveprayer')}
                        value={customClass}
                        onChange={(value) => setAttributes({ 
                            customClass: value.replace(/[^a-zA-Z0-9\s-_]/g, '') 
                        })}
                        help={__('Additional CSS classes', 'fiveprayer')}
                        __nextHasNoMarginBottom
                    />
                </PanelBody>

                <PanelBody 
                    title={__('Custom Attributes', 'fiveprayer')} 
                    initialOpen={false}
                >
                    {customAttributes.map((attr, index) => (
                        <div key={index} className="custom-attribute-item">
                            {editingAttributeIndex === index ? (
                                <>
                                    <TextControl
                                        label={__('Attribute Name', 'fiveprayer')}
                                        value={newAttribute.name}
                                        onChange={(value) => validateAttributeNameWhileTyping(value)}
                                        isinvalid={newAttribute.nameError ? 'true' : undefined}
                                        help={newAttribute.nameError}
                                        __nextHasNoMarginBottom
                                    />
                                    <TextControl
                                        label={__('Attribute Value', 'fiveprayer')}
                                        value={newAttribute.value}
                                        onChange={(value) => setNewAttribute(prev => ({ 
                                            ...prev, 
                                            value: value.replace(/"/g, '&quot;')
                                        }))}
                                        __nextHasNoMarginBottom
                                    />
                                    <ButtonGroup>
                                        <Button 
                                            isPrimary 
                                            onClick={saveEditedAttribute}
                                            disabled={!newAttribute.name || !newAttribute.value || !!newAttribute.nameError}
                                        >
                                            {__('Save', 'fiveprayer')}
                                        </Button>
                                        <Button 
                                            isSecondary 
                                            onClick={() => setEditingAttributeIndex(null)}
                                        >
                                            {__('Cancel', 'fiveprayer')}
                                        </Button>
                                    </ButtonGroup>
                                </>
                            ) : (
                                <>
                                    <TextControl
                                        label={__('Attribute Name', 'fiveprayer')}
                                        value={attr.name}
                                        disabled
                                        __nextHasNoMarginBottom
                                    />
                                    <TextControl
                                        label={__('Attribute Value', 'fiveprayer')}
                                        value={attr.value}
                                        disabled
                                        __nextHasNoMarginBottom
                                    />
                                    <ButtonGroup>
                                        <Button 
                                            isSecondary 
                                            onClick={() => startEditingAttribute(index)}
                                        >
                                            {__('Edit', 'fiveprayer')}
                                        </Button>
                                        <Button 
                                            isDestructive 
                                            onClick={() => removeCustomAttribute(index)}
                                        >
                                            {__('Remove', 'fiveprayer')}
                                        </Button>
                                    </ButtonGroup>
                                </>
                            )}
                        </div>
                    ))}

                    {editingAttributeIndex === null && (
                        <div className="add-custom-attribute">
                            <TextControl
                                label={__('New Attribute Name', 'fiveprayer')}
                                value={newAttribute.name}
                                onChange={(value) => validateAttributeNameWhileTyping(value)}
                                isinvalid={newAttribute.nameError ? 'true' : undefined}
                                help={newAttribute.nameError}
                                __nextHasNoMarginBottom
                            />
                            <TextControl
                                label={__('New Attribute Value', 'fiveprayer')}
                                value={newAttribute.value}
                                onChange={(value) => setNewAttribute(prev => ({ 
                                    ...prev, 
                                    value: value.replace(/"/g, '&quot;')
                                }))}
                                __nextHasNoMarginBottom
                            />
                            <Button 
                                isPrimary 
                                onClick={addCustomAttribute}
                                disabled={!newAttribute.name || !newAttribute.value || !!newAttribute.nameError}
                            >
                                {__('Add Attribute', 'fiveprayer')}
                            </Button>
                        </div>
                    )}
                </PanelBody>
            </InspectorControls>
            <ServerSideRender
                block="fiveprayer/single-prayer"
                attributes={attributes}
                key={`${shortcode}-${removeNextWord}-${removeSpecificWord}-${customId}-${customClass}`}
            />
        </div>
    );
}
