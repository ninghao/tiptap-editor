<template>
  <div class="container mx-auto max-w-6xl p-4">
    <!-- 说明文档区域 -->
    <div class="mb-6 bg-indigo-50 border border-indigo-200 rounded-lg p-6">
      <h2 class="text-2xl font-bold mb-4 text-indigo-900">修改追踪编辑器演示</h2>
      <div class="space-y-3 text-gray-700">
        <div>
          <h3 class="font-semibold mb-2 text-indigo-800">✨ 主要功能</h3>
          <ul class="list-disc list-inside space-y-1 ml-4">
            <li><strong>增量更新追踪</strong>：Yjs 使用 CRDT 增量更新机制，每个修改都是增量存储</li>
            <li><strong>用户操作追踪</strong>：追踪每一处修改是由哪个用户操作的</li>
            <li><strong>修改历史记录</strong>：实时显示文档的所有修改历史，包括用户、时间、内容</li>
            <li><strong>实时更新监控</strong>：监控 Yjs 文档的每次更新事件</li>
          </ul>
        </div>
        <div>
          <h3 class="font-semibold mb-2 text-indigo-800">📝 使用方法</h3>
          <ol class="list-decimal list-inside space-y-1 ml-4">
            <li>配置 Tiptap Cloud 的 AppID 和 JWT Token</li>
            <li>在编辑器中输入或修改内容</li>
            <li>观察右侧的修改历史，查看每次修改的详细信息</li>
            <li>在不同浏览器中打开，可以看到不同用户的修改记录</li>
          </ol>
        </div>
        <div class="pt-2 border-t border-indigo-200">
          <div class="flex items-center gap-2 mb-2">
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
            <span class="text-sm font-semibold">
              连接状态：
              <span
                :class="
                  connectionStatus === 'connected'
                    ? 'text-green-600'
                    : connectionStatus === 'connecting'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                "
              >
                {{ connectionStatusText }}
              </span>
            </span>
          </div>
          <div class="text-sm text-gray-600">
            <p class="mb-1">
              <strong>当前用户：</strong>
              <span class="font-mono">{{ currentUserId }}</span>
            </p>
            <p><strong>总修改数：</strong>{{ changeHistory.length }} 次修改</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑器区域 -->
    <div class="flex gap-4 h-full flex-1 min-h-[600px]">
      <!-- 编辑器区域 -->
      <div class="min-w-md flex-1 border rounded-lg flex flex-col">
        <div class="p-2 border-b flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">编辑器</h3>
          <div class="flex items-center gap-2 text-xs">
            <span
              class="px-2 py-1 rounded"
              :class="
                connectionStatus === 'connected'
                  ? 'bg-green-100 text-green-700'
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              "
            >
              {{ connectionStatusText }}
            </span>
            <button
              @click="clearHistory"
              class="px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs"
            >
              清空历史
            </button>
          </div>
        </div>
        <div class="flex-1 overflow-auto">
          <EditorContent :editor="editor" class="prose max-w-none h-full" />
        </div>
      </div>

      <!-- 修改历史区域 -->
      <div class="w-96 border rounded-lg flex flex-col">
        <div class="p-2 border-b flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">修改历史</h3>
          <div class="text-xs text-gray-500">{{ changeHistory.length }} 条记录</div>
        </div>
        <div class="flex-1 overflow-auto p-4 space-y-2">
          <div v-if="changeHistory.length === 0" class="text-sm text-gray-500 text-center py-4">
            暂无修改记录
          </div>
          <div
            v-for="(change, index) in reversedHistory"
            :key="index"
            class="border rounded-lg p-3 bg-gray-50 text-xs"
          >
            <div class="flex items-center gap-2 mb-2">
              <div
                class="w-4 h-4 rounded-full border border-white shadow-sm"
                :style="{ backgroundColor: change.userColor || '#999' }"
              ></div>
              <div class="flex-1">
                <div class="font-medium">{{ change.userName || '未知用户' }}</div>
                <div class="text-gray-500 text-xs">
                  {{ formatTime(change.timestamp) }}
                </div>
              </div>
            </div>
            <div class="mt-2 space-y-1">
              <div class="text-gray-600"><strong>操作类型：</strong>{{ change.type }}</div>
              <div v-if="change.content" class="text-gray-600">
                <strong>内容：</strong>
                <span class="font-mono bg-white px-1 rounded">{{ change.content }}</span>
              </div>
              <div class="text-gray-500">
                <strong>用户 ID：</strong>
                <span class="font-mono">{{ change.userId }}</span>
              </div>
              <div v-if="change.updateSize" class="text-gray-500">
                <strong>更新大小：</strong>{{ change.updateSize }} bytes
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 技术信息区域 -->
    <div class="mt-4 bg-gray-50 border rounded-lg p-4">
      <h3 class="text-sm font-semibold mb-2">技术说明</h3>
      <div class="text-xs text-gray-600 space-y-1">
        <p>
          <strong>Yjs 增量更新：</strong>Yjs 使用
          CRDT（无冲突复制数据类型）技术，所有修改都以增量形式存储和同步。
          每个更新都包含操作类型、位置信息和内容数据。
        </p>
        <p>
          <strong>用户追踪：</strong>通过监听 Y.Doc 的 update 事件，我们可以获取每次更新的详细信息。
          虽然 Yjs 本身不直接存储用户信息，但我们可以通过 Awareness API 或自定义元数据来关联用户。
        </p>
        <p>
          <strong>修改历史：</strong>本演示通过监听编辑器的 onUpdate 事件和 Y.Doc 的 update
          事件来追踪修改。 在实际应用中，您可能需要结合服务器端的日志来获得更完整的修改历史。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 修改追踪编辑器页面
 *
 * 功能说明：
 * 1. 使用 Yjs 的增量更新机制追踪文档修改
 * 2. 通过监听 Y.Doc 的 update 事件获取每次修改的详细信息
 * 3. 结合 Awareness API 关联用户信息
 * 4. 显示完整的修改历史记录
 */

