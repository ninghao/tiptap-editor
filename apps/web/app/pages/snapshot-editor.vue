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
import TiptapCollabProvider from '@tiptap-pro/provider';
import { BroadcastChannelProvider } from '~/lib/broadcast-channel-provider';

const doc = new Y.Doc();

const config = useRuntimeConfig();

const editor = useEditor({
  // 编辑器扩展配置
  extensions: [
    StarterKit.configure({
      undoRedo: false,
    }),

    Collaboration.configure({
      document: doc, // 绑定到我们创建的 Y.Doc 实例
    }),
  ],

  // 编辑器属性配置
  editorProps: {
    attributes: {
      class:
        'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
    },
  },
});

// const provider = new TiptapCollabProvider({
//   name: 'snapshot-demo', // Unique document identifier for syncing. This is your document name.
//   appId: config.public.tiptap?.documentServerId, // Your Cloud Dashboard AppID or `baseURL` for on-premises
//   token: config.public.tiptap?.documentAppJwt, // Your JWT token
//   document: doc,
// });
const provider = new BroadcastChannelProvider({
  name: 'snapshot-demo',
  document: doc,
});
</script>
