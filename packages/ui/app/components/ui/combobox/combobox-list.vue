<!--
  Combobox List Component
  
  The dropdown container that holds all combobox items. This component
  provides the popover-style dropdown with animations, positioning,
  and proper z-index layering.
  
  Features:
  - Portal rendering for proper layering
  - Smooth open/close animations
  - Responsive positioning (popper by default)
  - Shadow and border styling
  - Customizable width and styling
  
  Usage:
  <ComboboxList class="w-64">
    <ComboboxItem value="option1">Option 1</ComboboxItem>
    <ComboboxItem value="option2">Option 2</ComboboxItem>
  </ComboboxList>
-->
<script setup lang="ts">
import type { ComboboxContentEmits, ComboboxContentProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { ComboboxContent, ComboboxPortal, useForwardPropsEmits } from 'reka-ui';
import { cn } from '@/lib/utils';

// Set default positioning and alignment props
const props = withDefaults(
  defineProps<ComboboxContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    position: 'popper',
    align: 'center',
    sideOffset: 4,
  },
);
const emits = defineEmits<ComboboxContentEmits>();

// Separate class prop from other props for styling
const delegatedProps = reactiveOmit(props, 'class');
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <!-- Portal for proper layering and positioning -->
  <ComboboxPortal>
    <!-- Dropdown content with animations and styling -->
    <ComboboxContent
      data-slot="combobox-list"
      v-bind="forwarded"
      :class="
        cn(
          'z-50 w-[200px] rounded-md border bg-popover text-popover-foreground origin-(--reka-combobox-content-transform-origin) overflow-hidden shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          props.class,
        )
      "
    >
      <slot />
    </ComboboxContent>
  </ComboboxPortal>
</template>