// ==================== 导入依赖 ====================
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { onBeforeUnmount, onMounted, ref, computed, nextTick } from 'vue';
import Collaboration from '@tiptap/extension-collaboration';
import * as Y from 'yjs';
import { TiptapCollabProvider } from '~/lib/tiptap-collab-provider';

// ==================== Nuxt 配置 ====================
const config = useRuntimeConfig();

// ==================== 响应式状态 ====================
const doc = new Y.Doc();
let provider: TiptapCollabProvider | null = null;

const connectionStatus = ref<'disconnected' | 'connecting' | 'connected'>('disconnected');
const currentUserId = ref<string>('');
const userName = ref('User-' + Math.random().toString(36).substring(7));
const userColor = ref('#' + Math.floor(Math.random() * 16777215).toString(16));

// 修改历史记录
interface ChangeRecord {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  userColor: string;
  type: string;
  content?: string;
  updateSize?: number;
}

const changeHistory = ref<ChangeRecord[]>([]);
const awarenessStates = ref<Record<number, any>>({});

// ==================== 计算属性 ====================
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

const reversedHistory = computed(() => {
  return [...changeHistory.value].reverse();
});

// ==================== 工具函数 ====================
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

// 从 Awareness 状态获取用户信息
const getUserInfo = (clientId: number) => {
  const state = awarenessStates.value[clientId];
  if (state?.user) {
    return {
      name: state.user.name || '未知用户',
      color: state.user.color || '#999',
    };
  }
  return {
    name: `用户-${clientId}`,
    color: '#999',
  };
};

// 添加修改记录
const addChangeRecord = (
  update: Uint8Array,
  origin: any,
  type: string = '更新',
  content?: string,
) => {
  // 获取当前用户的 clientId（从 provider 或使用默认值）
  const clientId = provider?.awareness?.clientID || 0;
  const userInfo = getUserInfo(clientId);

  const record: ChangeRecord = {
    id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
    timestamp: Date.now(),
    userId: clientId.toString(),
    userName: userInfo.name,
    userColor: userInfo.color,
    type: type,
    content: content,
    updateSize: update.length,
  };

  changeHistory.value.push(record);

  // 限制历史记录数量，避免内存溢出
  if (changeHistory.value.length > 1000) {
    changeHistory.value = changeHistory.value.slice(-1000);
  }
};

// 清空历史
const clearHistory = () => {
  changeHistory.value = [];
};

// ==================== 编辑器初始化 ====================
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      undoRedo: false,
    }),
    Collaboration.configure({
      document: doc,
    }),
  ],
  editorProps: {
    attributes: {
      class:
        'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
    },
  },
  onUpdate: ({ editor }) => {
    // 获取最后的变化内容
    try {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to);
      const transaction = editor.state.tr;

      // 判断操作类型
      let type = '编辑';
      let content = '';

      if (transaction.steps.length > 0) {
        const step = transaction.steps[0];
        // 这里可以进一步分析 step 的类型来确定是插入、删除还是格式化
        if (text) {
          type = '选择';
          content = text.substring(0, 50); // 限制内容长度
        } else {
          type = '输入';
          // 尝试获取插入的文本
          const insertedText = editor.state.doc.textBetween(Math.max(0, from - 10), from);
          content = insertedText.substring(0, 50);
        }
      }
    } catch (error) {
      // 忽略错误
    }
  },
});

