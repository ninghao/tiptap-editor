/**
 * Empty State Component Library
 *
 * A collection of components for displaying empty states in applications.
 * Empty states are used when there's no data to display, such as when a list is empty,
 * a search returns no results, or when a user hasn't created any content yet.
 */

import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

// Export all empty state components
export { default as Empty } from './empty.vue';
export { default as EmptyContent } from './empty-content.vue';
export { default as EmptyDescription } from './empty-description.vue';
export { default as EmptyHeader } from './empty-header.vue';
export { default as EmptyMedia } from './empty-media.vue';
export { default as EmptyTitle } from './empty-title.vue';

/**
 * Empty Media Variants
 *
 * Defines the visual variants for the EmptyMedia component.
 * - default: Transparent background, suitable for illustrations or images
 * - icon: Muted background with rounded corners, suitable for icons
 */
export const emptyMediaVariants = cva(
  'mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: "bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type EmptyMediaVariants = VariantProps<typeof emptyMediaVariants>;
