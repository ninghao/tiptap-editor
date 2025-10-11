<script setup lang="ts">
import { Button } from '@/components/ui/button'
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Button Component</h2>
    <div class="flex flex-wrap gap-4">
      <Button>Default Button</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  </div>
</template>
