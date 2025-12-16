<template>
  <div class="container mx-auto max-w-6xl flex">
    <div class="flex gap-4 h-full flex-1 min-h-screen">
      <!-- 编辑器区域 -->
      <div class="min-w-md flex-1">
        <EditorContent :editor="editor" class="prose max-w-none h-full" />
      </div>
      <!-- JSON 显示区域 -->
      <div class="mb-6 my-4 max-h-screen overflow-scroll">
        <pre class="font-mono text-xs">{{ editorJson }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { onBeforeUnmount, ref } from 'vue';
import Collaboration from '@tiptap/extension-collaboration';
import * as Y from 'yjs';
const doc = new Y.Doc(); // Initialize Y.Doc for shared editing

const editorJson = ref('{}');

const updateJson = () => {
  if (editor.value) {
    try {
      editorJson.value = JSON.stringify(editor.value.getJSON(), null, 2);
    } catch (error) {
      editorJson.value = '{}';
    }
  }
};

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      undoRedo: false, // Disables default Undo/Redo extension to use Collaboration's history management
    }),
    Collaboration.configure({
      document: doc, // Configure Y.Doc for collaboration
    }),
  ],
  content: `
    <h1>欢迎使用 Tiptap Editor</h1>
  `,
  editorProps: {
    attributes: {
      class:
        'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
    },
  },
  onUpdate: () => {
    updateJson();
  },
  onCreate: () => {
    updateJson();
  },
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<style>
.ProseMirror {
  outline: none;
}

.ProseMirror p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
