<template>
  <div class="container mx-auto max-w-6xl p-4">
    <!-- 说明文档区域 -->
    <div class="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-6">
      <h2 class="text-2xl font-bold mb-4 text-purple-900">Awareness 协作编辑器演示</h2>
      <div class="space-y-3 text-gray-700">
        <div>
          <h3 class="font-semibold mb-2 text-purple-800">✨ 主要功能</h3>
          <ul class="list-disc list-inside space-y-1 ml-4">
            <li><strong>用户存在感知</strong>：实时显示所有在线协作者及其状态信息</li>
            <li><strong>鼠标位置跟踪</strong>：实时显示其他用户的鼠标位置（在编辑器区域内）</li>
            <li><strong>自定义用户信息</strong>：每个用户可以设置自己的名称和颜色</li>
            <li><strong>实时状态更新</strong>：通过 Awareness API 实时同步用户活动</li>
          </ul>
        </div>
        <div>
          <h3 class="font-semibold mb-2 text-purple-800">📝 使用方法</h3>
          <ol class="list-decimal list-inside space-y-1 ml-4">
            <li>配置 Tiptap Cloud 的 AppID 和 JWT Token</li>
            <li>在下方输入框中设置您的用户名和颜色</li>
            <li>在不同浏览器或设备上打开此页面</li>
            <li>移动鼠标，观察右侧的在线用户列表和鼠标位置更新</li>
          </ol>
        </div>
        <div class="pt-2 border-t border-purple-200">
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
        </div>
      </div>
    </div>

    <!-- 用户设置区域 -->
    <div class="mb-6 bg-white border rounded-lg p-4">
      <h3 class="text-lg font-semibold mb-4 text-gray-800">用户设置</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
          <input
            v-model="userName"
            type="text"
            placeholder="输入您的用户名"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            @input="updateAwareness"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">用户颜色</label>
          <div class="flex gap-2">
            <input
              v-model="userColor"
              type="color"
              class="h-10 w-20 border border-gray-300 rounded-md cursor-pointer"
              @change="updateAwareness"
            />
            <input
              v-model="userColor"
              type="text"
              placeholder="#ffcc00"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              @input="updateAwareness"
            />
          </div>
        </div>
        <div class="flex items-end">
          <div class="flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-full border-2 border-gray-300"
              :style="{ backgroundColor: userColor }"
            ></div>
            <span class="text-sm font-medium">{{ userName || '未命名用户' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑器区域 -->
    <div class="flex gap-4 h-full flex-1 min-h-[600px]">
      <!-- 编辑器区域 -->
      <div class="min-w-md flex-1 border rounded-lg flex flex-col relative">
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
          </div>
        </div>
        <div
          ref="editorContainer"
          class="flex-1 overflow-auto relative"
          @mousemove="handleMouseMove"
        >
          <EditorContent :editor="editor" class="prose max-w-none h-full" />
        </div>
      </div>

      <!-- 在线用户和 Awareness 信息区域 -->
      <div class="w-96 border rounded-lg flex flex-col">
        <div class="p-2 border-b">
          <h3 class="text-sm font-semibold text-gray-700">在线用户 ({{ onlineUsers.length }})</h3>
        </div>
        <div class="flex-1 overflow-auto p-4 space-y-3">
          <!-- 在线用户列表 -->
          <div v-if="onlineUsers.length === 0" class="text-sm text-gray-500 text-center py-4">
            暂无其他在线用户
          </div>
          <div
            v-for="(user, index) in onlineUsers"
            :key="index"
            class="border rounded-lg p-3 bg-gray-50"
          >
            <div class="flex items-center gap-3 mb-2">
              <div
                class="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                :style="{ backgroundColor: user.color || '#999' }"
              ></div>
              <div class="flex-1">
                <div class="font-medium text-sm">{{ user.name || '未命名用户' }}</div>
                <div class="text-xs text-gray-500">用户 ID: {{ user.clientId }}</div>
              </div>
            </div>
            <div
              v-if="user.mouseX !== undefined && user.mouseY !== undefined"
              class="text-xs text-gray-600 mt-2"
            >
              <div>鼠标位置: ({{ Math.round(user.mouseX) }}, {{ Math.round(user.mouseY) }})</div>
            </div>
            <div class="text-xs text-gray-400 mt-1">
              最后活动: {{ formatTime(user.lastUpdate) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Awareness 状态调试区域（可选） -->
    <div v-if="showDebug" class="mt-4 bg-gray-50 border rounded-lg p-4">
      <h3 class="text-sm font-semibold mb-2">Awareness 状态调试</h3>
      <pre class="font-mono text-xs whitespace-pre-wrap overflow-auto max-h-40">{{
        JSON.stringify(awarenessStates, null, 2)
      }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Awareness 协作编辑器页面
 *
 * 功能说明：
 * 1. 使用 TiptapCollabProvider 连接 Tiptap Cloud 服务
 * 2. 使用 Awareness API 实现用户存在感知
 * 3. 跟踪和显示用户的鼠标位置
 * 4. 显示所有在线用户的状态信息
 */

// ==================== 导入依赖 ====================
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { onBeforeUnmount, onMounted, ref, computed, nextTick } from 'vue';
import Collaboration from '@tiptap/extension-collaboration';
import * as Y from 'yjs';
import { TiptapCollabProvider } from '@tiptap-pro/provider';

// ==================== Nuxt 配置 ====================
const config = useRuntimeConfig();

// ==================== 响应式状态 ====================
const doc = new Y.Doc();
let provider: TiptapCollabProvider | null = null;

const editorJson = ref('{}');
const connectionStatus = ref<'disconnected' | 'connecting' | 'connected'>('disconnected');
const userName = ref('User-' + Math.random().toString(36).substring(7));
const userColor = ref('#ffcc00');
const onlineUsers = ref<
  Array<{
    clientId: number;
    name?: string;
    color?: string;
    mouseX?: number;
    mouseY?: number;
    lastUpdate: number;
  }>
>([]);
const awarenessStates = ref<Record<number, any>>({});
const showDebug = ref(false);
const editorContainer = ref<HTMLElement | null>(null);

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

// ==================== 工具函数 ====================
const updateJson = () => {
  if (editor.value) {
    try {
      editorJson.value = JSON.stringify(editor.value.getJSON(), null, 2);
    } catch (error) {
      editorJson.value = '{}';
    }
  }
};

const formatTime = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 1000) return '刚刚';
  if (diff < 60000) return `${Math.floor(diff / 1000)}秒前`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  return new Date(timestamp).toLocaleTimeString();
};

// ==================== Awareness 更新函数 ====================
const updateAwareness = () => {
  if (!provider) return;

  try {
    provider.setAwarenessField('user', {
      name: userName.value || '未命名用户',
      color: userColor.value,
    });
  } catch (error) {
    console.error('更新 Awareness 失败:', error);
  }
};

// ==================== 鼠标移动处理 ====================
const handleMouseMove = (event: MouseEvent) => {
  if (!provider || !editorContainer.value) return;

  try {
    const rect = editorContainer.value.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // 更新 Awareness，包含鼠标位置
    provider.setAwarenessField('user', {
      name: userName.value || '未命名用户',
      color: userColor.value,
      mouseX: mouseX,
      mouseY: mouseY,
    });
  } catch (error) {
    console.error('更新鼠标位置失败:', error);
  }
};

// ==================== 更新在线用户列表 ====================
const updateOnlineUsers = (states: Record<number, any>) => {
  const now = Date.now();
  const users: typeof onlineUsers.value = [];

  Object.entries(states).forEach(([clientIdStr, state]) => {
    const clientId = parseInt(clientIdStr, 10);
    const userData = state?.user || {};

    users.push({
      clientId,
      name: userData.name,
      color: userData.color,
      mouseX: userData.mouseX,
      mouseY: userData.mouseY,
      lastUpdate: now,
    });
  });

  onlineUsers.value = users;
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
  onUpdate: () => {
    updateJson();
  },
  onCreate: () => {
    updateJson();
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
    const documentName = 'awareness-demo';

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

          // 初始化 Awareness 状态
          updateAwareness();

          nextTick(() => {
            try {
              if (!editor.value) {
                console.warn('⚠️ 编辑器已销毁，跳过初始内容设置');
                return;
              }

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
                    <h1>欢迎使用 Awareness 协作编辑器</h1>
                    <p>这是一个展示 Awareness 功能的协作编辑器演示。</p>
                    <p>您可以：</p>
                    <ul>
                      <li>在上方设置您的用户名和颜色</li>
                      <li>移动鼠标，观察右侧的鼠标位置更新</li>
                      <li>在不同浏览器或设备上打开此页面，查看其他在线用户</li>
                      <li>实时看到其他用户的活动状态</li>
                    </ul>
                    <p>开始编辑和移动鼠标，体验 Awareness 功能吧！</p>
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
          if (event?.reason === 'JWT verification failed') {
            console.error('❌ JWT 验证失败，请检查 token 配置');
          }
        },

        onStatus(event: any) {
          console.log('📊 连接状态更新', event);
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

      // 监听 Awareness 变化
      provider.on('awarenessChange', ({ states }: { states: Record<number, any> }) => {
        console.log('🔄 Awareness 状态变化:', states);
        awarenessStates.value = states;
        updateOnlineUsers(states);
      });

      // 监听 Awareness 更新（心跳）
      provider.on('awarenessUpdate', ({ states }: { states: Record<number, any> }) => {
        // 更新在线用户列表（即使状态没有变化，也要更新最后活动时间）
        const now = Date.now();
        onlineUsers.value = onlineUsers.value.map((user) => {
          if (states[user.clientId]) {
            return { ...user, lastUpdate: now };
          }
          return user;
        });
      });

      // 添加全局错误处理
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
      console.log('🔌 TiptapCollabProvider 已销毁');
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
