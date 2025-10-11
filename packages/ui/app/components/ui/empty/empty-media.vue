<!--
  Empty Media Component
  
  Displays visual elements (icons, illustrations, or images) in empty states.
  Supports two variants:
  - default: Transparent background, suitable for illustrations or images
  - icon: Muted background with rounded corners, suitable for icons
  
  The component automatically handles SVG sizing and pointer events.
-->
<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import type { EmptyMediaVariants } from '.';
import { cn } from '@/lib/utils';
import { emptyMediaVariants } from '.';

const props = defineProps<{
  class?: HTMLAttributes['class'];
  variant?: EmptyMediaVariants['variant'];
}>();
</script>

<template>
  <div
    data-slot="empty-icon"
    :data-variant="variant"
    :class="cn(emptyMediaVariants({ variant }), props.class)"
  >
    <slot />
  </div>
</template>
