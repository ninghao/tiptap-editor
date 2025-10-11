<!--
  Empty State Root Component
  
  The main container for empty state displays. Provides a centered layout with
  dashed border styling and responsive padding. Use this as the root component
  when displaying empty states in your application.
  
  Example usage:
  <Empty>
    <EmptyMedia variant="icon">
      <Icon name="inbox" />
    </EmptyMedia>
    <EmptyHeader>
      <EmptyTitle>No items found</EmptyTitle>
      <EmptyDescription>Try adjusting your search or filters.</EmptyDescription>
    </EmptyHeader>
  </Empty>
-->
<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    data-slot="empty"
    :class="
      cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center gap-6 text-balance rounded-lg border-dashed p-6 text-center md:p-12',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
