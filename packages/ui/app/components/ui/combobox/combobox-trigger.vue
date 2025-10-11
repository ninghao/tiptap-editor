<!--
  Combobox Trigger Component
  
  The clickable element that opens the combobox dropdown. This component
  typically displays the currently selected value or placeholder text.
  
  Features:
  - Keyboard accessible (tabindex="0")
  - Customizable styling via class prop
  - Forwards all Reka UI trigger props
  
  Usage:
  <ComboboxTrigger class="flex items-center justify-between">
    {{ selectedValue || "Select an option..." }}
    <ChevronDownIcon class="h-4 w-4" />
  </ComboboxTrigger>
-->
<script setup lang="ts">
import type { ComboboxTriggerProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { ComboboxTrigger, useForwardProps } from 'reka-ui';
import { cn } from '@/lib/utils';

// Combine Reka UI props with custom class prop for styling
const props = defineProps<ComboboxTriggerProps & { class?: HTMLAttributes['class'] }>();

// Separate class prop from other props to handle styling separately
const delegatedProps = reactiveOmit(props, 'class');

// Forward all non-class props to the underlying Reka UI component
const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <!-- Trigger element with accessibility and styling -->
  <ComboboxTrigger
    data-slot="combobox-trigger"
    v-bind="forwarded"
    :class="cn('', props.class)"
    tabindex="0"
  >
    <slot />
  </ComboboxTrigger>
</template>
