import { registerBlockType } from '@wordpress/blocks';
import Edit from './edit';
import Save from './save';
import './style.css';

registerBlockType('fiveprayer/container-prayer', {
    edit: Edit,
    save: Save
});