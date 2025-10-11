/**
 * Dropdown Menu Components
 *
 * Documentation: https://www.shadcn-vue.com/docs/components/dropdown-menu.html
 *
 * Displays a menu to the user — such as a set of actions or functions — triggered by a button.
 */

// Main dropdown menu container component
export { default as DropdownMenu } from './dropdown-menu.vue';

// Menu item components
export { default as DropdownMenuCheckboxItem } from './dropdown-menu-checkbox-item.vue';
export { default as DropdownMenuItem } from './dropdown-menu-item.vue';
export { default as DropdownMenuRadioItem } from './dropdown-menu-radio-item.vue';

// Menu content and layout components
export { default as DropdownMenuContent } from './dropdown-menu-content.vue';
export { default as DropdownMenuGroup } from './dropdown-menu-group.vue';
export { default as DropdownMenuLabel } from './dropdown-menu-label.vue';
export { default as DropdownMenuSeparator } from './dropdown-menu-separator.vue';

// Menu trigger and interaction components
export { default as DropdownMenuTrigger } from './dropdown-menu-trigger.vue';

// Submenu components
export { default as DropdownMenuSub } from './dropdown-menu-sub.vue';
export { default as DropdownMenuSubContent } from './dropdown-menu-sub-content.vue';
export { default as DropdownMenuSubTrigger } from './dropdown-menu-sub-trigger.vue';

// Specialized components
export { default as DropdownMenuRadioGroup } from './dropdown-menu-radio-group.vue';
export { default as DropdownMenuShortcut } from './dropdown-menu-shortcut.vue';

// Portal component from reka-ui
export { DropdownMenuPortal } from 'reka-ui';
