<template>
  <div class="container mx-auto max-w-6xl p-4">
    <!-- 简化的说明 -->
    <div class="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <div
              class="w-3 h-3 rounded-full"
              :class="
                connectionStatus === 'connected'
                  ? 'bg-green-500'
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              "
            ></div>
            <span class="text-sm font-semibold">{{ connectionStatusText }}</span>
          </div>
          <div class="text-sm">
            <span class="text-gray-600">当前版本：</span>
            <span class="font-semibold text-blue-600">{{ currentVersion }}</span>
          </div>
          <div class="text-sm">
            <span class="text-gray-600">最新版本：</span>
            <span class="font-semibold text-blue-600">{{ latestVersion }}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            @click="createVersion"
            :disabled="!editor || connectionStatus !== 'connected'"
            class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            创建版本
          </button>
          <button
            @click="toggleVersioning"
            :disabled="!editor || connectionStatus !== 'connected'"
            class="px-3 py-1 text-sm rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
            :class="
              versioningEnabled
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-500 text-white hover:bg-gray-600'
            "
          >
            {{ versioningEnabled ? '自动版本化：开' : '自动版本化：关' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑器区域 -->
    <div class="flex gap-4 min-h-[600px]">
      <!-- 编辑器 -->
      <div class="flex-1 border rounded-lg">
        <EditorContent :editor="editor" class="prose max-w-none p-4" />
      </div>

      <!-- 版本历史 -->
      <div class="w-80 border rounded-lg flex flex-col">
        <div class="p-3 border-b">
          <h3 class="text-sm font-semibold">版本历史</h3>
        </div>
        <div class="flex-1 overflow-auto p-3">
          <div v-if="versions.length === 0" class="text-center text-gray-500 py-8 text-sm">
            暂无版本记录
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="version in versions"
              :key="version.id"
              class="border rounded p-3 text-sm"
              :class="version.id === currentVersion ? 'bg-blue-50 border-blue-300' : 'bg-white'"
            >
              <div class="flex items-center gap-2 mb-2">
                <span class="font-semibold">版本 {{ version.id }}</span>
                <span
                  v-if="version.id === currentVersion"
                  class="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded"
                >
                  当前
                </span>
              </div>
              <p v-if="version.name" class="text-gray-700 mb-1">{{ version.name }}</p>
              <p class="text-xs text-gray-500 mb-2">{{ formatDate(version.createdAt) }}</p>
              <div class="flex gap-2">
                <button
                  @click="revertToVersion(version.id)"
                  :disabled="version.id === currentVersion"
                  class="flex-1 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  恢复
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建版本对话框 -->
    <div
      v-if="showVersionDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showVersionDialog = false"
    >
      <div class="bg-white rounded-lg p-6 w-96">
        <h3 class="text-lg font-semibold mb-4">创建新版本</h3>
        <input
          v-model="versionName"
          type="text"
          placeholder="版本标题（可选）"
          class="w-full px-3 py-2 border rounded-md mb-4"
          @keyup.enter="confirmCreateVersion"
        />
        <div class="flex gap-2 justify-end">
          <button
            @click="showVersionDialog = false"
            class="px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200"
          >
            取消
          </button>
          <button
            @click="confirmCreateVersion"
            class="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { onBeforeUnmount, onMounted, ref, computed, nextTick, watch } from 'vue';
import Collaboration from '@tiptap/extension-collaboration';
import * as Y from 'yjs';
import { TiptapCollabProvider } from '@tiptap-pro/provider';
import { Snapshot } from '@tiptap-pro/extension-snapshot';

interface Version {
  id: number;
  name?: string;
  createdAt: Date | string;
}

const config = useRuntimeConfig();
const doc = new Y.Doc();
let provider: TiptapCollabProvider | null = null;

const connectionStatus = ref<'disconnected' | 'connecting' | 'connected'>('disconnected');
const currentVersion = ref(0);
const latestVersion = ref(0);
const versioningEnabled = ref(false);
const versions = ref<Version[]>([]);
const showVersionDialog = ref(false);
const versionName = ref('');

const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected':
      return '已连接';
    case 'connecting':
      return '连接中...';
    case 'disconnected':
      return '未连接';
    default:
      return '未知';
  }
});

