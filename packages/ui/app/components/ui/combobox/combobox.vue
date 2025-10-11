<!--
  Combobox Root Component
  
  The main container component for the combobox interface. This component
  wraps all other combobox components and provides the core functionality
  for selection, filtering, and keyboard navigation.
  
  Built on top of Reka UI's ComboboxRoot primitive with custom styling.
  
  Usage:
  <Combobox v-model="selectedValue">
    <ComboboxTrigger>Select option...</ComboboxTrigger>
    <ComboboxList>
      <ComboboxItem value="option1">Option 1</ComboboxItem>
    </ComboboxList>
  </Combobox>
-->
<script setup lang="ts">
import type { ComboboxRootEmits, ComboboxRootProps } from 'reka-ui';
import { ComboboxRoot, useForwardPropsEmits } from 'reka-ui';

// Define props and emits using Reka UI types for full compatibility
const props = defineProps<ComboboxRootProps>();
const emits = defineEmits<ComboboxRootEmits>();

// Forward all props and emits to the underlying Reka UI component
const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <!-- Root container with data attribute for styling hooks -->
  <ComboboxRoot data-slot="combobox" v-bind="forwarded">
    <slot />
  </ComboboxRoot>
</template>
