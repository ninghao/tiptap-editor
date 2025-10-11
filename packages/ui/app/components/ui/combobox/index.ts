/**
 * Combobox Component Library
 *
 * A comprehensive set of Vue components for building accessible combobox interfaces.
 * Built on top of Reka UI primitives with custom styling and enhanced functionality.
 *
 * Components:
 * - Combobox: Root container component
 * - ComboboxAnchor: Positioning anchor for the dropdown
 * - ComboboxEmpty: Empty state display
 * - ComboboxGroup: Grouping container with optional heading
 * - ComboboxInput: Search input with icon
 * - ComboboxItem: Individual selectable items
 * - ComboboxItemIndicator: Selection indicator (checkmark, etc.)
 * - ComboboxList: Dropdown content container
 * - ComboboxSeparator: Visual separator between groups
 * - ComboboxViewport: Scrollable viewport for long lists
 */

// Main combobox components
export { default as Combobox } from './combobox.vue';
export { default as ComboboxAnchor } from './combobox-anchor.vue';
export { default as ComboboxEmpty } from './combobox-empty.vue';
export { default as ComboboxGroup } from './combobox-group.vue';
export { default as ComboboxInput } from './combobox-input.vue';
export { default as ComboboxItem } from './combobox-item.vue';
export { default as ComboboxItemIndicator } from './combobox-item-indicator.vue';
export { default as ComboboxList } from './combobox-list.vue';
export { default as ComboboxSeparator } from './combobox-separator.vue';
export { default as ComboboxViewport } from './combobox-viewport.vue';

// Re-exported primitives from Reka UI
export { ComboboxCancel, ComboboxTrigger } from 'reka-ui';
