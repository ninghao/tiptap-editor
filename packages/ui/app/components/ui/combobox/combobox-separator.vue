<script setup lang="ts">
import type { ComboboxSeparatorProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { ComboboxSeparator } from 'reka-ui';
import { cn } from '@/lib/utils';

// Combine Reka UI separator props with custom class prop
const props = defineProps<ComboboxSeparatorProps & { class?: HTMLAttributes['class'] }>();

// Separate class prop from other props for styling
const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
  <!-- Visual separator with border styling and customizable appearance -->
  <ComboboxSeparator
    data-slot="combobox-separator"
    v-bind="delegatedProps"
    :class="cn('bg-border -mx-1 h-px', props.class)"
  >
    <slot />
  </ComboboxSeparator>
</template>
