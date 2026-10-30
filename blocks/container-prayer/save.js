import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
export default function Save({ attributes }) {
    const { 
        customId, 
        customClass, 
        customAttributes, 
        elementTag: Tag 
    } = attributes;
    
    // Prepare additional attributes
    const additionalProps = {};
    if (customId) {
        additionalProps.id = customId;
    }
    if (customClass) {
        additionalProps.className = customClass;
    }
    
    // Add custom attributes
    customAttributes.forEach(attr => {
        if (attr.name && attr.value) {
            additionalProps[attr.name] = attr.value;
        }
    });

    const blockProps = useBlockProps.save(additionalProps);

    return (
        <Tag {...blockProps}>
            <InnerBlocks.Content />
        </Tag>
    );
}