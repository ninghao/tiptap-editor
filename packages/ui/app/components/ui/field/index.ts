/**
 * Field Components
 *
 * Documentation: https://www.shadcn-vue.com/docs/components/field.html
 *
 * Combine labels, controls, and help text to compose accessible form fields and grouped inputs.
 * A comprehensive form field system for building accessible and consistent form layouts.
 * Supports vertical, horizontal, and responsive orientations with proper spacing and validation states.
 */

import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

// Field variant styles for different orientations
export const fieldVariants = cva(
  'group/field flex w-full gap-3 data-[invalid=true]:text-destructive',
  {
    variants: {
      orientation: {
        vertical: ['flex-col [&>*]:w-full [&>.sr-only]:w-auto'],
        horizontal: [
          'flex-row items-center',
          '[&>[data-slot=field-label]]:flex-auto',
          'has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
        ],
        responsive: [
          'flex-col [&>*]:w-full [&>.sr-only]:w-auto @md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto',
          '@md/field-group:[&>[data-slot=field-label]]:flex-auto',
          '@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
        ],
      },
    },
    defaultVariants: {
      orientation: 'vertical',
    },
  },
);

export type FieldVariants = VariantProps<typeof fieldVariants>;

// Main field container component
export { default as Field } from './field.vue';

// Field content and layout components
export { default as FieldContent } from './field-content.vue';
export { default as FieldGroup } from './field-group.vue';
export { default as FieldSet } from './field-set.vue';

// Field labeling and description components
export { default as FieldLabel } from './field-label.vue';
export { default as FieldLegend } from './field-legend.vue';
export { default as FieldTitle } from './field-title.vue';
export { default as FieldDescription } from './field-description.vue';

// Field validation and feedback components
export { default as FieldError } from './field-error.vue';

// Field visual separator component
export { default as FieldSeparator } from './field-separator.vue';
