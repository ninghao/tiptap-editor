<!--
  Empty Description Component
  
  Displays descriptive text for empty states with muted foreground color.
  Supports links with hover effects and proper text styling for readability.
  Use this component to provide additional context or instructions to users.
-->
<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <p
    data-slot="empty-description"
    :class="
      cn(
        'text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4',
        $attrs.class ?? '',
      )
    "
  >
    <slot />
  </p>
</template>
