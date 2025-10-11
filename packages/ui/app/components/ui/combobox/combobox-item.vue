<!--
  Combobox Item Component
  
  Individual selectable option within the combobox dropdown. Each item
  represents a choice that users can select from the available options.
  
  Features:
  - Highlighted state styling on hover/focus
  - Disabled state support
  - Icon support with proper sizing
  - Keyboard navigation support
  - Customizable styling via class prop
  
  Usage:
  <ComboboxItem value="option1" disabled>
    <UserIcon class="mr-2" />
    Option 1
  </ComboboxItem>
-->
<script setup lang="ts">
import type { ComboboxItemEmits, ComboboxItemProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { ComboboxItem, useForwardPropsEmits } from 'reka-ui';
import { cn } from '@/lib/utils';

// Combine Reka UI item props with custom class prop
const props = defineProps<ComboboxItemProps & { class?: HTMLAttributes['class'] }>();
const emits = defineEmits<ComboboxItemEmits>();

// Separate class prop from other props for styling
const delegatedProps = reactiveOmit(props, 'class');

// Forward all non-class props and emits to the underlying Reka UI component
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <!-- Selectable item with comprehensive styling and state handling -->
  <ComboboxItem
    data-slot="combobox-item"
    v-bind="forwarded"
    :class="
      cn(
        'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground [&_svg:not([class*=\'text-\'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
        props.class,
      )
    "
  >
    <slot />
  </ComboboxItem>
</template>
