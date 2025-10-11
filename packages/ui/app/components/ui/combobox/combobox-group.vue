<!--
  Combobox Group Component
  
  Groups related combobox items together with an optional heading.
  Useful for organizing options into logical categories or sections.
  
  Features:
  - Optional heading prop for group labels
  - Proper spacing and typography for group headers
  - Customizable styling via class prop
  - Overflow handling for long content
  
  Usage:
  <ComboboxGroup heading="Fruits">
    <ComboboxItem value="apple">Apple</ComboboxItem>
    <ComboboxItem value="banana">Banana</ComboboxItem>
  </ComboboxGroup>
-->
<script setup lang="ts">
import type { ComboboxGroupProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { ComboboxGroup, ComboboxLabel } from 'reka-ui';
import { cn } from '@/lib/utils';

// Combine Reka UI group props with custom class and heading props
const props = defineProps<
  ComboboxGroupProps & {
    class?: HTMLAttributes['class'];
    heading?: string;
  }
>();

// Separate class prop from other props for styling
const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
  <!-- Group container with optional heading and proper styling -->
  <ComboboxGroup
    data-slot="combobox-group"
    v-bind="delegatedProps"
    :class="cn('overflow-hidden p-1 text-foreground', props.class)"
  >
    <!-- Optional group heading with consistent styling -->
    <ComboboxLabel v-if="heading" class="px-2 py-1.5 text-xs font-medium text-muted-foreground">
      {{ heading }}
    </ComboboxLabel>
    <slot />
  </ComboboxGroup>
</template>
