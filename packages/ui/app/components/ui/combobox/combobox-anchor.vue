<!--
  Combobox Anchor Component
  
  Provides positioning context for the combobox dropdown. This component
  defines where the dropdown content should be positioned relative to
  the trigger element.
  
  Features:
  - Default width of 200px (customizable via class prop)
  - Positioning anchor for dropdown content
  - Customizable styling via class prop
  
  Usage:
  <ComboboxAnchor class="w-64">
    <ComboboxTrigger>Select option...</ComboboxTrigger>
  </ComboboxAnchor>
-->
<script setup lang="ts">
import type { ComboboxAnchorProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { ComboboxAnchor, useForwardProps } from 'reka-ui';
import { cn } from '@/lib/utils';

// Combine Reka UI anchor props with custom class prop
const props = defineProps<ComboboxAnchorProps & { class?: HTMLAttributes['class'] }>();

// Separate class prop from other props for styling
const delegatedProps = reactiveOmit(props, 'class');

// Forward all non-class props to the underlying Reka UI component
const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <!-- Positioning anchor with default width and customizable styling -->
  <ComboboxAnchor
    data-slot="combobox-anchor"
    v-bind="forwarded"
    :class="cn('w-[200px]', props.class)"
  >
    <slot />
  </ComboboxAnchor>
</template>
