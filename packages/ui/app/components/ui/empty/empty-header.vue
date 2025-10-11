<!--
  Empty Header Component
  
  A container for the header section of an empty state, typically containing
  the title and description. Provides centered layout with proper spacing
  and maximum width constraints for optimal readability.
-->
<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    data-slot="empty-header"
    :class="cn('flex max-w-sm flex-col items-center gap-2 text-center', $attrs.class ?? '')"
  >
    <slot />
  </div>
</template>
