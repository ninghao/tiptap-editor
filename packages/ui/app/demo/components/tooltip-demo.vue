<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Tooltip Component</h2>

    <TooltipProvider>
      <div class="flex flex-wrap gap-4">
        <!-- Basic Tooltip -->
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="outline">Hover me</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>This is a basic tooltip</p>
          </TooltipContent>
        </Tooltip>

        <!-- Tooltip with different side -->
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="outline">Top tooltip</Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>This tooltip appears on top</p>
          </TooltipContent>
        </Tooltip>

        <!-- Tooltip with different side -->
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="outline">Right tooltip</Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>This tooltip appears on the right</p>
          </TooltipContent>
        </Tooltip>

        <!-- Tooltip with different side -->
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="outline">Left tooltip</Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>This tooltip appears on the left</p>
          </TooltipContent>
        </Tooltip>

        <!-- Tooltip with longer content -->
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="secondary">Long content</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              This is a longer tooltip content that demonstrates how the tooltip handles multiple
              lines of text and wraps appropriately.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  </div>
</template>
