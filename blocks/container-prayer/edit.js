import { __ } from '@wordpress/i18n';
import { 
    useBlockProps, 
    InnerBlocks, 
    InspectorControls 
} from '@wordpress/block-editor';
import { 
    TextControl, 
    PanelBody, 
    Notice, 
    Button, 
    ButtonGroup,
    SelectControl 
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import './editor.css';

export default function Edit({ attributes, setAttributes, clientId }) {
    const blockProps = useBlockProps();
    const { 
        customId, 
        customClass, 
        customAttributes, 
        elementTag,
        invalidAttributeError 
    } = attributes;
    const [idError, setIdError] = useState('');
    const [newAttribute, setNewAttribute] = useState({ name: '', value: '', nameError: null });
    const [editingAttributeIndex, setEditingAttributeIndex] = useState(null);

    // HTML tags that make sense for a container
    const elementTags = [
        { label: 'Div', value: 'div' },
        { label: 'Section', value: 'section' },
        { label: 'Article', value: 'article' },
        { label: 'Aside', value: 'aside' },
        { label: 'Header', value: 'header' },
        { label: 'Footer', value: 'footer' },
        { label: 'Paragraph', value: 'p' },
        { label: 'Main', value: 'main' },
        { label: 'Nav', value: 'nav' },
        { label: 'Time', value: 'time' },
        { label: 'Address', value: 'address' },
        { label: 'Blockquote', value: 'blockquote' },
        { label: 'Caption', value: 'figcaption' },
        { label: 'Code', value: 'code' },
        { label: 'Details', value: 'details' },
        { label: 'Dialog', value: 'dialog' },
        { label: 'Figure', value: 'figure' },
        { label: 'Fieldset', value: 'fieldset' }
    ];

    // Check if the block has inner blocks
    const hasInnerBlocks = useSelect(
        (select) => {
            const { getBlock } = select('core/block-editor');
            const block = getBlock(clientId);
            return block && block.innerBlocks.length > 0;
        },
        [clientId]
    );

    // Secure attribute validation function
    const sanitizeAttributeName = (name) => {
        // Only allow specific attribute types for security
        const allowedPrefixes = [
            'data-', 
            'aria-', 
            'role', 
            'title'
        ];

        // Sanitize the name
        const sanitizedName = name
            .toLowerCase()
            .replace(/[^a-z0-9-_:]/g, '')
            .trim();

        // Check if the sanitized name starts with any of the allowed prefixes
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

    // Validate attribute name while typing
    const validateAttributeNameWhileTyping = (value) => {
        const { isValid, errorMessage } = sanitizeAttributeName(value);
        
        // Update state to show immediate feedback
        setNewAttribute(prev => ({ 
            ...prev, 
            name: value,
            nameError: !isValid ? errorMessage : null
        }));
    };

    // Secure attribute value sanitization
    const sanitizeAttributeValue = (value) => {
        // Escape HTML to prevent XSS
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .trim();
    };

    const validateId = (value) => {
        // Sanitize and validate ID
        const sanitizedId = value.replace(/[^a-zA-Z0-9-_]/g, '');
        
        // Check for valid characters and length
        if (sanitizedId !== value) {
            setIdError(__('ID can only contain letters, numbers, hyphens, and underscores.', 'fiveprayer'));
        } else if (sanitizedId.length > 50) {
            setIdError(__('ID must be 50 characters or less.', 'fiveprayer'));
        } else {
            setIdError('');
        }

        setAttributes({ customId: sanitizedId });
    };

    const addCustomAttribute = () => {
        if (newAttribute.name && newAttribute.value) {
            const { isValid, sanitizedName } = sanitizeAttributeName(newAttribute.name);
            const sanitizedValue = sanitizeAttributeValue(newAttribute.value);
            
            if (isValid) {
                setAttributes({
                    customAttributes: [
                        ...customAttributes, 
                        { name: sanitizedName, value: sanitizedValue }
                    ]
                });
                
                // Reset the input
                setNewAttribute({ name: '', value: '', nameError: null });
            } else {
                // Show error message for invalid attribute
                setAttributes({
                    invalidAttributeError: __('Invalid attribute name. Only data-*, aria-*, role, and title attributes are allowed.', 'fiveprayer')
                });
            }
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
            const { isValid, sanitizedName } = sanitizeAttributeName(newAttribute.name);
            const sanitizedValue = sanitizeAttributeValue(newAttribute.value);

            if (isValid) {
                updatedAttributes[editingAttributeIndex] = {
                    name: sanitizedName,
                    value: sanitizedValue
                };

                setAttributes({ 
                    customAttributes: updatedAttributes,
                    invalidAttributeError: null // Clear any previous error
                });
                
                // Reset editing state
                setEditingAttributeIndex(null);
                setNewAttribute({ name: '', value: '', nameError: null });
            } else {
                // Show error message for invalid attribute
                setAttributes({
                    invalidAttributeError: __('Invalid attribute name. Only data-*, aria-*, role, and title attributes are allowed.', 'fiveprayer')
                });
            }
        }
    };

    return (
        <>
            <InspectorControls>
                <PanelBody 
                    title={__('Container Settings', 'fiveprayer')} 
                    initialOpen={true}
                >
                    <SelectControl
                        label={__('Container Element', 'fiveprayer')}
                        value={elementTag}
                        options={elementTags}
                        onChange={(value) => setAttributes({ elementTag: value })}
                        help={__('Choose the HTML element for this container', 'fiveprayer')}
                        __nextHasNoMarginBottom
                    />

                    <TextControl
                        label={__('Custom ID', 'fiveprayer')}
                        value={customId}
                        onChange={validateId}
                        help={__('Unique identifier for this container', 'fiveprayer')}
                        __nextHasNoMarginBottom
                    />
                    {idError && (
                        <Notice 
                            status="warning" 
                            isDismissible={false}
                        >
                            {idError}
                        </Notice>
                    )}
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
                        <div key={index} className="fiveprayer-custom-attribute-item">
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
                                            value: value
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
                        <div className="fiveprayer-add-custom-attribute">
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
                                    value: value
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
                            {invalidAttributeError && (
                                <Notice 
                                    status="error" 
                                    isDismissible={false}
                                >
                                    {invalidAttributeError}
                                </Notice>
                            )}
                        </div>
                    )}
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                <div className={`
                    fiveprayer-container-block 
                    ${customAttributes.length > 0 ? 'has-attributes' : ''} 
                    ${hasInnerBlocks ? 'has-inner-blocks' : ''}
                `}>
                    <InnerBlocks 
                        allowedBlocks={true} 
                        renderAppender={InnerBlocks.DefaultAppender}
                        orientation="vertical"
                    />
                </div>
            </div>
        </>
    );
}