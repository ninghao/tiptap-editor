<!--
  Combobox Empty Component
  
  Displays when no options match the current search filter or when
  the combobox has no available options. Provides a user-friendly
  empty state with customizable content.
  
  Features:
  - Centered text layout with padding
  - Customizable styling via class prop
  - Slot for custom empty state content
  
  Usage:
  <ComboboxEmpty>
    No options found. Try a different search term.
  </ComboboxEmpty>
-->
<script setup lang="ts">
import type { ComboboxEmptyProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { ComboboxEmpty } from 'reka-ui';
import { cn } from '@/lib/utils';

// Combine Reka UI empty props with custom class prop
const props = defineProps<ComboboxEmptyProps & { class?: HTMLAttributes['class'] }>();

// Separate class prop from other props for styling
const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
  <!-- Empty state with centered layout and customizable styling -->
  <ComboboxEmpty
    data-slot="combobox-empty"
    v-bind="delegatedProps"
    :class="cn('py-6 text-center text-sm', props.class)"
  >
    <slot />
  </ComboboxEmpty>
</template>
