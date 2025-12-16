<template>
  <div class="container mx-auto p-8 max-w-4xl">
    <h1 class="text-3xl font-bold mb-6">Tiptap Editor 演示</h1>

    <div class="border rounded-lg shadow-sm">
      <EditorContent :editor="editor" class="prose max-w-none" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { onBeforeUnmount } from 'vue';

const editor = useEditor({
  extensions: [StarterKit],
  content: `
    <h1>欢迎使用 Tiptap Editor</h1>
    <p>这是一个功能强大的富文本编辑器演示。</p>
    <p>你可以在这里输入和编辑内容，支持以下功能：</p>
    <ul>
      <li><strong>粗体文本</strong></li>
      <li><em>斜体文本</em></li>
      <li><code>代码块</code></li>
      <li>有序列表和无序列表</li>
      <li>标题（H1-H6）</li>
      <li>引用块</li>
    </ul>
    <p>试试看吧！</p>
  `,
  editorProps: {
    attributes: {
      class:
        'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
    },
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
