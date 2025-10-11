<script setup lang="ts">
import { ref } from 'vue';
import {
  TagsInput,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
} from '@/components/ui/tags-input';

// Basic tags input
const basicTags = ref(['Vue', 'React', 'Angular']);

// Tags with custom styling
const styledTags = ref(['TypeScript', 'JavaScript', 'Python']);

// Tags with validation (no duplicates)
const validatedTags = ref(['Frontend', 'Backend']);
const newTag = ref('');

const addValidatedTag = () => {
  if (newTag.value && !validatedTags.value.includes(newTag.value)) {
    validatedTags.value.push(newTag.value);
    newTag.value = '';
  }
};

// Tags with max limit
const limitedTags = ref(['Design', 'Development']);
const maxTags = 3;

const addLimitedTag = (tag: string) => {
  if (limitedTags.value.length < maxTags && !limitedTags.value.includes(tag)) {
    limitedTags.value.push(tag);
  }
};

// Tags with categories
const categoryTags = ref([
  { id: '1', text: 'UI/UX', category: 'design' },
  { id: '2', text: 'Frontend', category: 'development' },
  { id: '3', text: 'Backend', category: 'development' },
  { id: '4', text: 'Research', category: 'design' },
]);

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'design':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'development':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2">
      <h2 class="text-2xl font-semibold">Tags Input</h2>
      <p class="text-muted-foreground">
        A flexible tags input component for managing collections of tags.
      </p>
    </div>

    <!-- Basic Tags Input -->
    <div class="space-y-3">
      <h3 class="text-lg font-medium">Basic Tags Input</h3>
      <p class="text-sm text-muted-foreground">
        Simple tags input with default styling and functionality.
      </p>
      <TagsInput v-model="basicTags" class="w-full max-w-md">
        <TagsInputItem v-for="tag in basicTags" :key="tag" :value="tag">
          <TagsInputItemText />
          <TagsInputItemDelete />
        </TagsInputItem>
        <TagsInputInput placeholder="Add a tag..." />
      </TagsInput>
      <div class="text-xs text-muted-foreground">Current tags: {{ basicTags.join(', ') }}</div>
    </div>

    <!-- Styled Tags Input -->
    <div class="space-y-3">
      <h3 class="text-lg font-medium">Styled Tags Input</h3>
      <p class="text-sm text-muted-foreground">Tags input with custom styling and colors.</p>
      <TagsInput
        v-model="styledTags"
        class="w-full max-w-md border-2 border-dashed border-primary/20"
      >
        <TagsInputItem
          v-for="tag in styledTags"
          :key="tag"
          :value="tag"
          class="bg-primary/10 text-primary border-primary/20"
        >
          <TagsInputItemText class="text-primary font-medium" />
          <TagsInputItemDelete class="text-primary hover:bg-primary/20" />
        </TagsInputItem>
        <TagsInputInput
          placeholder="Add a technology..."
          class="text-primary placeholder:text-primary/60"
        />
      </TagsInput>
    </div>

    <!-- Tags with Validation -->
    <div class="space-y-3">
      <h3 class="text-lg font-medium">Tags with Validation</h3>
      <p class="text-sm text-muted-foreground">
        Prevents duplicate tags and shows validation feedback.
      </p>
      <div class="flex gap-2 w-full max-w-md">
        <input
          v-model="newTag"
          type="text"
          placeholder="Add a skill..."
          class="flex-1 px-3 py-2 border border-input rounded-md bg-background text-sm"
          @keydown.enter.prevent="addValidatedTag"
        />
        <button
          @click="addValidatedTag"
          class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
        >
          Add
        </button>
      </div>
      <TagsInput v-model="validatedTags" class="w-full max-w-md">
        <TagsInputItem v-for="tag in validatedTags" :key="tag" :value="tag">
          <TagsInputItemText />
          <TagsInputItemDelete />
        </TagsInputItem>
      </TagsInput>
      <div class="text-xs text-muted-foreground">{{ validatedTags.length }} skills added</div>
    </div>

    <!-- Tags with Limit -->
    <div class="space-y-3">
      <h3 class="text-lg font-medium">Tags with Limit</h3>
      <p class="text-sm text-muted-foreground">Maximum of {{ maxTags }} tags allowed.</p>
      <TagsInput v-model="limitedTags" class="w-full max-w-md">
        <TagsInputItem v-for="tag in limitedTags" :key="tag" :value="tag">
          <TagsInputItemText />
          <TagsInputItemDelete />
        </TagsInputItem>
        <TagsInputInput
          placeholder="Add a role..."
          @keydown.enter.prevent="
            addLimitedTag($event.target.value);
            $event.target.value = '';
          "
          :disabled="limitedTags.length >= maxTags"
        />
      </TagsInput>
      <div class="text-xs text-muted-foreground">
        {{ limitedTags.length }}/{{ maxTags }} tags used
      </div>
    </div>

    <!-- Tags with Categories -->
    <div class="space-y-3">
      <h3 class="text-lg font-medium">Tags with Categories</h3>
      <p class="text-sm text-muted-foreground">Tags with different categories and color coding.</p>
      <div class="w-full max-w-md space-y-2">
        <div v-for="tag in categoryTags" :key="tag.id" class="flex items-center gap-2">
          <span
            :class="[
              'px-2 py-1 rounded-full text-xs font-medium border',
              getCategoryColor(tag.category),
            ]"
          >
            {{ tag.text }}
          </span>
          <span class="text-xs text-muted-foreground capitalize">
            {{ tag.category }}
          </span>
        </div>
      </div>
    </div>

    <!-- Usage Examples -->
    <div class="space-y-3">
      <h3 class="text-lg font-medium">Usage Examples</h3>
      <div class="space-y-2 text-sm">
        <div class="p-3 bg-muted rounded-md">
          <code class="text-primary">// Basic usage</code>
          <pre class="mt-1 text-xs overflow-x-auto">
&lt;TagsInput v-model="tags"&gt;
  &lt;TagsInputItem v-for="tag in tags" :key="tag" :value="tag"&gt;
    &lt;TagsInputItemText /&gt;
    &lt;TagsInputItemDelete /&gt;
  &lt;/TagsInputItem&gt;
  &lt;TagsInputInput placeholder="Add a tag..." /&gt;
&lt;/TagsInput&gt;</pre
          >
        </div>
      </div>
    </div>
  </div>
</template>