// ==================== 组件挂载时的初始化 ====================
onMounted(async () => {
  if (process.client && typeof window !== 'undefined') {
    await nextTick();

    if (!editor.value) {
      console.error('❌ 编辑器尚未初始化');
      connectionStatus.value = 'disconnected';
      return;
    }

    const appId = config.public.tiptap?.documentServerId;
    const token = config.public.tiptap?.documentAppJwt;
    const documentName = 'change-tracking-demo';

    if (!appId) {
      console.warn(
        '⚠️ Tiptap AppID 未配置。请在环境变量中设置 TIPTOP_APP_ID 或在 nuxt.config.ts 中配置 runtimeConfig.public.tiptap.documentServerId',
      );
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
          console.log('✅ 已连接到 Tiptap Cloud 并完成同步');

          // 设置 Awareness 状态
          if (provider) {
            provider.setAwarenessField('user', {
              name: userName.value,
              color: userColor.value,
            });

            // 获取当前用户的 clientId
            if (provider.awareness) {
              currentUserId.value = provider.awareness.clientID.toString();
            }
          }

          nextTick(() => {
            try {
              if (!editor.value) return;

              const configMap = doc.getMap('config');
              const initialContentLoaded = configMap.get('initialContentLoaded');

              if (!initialContentLoaded) {
                configMap.set('initialContentLoaded', true);

                const currentContent = editor.value.getJSON();
                const isEmpty =
                  currentContent.type === 'doc' &&
                  (!currentContent.content || currentContent.content.length === 0);

                if (isEmpty) {
                  editor.value.commands.setContent(`
                    <h1>修改追踪编辑器演示</h1>
                    <p>这是一个展示 Yjs 增量更新和用户操作追踪的演示。</p>
                    <p>您可以：</p>
                    <ul>
                      <li>在编辑器中输入或修改内容</li>
                      <li>观察右侧的修改历史，查看每次修改的详细信息</li>
                      <li>在不同浏览器中打开，可以看到不同用户的修改记录</li>
                    </ul>
                    <p>开始编辑，观察每次修改是如何被追踪的！</p>
                  `);
                }
              }
            } catch (error) {
              console.error('❌ 设置初始内容时出错:', error);
            }
          });
        },

        onClose(event: any) {
          console.log('🔌 连接已关闭', event);
          connectionStatus.value = 'disconnected';
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

        onAuthenticationFailed(event: any) {
          console.error('❌ 认证失败', event);
          connectionStatus.value = 'disconnected';
        },
      });

      // 监听 Y.Doc 的更新事件
      // 这是追踪每次修改的关键
      doc.on('update', (update: Uint8Array, origin: any) => {
        // 忽略来自同步的更新（避免重复记录）
        if (origin === 'sync' || origin === 'remote') {
          // 这些是来自其他用户的更新
          addChangeRecord(update, origin, '远程同步', '来自其他用户的更新');
        } else if (origin !== 'indexeddb' && origin !== 'broadcast') {
          // 本地用户的更新
          addChangeRecord(update, origin, '本地编辑', '本地用户的修改');
        }
      });

      // 监听 Awareness 变化，更新用户信息映射
      provider.on('awarenessChange', ({ states }: { states: Record<number, any> }) => {
        awarenessStates.value = states;
      });

      // 监听编辑器内容变化
      editor.value.on('update', ({ editor }) => {
        // 这里可以获取更详细的内容变化信息
        try {
          const { from, to } = editor.state.selection;
          const text = editor.state.doc.textBetween(
            Math.max(0, from - 1),
            Math.min(editor.state.doc.content.size, to + 1),
          );

          if (text && text.length > 0) {
            // 内容变化已通过 Y.Doc 的 update 事件记录
          }
        } catch (error) {
          // 忽略错误
        }
      });

      provider.on('error', (error: any) => {
        console.error('❌ Provider 错误:', error);
      });
    } catch (error) {
      console.error('❌ 创建 TiptapCollabProvider 失败:', error);
      connectionStatus.value = 'disconnected';
    }
  }
});

// ==================== 组件卸载时的清理 ====================
onBeforeUnmount(() => {
  if (provider) {
    try {
      provider.destroy();
    } catch (error) {
      console.error('销毁 provider 时出错:', error);
    }
    provider = null;
  }

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
