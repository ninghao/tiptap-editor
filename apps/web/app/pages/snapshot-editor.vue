<template>
  <div class="grid grid-cols-3 gap-4 items-start">
    <div class="col-span-2 space-y-4">
      <div class="flex items-center gap-2">
        <Button @click="save">Save</Button>
      </div>

      <EditorContent :editor="editor" class="prose max-w-none h-full" />
    </div>

    <div class="space-y-3 rounded border p-3 sticky top-4">
      <h3 class="text-lg font-semibold">版本列表</h3>
      <div v-if="versions.length" class="space-y-2">
        <div
          v-for="version in versions"
          :key="version.version"
          class="flex items-center justify-between rounded border px-3 py-2"
        >
          <div>
            <div class="font-medium">
              {{ version.name || `版本 ${version.version}` }}
            </div>
            <div class="text-xs text-gray-500">版本号：{{ version.version }}</div>
          </div>
          <div class="text-sm text-gray-500">
            {{ formatDate(version.date) }}
          </div>
        </div>
      </div>
      <p v-else class="text-sm text-gray-500">暂无版本</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3'; // Tiptap Vue 3 编辑器核心
import StarterKit from '@tiptap/starter-kit'; // Tiptap 基础功能包（包含段落、标题、列表等）
import Collaboration from '@tiptap/extension-collaboration'; // Tiptap 协作扩展
import * as Y from 'yjs'; // Yjs CRDT 库，用于实现协作编辑
import TiptapCollabProvider from '@tiptap-pro/provider';
import { BroadcastChannelProvider } from '~/lib/broadcast-channel-provider';
import Snapshot from '@tiptap-pro/extension-snapshot';
import type { SnapshotVersion, SnapshotStorage } from '@tiptap-pro/extension-snapshot';

const doc = new Y.Doc();

const config = useRuntimeConfig();

const provider = new TiptapCollabProvider({
  name: 'snapshot-demo', // Unique document identifier for syncing. This is your document name.
  appId: config.public.tiptap?.documentServerId, // Your Cloud Dashboard AppID or `baseURL` for on-premises
  token: config.public.tiptap?.documentAppJwt, // Your JWT token
  document: doc,
});
// const provider = new BroadcastChannelProvider({
//   name: 'snapshot-demo',
//   document: doc,
// });

const versions = ref<SnapshotVersion[]>([]);

const editor = useEditor({
  // 编辑器扩展配置
  extensions: [
    StarterKit.configure({
      undoRedo: false,
    }),

    Collaboration.configure({
      document: doc, // 绑定到我们创建的 Y.Doc 实例
    }),

    Snapshot.configure({
      provider,
      onUpdate: (payload) => {
        versions.value = payload.versions;
      },
    }),
  ],

  // 编辑器属性配置
  editorProps: {
    attributes: {
      class:
        'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
    },
  },
  onCreate: ({ editor }) => {
    const snapshotStorage = editor.storage as unknown as { snapshot?: SnapshotStorage };
    versions.value = snapshotStorage.snapshot?.versions ?? [];
  },
});

const save = () => {
  editor.value?.commands.saveVersion(new Date().toISOString());
};

const formatDate = (timestamp?: number) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString();
};
</script>
