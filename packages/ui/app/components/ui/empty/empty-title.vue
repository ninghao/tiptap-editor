<!--
  Empty Title Component
  
  Displays the main heading text for empty states. Provides consistent typography
  and styling for titles that describe the empty state to users.
  Use this component to provide a clear, concise title for your empty state.
-->
<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <h3 data-slot="empty-title" :class="cn('text-lg font-semibold', props.class)">
    <slot />
  </h3>
</template>