// 从 storage 更新版本信息
const updateVersionInfo = () => {
  if (!editor.value) return;
  const storage = (editor.value.storage as any)?.snapshot;
  if (storage) {
    currentVersion.value = storage.currentVersion || 0;
    latestVersion.value = storage.latestVersion || 0;
    versioningEnabled.value = storage.versioningEnabled || false;
    versions.value = (storage.versions || []).map((v: any) => ({
      id: v.id,
      name: v.name,
      createdAt: v.createdAt,
    }));
  }
};

// 定期更新版本信息
let versionUpdateInterval: any = null;

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const createVersion = () => {
  showVersionDialog.value = true;
  versionName.value = '';
};

const confirmCreateVersion = () => {
  if (!editor.value || !provider) return;

  const name = versionName.value.trim() || undefined;

  // 尝试使用命令
  const result = editor.value.commands.saveVersion(name);
  if (result === false) {
    // 使用 stateless 消息
    provider.sendStateless(
      JSON.stringify({
        action: 'version.create',
        name: name,
      }),
    );
  }

  showVersionDialog.value = false;
  versionName.value = '';
};

const toggleVersioning = () => {
  editor.value?.commands.toggleVersioning();
};

const revertToVersion = (versionId: number) => {
  if (!editor.value) return;
  editor.value.commands.revertToVersion(versionId, `恢复到版本 ${versionId}`);
};

// 编辑器初始化
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      undoRedo: false,
    }),
    Collaboration.configure({
      document: doc,
    }),
    Snapshot.configure({
      provider: null as any,
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px]',
    },
  },
});

onMounted(async () => {
  if (process.client && typeof window !== 'undefined') {
    await nextTick();

    if (!editor.value) return;

    const appId = config.public.tiptap?.documentServerId;
    const token = config.public.tiptap?.documentAppJwt;
    const documentName = 'snapshot-demo';

    if (!appId) {
      connectionStatus.value = 'disconnected';
      return;
    }

    connectionStatus.value = 'connecting';

    try {
      provider = new TiptapCollabProvider({
        name: documentName,
        appId: appId,
        token: token,
        document: doc,

        onSynced() {
          connectionStatus.value = 'connected';

          nextTick(() => {
            if (!editor.value || !provider) return;

            // 更新 Snapshot 扩展的 provider
            const snapshotExt = editor.value.extensionManager.extensions.find(
              (ext: any) => ext.name === 'snapshot',
            );
            if (snapshotExt && snapshotExt.options) {
              snapshotExt.options.provider = provider;
            }

            // 设置初始内容
            const configMap = doc.getMap('config');
            if (!configMap.get('initialContentLoaded')) {
              configMap.set('initialContentLoaded', true);
              const content = editor.value.getJSON();
              const isEmpty =
                content.type === 'doc' && (!content.content || content.content.length === 0);
              if (isEmpty) {
                editor.value.commands.setContent(`
                  <h1>版本历史编辑器</h1>
                  <p>编辑内容，然后点击"创建版本"来保存快照。</p>
                `);
              }
            }

            // 开始定期更新版本信息
            updateVersionInfo();
            versionUpdateInterval = setInterval(updateVersionInfo, 1000);
          });
        },

        onStatus(event: any) {
          if (event.status === 'connected') {
            connectionStatus.value = 'connected';
          } else if (event.status === 'connecting') {
            connectionStatus.value = 'connecting';
          } else {
            connectionStatus.value = 'disconnected';
          }
        },
      });

      // 监听版本创建事件
      provider.on('stateless', (data: any) => {
        try {
          const payload = JSON.parse(data.payload);
          if (payload.action === 'version.created') {
            setTimeout(updateVersionInfo, 500);
          } else if (payload.action === 'document.reverted') {
            setTimeout(updateVersionInfo, 500);
          }
        } catch (error) {
          // 忽略错误
        }
      });
    } catch (error) {
      console.error('创建 Provider 失败:', error);
      connectionStatus.value = 'disconnected';
    }
  }
});

onBeforeUnmount(() => {
  if (versionUpdateInterval) {
    clearInterval(versionUpdateInterval);
  }
  if (provider) {
    provider.destroy();
    provider = null;
  }
  editor.value?.destroy();
});
</script>

<style>
.ProseMirror {
  outline: none;
}
</style>
