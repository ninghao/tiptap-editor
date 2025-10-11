<script setup lang="ts">
import type { ComboboxViewportProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { ComboboxViewport, useForwardProps } from 'reka-ui';
import { cn } from '@/lib/utils';

// Combine Reka UI viewport props with custom class prop
const props = defineProps<ComboboxViewportProps & { class?: HTMLAttributes['class'] }>();

// Separate class prop from other props for styling
const delegatedProps = reactiveOmit(props, 'class');

// Forward all non-class props to the underlying Reka UI component
const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <!-- Scrollable viewport with height constraints and smooth scrolling -->
  <ComboboxViewport
    data-slot="combobox-viewport"
    v-bind="forwarded"
    :class="cn('max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto', props.class)"
  >
    <slot />
  </ComboboxViewport>
</template>
