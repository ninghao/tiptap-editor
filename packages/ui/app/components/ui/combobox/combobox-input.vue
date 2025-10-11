<!--
  Combobox Input Component
  
  A search input field with an integrated search icon. This component provides
  the filtering functionality for the combobox, allowing users to type and
  narrow down the available options.
  
  Features:
  - Built-in search icon from Lucide
  - Customizable styling via class prop
  - Proper accessibility attributes
  - Disabled state handling
  - Placeholder text styling
  
  Usage:
  <ComboboxInput 
    placeholder="Search options..." 
    class="custom-input-styles"
  />
-->
<script setup lang="ts">
import type { ComboboxInputEmits, ComboboxInputProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { SearchIcon } from 'lucide-vue-next';
import { ComboboxInput, useForwardPropsEmits } from 'reka-ui';
import { cn } from '@/lib/utils';

// Disable automatic attribute inheritance to have full control
defineOptions({
  inheritAttrs: false,
});

// Combine Reka UI input props with custom class prop
const props = defineProps<
  ComboboxInputProps & {
    class?: HTMLAttributes['class'];
  }
>();

const emits = defineEmits<ComboboxInputEmits>();

// Separate class prop from other props for styling
const delegatedProps = reactiveOmit(props, 'class');

// Forward all non-class props and emits to the underlying Reka UI component
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <!-- Input wrapper with search icon and styling -->
  <div data-slot="command-input-wrapper" class="flex h-9 items-center gap-2 border-b px-3">
    <!-- Search icon with consistent sizing and opacity -->
    <SearchIcon class="size-4 shrink-0 opacity-50" />

    <!-- Input field with comprehensive styling and accessibility -->
    <ComboboxInput
      data-slot="command-input"
      :class="
        cn(
          'placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
          props.class,
        )
      "
      v-bind="{ ...forwarded, ...$attrs }"
    >
      <slot />
    </ComboboxInput>
  </div>
</template>
