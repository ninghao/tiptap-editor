<script setup lang="ts">
import { Toggle } from '@/components/ui/toggle';
import { ref } from 'vue';

const isToggled = ref(false);
const isToggled2 = ref(true);
const isToggled3 = ref(false);
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Toggle Component</h2>

    <!-- Basic Toggle -->
    <div class="space-y-2">
      <h3 class="text-lg font-medium">Basic Toggle</h3>
      <div class="flex items-center gap-4">
        <Toggle v-model="isToggled">
          <span v-if="isToggled">On</span>
          <span v-else>Off</span>
        </Toggle>
        <span class="text-sm text-muted-foreground">
          State: {{ isToggled ? 'Pressed' : 'Unpressed' }}
        </span>
      </div>
    </div>

    <!-- Variants -->
    <div class="space-y-2">
      <h3 class="text-lg font-medium">Variants</h3>
      <div class="flex items-center gap-4">
        <Toggle v-model:pressed="isToggled2" variant="default"> Default </Toggle>
        <Toggle v-model:pressed="isToggled3" variant="outline"> Outline </Toggle>
      </div>
    </div>

    <!-- Sizes -->
    <div class="space-y-2">
      <h3 class="text-lg font-medium">Sizes</h3>
      <div class="flex items-center gap-4">
        <Toggle size="sm"> Small </Toggle>
        <Toggle size="default"> Default </Toggle>
        <Toggle size="lg"> Large </Toggle>
      </div>
    </div>

    <!-- With Icons -->
    <div class="space-y-2">
      <h3 class="text-lg font-medium">With Icons</h3>
      <div class="flex items-center gap-4">
        <Toggle>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </Toggle>
        <Toggle>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-5 5v-5zM4.5 19.5L9 15l4.5 4.5"
            />
          </svg>
        </Toggle>
        <Toggle>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </Toggle>
      </div>
    </div>

    <!-- Disabled State -->
    <div class="space-y-2">
      <h3 class="text-lg font-medium">Disabled State</h3>
      <div class="flex items-center gap-4">
        <Toggle disabled> Disabled </Toggle>
        <Toggle disabled :pressed="true"> Disabled (Pressed) </Toggle>
      </div>
    </div>
  </div>
</template>
