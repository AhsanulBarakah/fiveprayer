import { registerBlockType } from '@wordpress/blocks';
import Edit from './edit';
import metadata from './block.json';
import './style.scss';
// Register the block using the metadata and Edit component
registerBlockType(metadata.name, {
    ...metadata,  // Spread the metadata for easy inclusion
    edit: Edit,   // Set the Edit component to control the editor view
    save: () => null,  // Dynamic block doesn't require a save method
});
