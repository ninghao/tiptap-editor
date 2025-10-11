<!--
  Combobox Item Indicator Component
  
  Visual indicator (typically a checkmark) that shows when an item is selected.
  This component is automatically shown/hidden based on the item's selection state.
  
  Features:
  - Automatically positioned to the right (ml-auto)
  - Customizable styling via class prop
  - Slot for custom indicator content (icons, etc.)
  - Only visible when item is selected
  
  Usage:
  <ComboboxItemIndicator>
    <CheckIcon class="h-4 w-4" />
  </ComboboxItemIndicator>
-->
<script setup lang="ts">
import type { ComboboxItemIndicatorProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { ComboboxItemIndicator, useForwardProps } from 'reka-ui';
import { cn } from '@/lib/utils';

// Combine Reka UI indicator props with custom class prop
const props = defineProps<ComboboxItemIndicatorProps & { class?: HTMLAttributes['class'] }>();

// Separate class prop from other props for styling
const delegatedProps = reactiveOmit(props, 'class');

// Forward all non-class props to the underlying Reka UI component
const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <!-- Selection indicator with right alignment and customizable styling -->
  <ComboboxItemIndicator
    data-slot="combobox-item-indicator"
    v-bind="forwarded"
    :class="cn('ml-auto', props.class)"
  >
    <slot />
  </ComboboxItemIndicator>
</template>
