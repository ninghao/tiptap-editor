<template>
  <div class="grid grid-cols-3 gap-4 items-start">
    <div class="col-span-2">
      <EditorContent :editor="editor" class="prose max-w-none h-full" />
    </div>

    <div class="space-y-3 rounded border p-3 sticky top-4">
      <div class="flex items-center justify-between gap-2">
        <div>
          <h3 class="text-lg font-semibold leading-none">版本列表</h3>
          <span class="text-xs text-gray-500">当前版本：{{ currentVersion ?? '—' }}</span>
        </div>
        <Button size="sm" @click="save">Save</Button>
      </div>
      <div v-if="versions.length" class="space-y-2">
        <div
          v-for="version in versions"
          :key="version.version"
          class="flex items-center justify-between gap-3 rounded border px-3 py-2"
          :class="{
            'border-blue-500 bg-blue-50': currentVersion === version.version,
          }"
        >
          <div>
            <div class="font-medium">
              {{ version.name || `版本 ${version.version}` }}
            </div>
            <div class="text-xs text-gray-500">版本号：{{ version.version }}</div>
          </div>
          <div class="flex items-center gap-3">
            <span
              v-if="currentVersion === version.version"
              class="rounded-full bg-blue-100 text-blue-700 text-xs px-2 py-0.5"
            >
              当前
            </span>
            <div class="text-sm text-gray-500">
              {{ formatDate(version.date) }}
            </div>
            <Button
              size="sm"
              variant="outline"
              :disabled="currentVersion === version.version"
              @click="revert(version.version)"
            >
              恢复
            </Button>
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
const currentVersion = ref<number | null>(null);

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
        currentVersion.value = payload.currentVersion ?? null;
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
    currentVersion.value = snapshotStorage.snapshot?.currentVersion ?? null;
  },
});

const save = () => {
  editor.value?.commands.saveVersion(new Date().toISOString());
};

const revert = (versionNumber: number) => {
  editor.value?.commands.revertToVersion(versionNumber, `回滚到版本 ${versionNumber}`);
};

const formatDate = (timestamp?: number) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString();
};
</script>
