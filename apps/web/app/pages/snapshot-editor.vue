<template>
  <div>
    <EditorContent :editor="editor" class="prose max-w-none h-full" />
  </div>
</template>
<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'; // Tiptap Vue 3 编辑器核心
import StarterKit from '@tiptap/starter-kit'; // Tiptap 基础功能包（包含段落、标题、列表等）
import Collaboration from '@tiptap/extension-collaboration'; // Tiptap 协作扩展
import * as Y from 'yjs'; // Yjs CRDT 库，用于实现协作编辑

const doc = new Y.Doc();

const editor = useEditor({
  // 编辑器扩展配置
  extensions: [
    // StarterKit 提供基础编辑功能
    // 包含：段落、标题、列表、粗体、斜体、代码块、引用等
    StarterKit.configure({
      // 注意：Collaboration 扩展会处理历史记录管理
      // 所以不需要 StarterKit 中的 History 扩展
      undoRedo: false,
      // 这里不配置任何选项，使用默认配置即可
    }),

    // Collaboration 扩展：实现协作编辑功能
    // 将编辑器与 Yjs 文档绑定，实现多用户实时协作
    Collaboration.configure({
      document: doc, // 绑定到我们创建的 Y.Doc 实例
    }),
  ],

  // 编辑器属性配置
  editorProps: {
    attributes: {
      // 应用 Tailwind CSS 类名
      // prose: 使用 Tailwind Typography 插件样式
      // focus:outline-none: 聚焦时移除默认轮廓
      // min-h-[300px]: 最小高度 300px
      // p-4: 内边距
      class:
        'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
    },
  },
});
</script>
