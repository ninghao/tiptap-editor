<script setup lang="ts">
import ButtonDemo from './components/button-demo.vue';
import TagsInputDemo from './components/tags-input-demo.vue';
import TabsDemo from './components/tabs-demo.vue';
import ToggleDemo from './components/toggle-demo.vue';
import TooltipDemo from './components/tooltip-demo.vue';
</script>

<template>
  <div class="p-8 space-y-8">
    <div class="space-y-2">
      <h1 class="text-3xl font-bold">@iniso/ui</h1>
      <p class="text-muted-foreground">Component Library Demo</p>
    </div>

    <!-- Button Demo -->
    <ButtonDemo />

    <!-- Tags Input Demo -->
    <TagsInputDemo />

    <!-- Tabs Demo -->
    <TabsDemo />

    <!-- Toggle Demo -->
    <ToggleDemo />

    <!-- Tooltip Demo -->
    <TooltipDemo />
  </div>
</template>
