<!--
  Empty Content Component
  
  A wrapper component that provides consistent spacing and layout for empty state content.
  Centers content with a maximum width and provides proper gap spacing between child elements.
  Typically used to wrap the main content area of an empty state.
-->
<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    data-slot="empty-content"
    :class="
      cn(
        'flex w-full min-w-0 max-w-sm flex-col items-center gap-4 text-balance text-sm',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
