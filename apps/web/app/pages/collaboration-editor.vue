<template>
  <div class="container mx-auto max-w-6xl p-4">
    <!-- 说明文档区域 -->
    <div class="mb-6 bg-green-50 border border-green-200 rounded-lg p-6">
      <h2 class="text-2xl font-bold mb-4 text-green-900">云端协作编辑器说明</h2>
      <div class="space-y-3 text-gray-700">
        <div>
          <h3 class="font-semibold mb-2 text-green-800">✨ 主要功能</h3>
          <ul class="list-disc list-inside space-y-1 ml-4">
            <li>
              <strong>实时云端协作编辑</strong>：使用 TiptapCollabProvider 连接 Tiptap Cloud
              服务，支持跨浏览器、跨设备的实时协作
            </li>
            <li>
              <strong>自动同步</strong>：编辑内容会自动同步到云端服务器，所有协作者都能实时看到更改
            </li>
            <li><strong>连接状态监控</strong>：实时显示连接状态和未同步的更改数量</li>
            <li><strong>JSON 实时显示</strong>：右侧实时显示编辑器的 JSON 数据结构</li>
          </ul>
        </div>
        <div>
          <h3 class="font-semibold mb-2 text-green-800">📝 使用方法</h3>
          <ol class="list-decimal list-inside space-y-1 ml-4">
            <li>配置 Tiptap Cloud 的 AppID 和 JWT Token（在环境变量或配置文件中）</li>
            <li>在当前浏览器中开始编辑内容</li>
            <li>在其他浏览器或设备上打开相同页面，可以实时看到协作编辑</li>
            <li>观察连接状态和同步状态指示器</li>
          </ol>
        </div>
        <div>
          <h3 class="font-semibold mb-2 text-green-800">💡 技术实现</h3>
          <ul class="list-disc list-inside space-y-1 ml-4 text-sm">
            <li>
              使用 <strong>Yjs</strong> 作为 CRDT（无冲突复制数据类型）库，确保多用户编辑的一致性
            </li>
            <li>
              使用 <strong>TiptapCollabProvider</strong> 连接 Tiptap Cloud 服务，实现 WebSocket
              实时同步
            </li>
            <li>使用 <strong>Tiptap Collaboration Extension</strong> 提供协作编辑能力</li>
            <li>支持 <strong>JWT 认证</strong>，确保安全的文档访问控制</li>
          </ul>
        </div>
        <div class="pt-2 border-t border-green-200">
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
          <div v-if="unsyncedChanges > 0" class="text-sm text-orange-600">
            ⚠️ 未同步更改：{{ unsyncedChanges }} 个
          </div>
          <p class="text-sm text-gray-600 mt-2">
            <strong>注意</strong>：需要配置有效的 Tiptap Cloud AppID 和 JWT Token
            才能使用云端协作功能。 请确保在环境变量中设置了
            <code class="bg-gray-100 px-1 rounded">TIPTOP_APP_ID</code> 和
            <code class="bg-gray-100 px-1 rounded">TIPTOP_JWT_TOKEN</code>。
          </p>
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
            <span
              v-if="unsyncedChanges > 0"
              class="px-2 py-1 rounded bg-orange-100 text-orange-700"
            >
              {{ unsyncedChanges }} 未同步
            </span>
          </div>
        </div>
        <div class="flex-1 overflow-auto">
          <EditorContent :editor="editor" class="prose max-w-none h-full" />
        </div>
      </div>
      <!-- JSON 显示区域 -->
      <div class="w-96 border rounded-lg flex flex-col">
        <div class="p-2 border-b">
          <h3 class="text-sm font-semibold text-gray-700">实时 JSON 数据</h3>
        </div>
        <div class="flex-1 overflow-auto p-4">
          <pre class="font-mono text-xs whitespace-pre-wrap">{{ editorJson }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 云端协作编辑器页面
 *
 * 功能说明：
 * 1. 使用 Yjs 作为 CRDT 库实现无冲突的协作编辑
 * 2. 使用 TiptapCollabProvider 连接 Tiptap Cloud 服务，实现 WebSocket 实时同步
 * 3. 支持跨浏览器、跨设备的实时协作编辑
 * 4. 实时显示连接状态和未同步更改数量
 * 5. 实时显示编辑器的 JSON 数据结构
 */

// ==================== 导入依赖 ====================
import { useEditor, EditorContent } from '@tiptap/vue-3'; // Tiptap Vue 3 编辑器核心
import StarterKit from '@tiptap/starter-kit'; // Tiptap 基础功能包（包含段落、标题、列表等）
import { onBeforeUnmount, onMounted, ref, computed, nextTick } from 'vue'; // Vue 3 组合式 API
import Collaboration from '@tiptap/extension-collaboration'; // Tiptap 协作扩展
import * as Y from 'yjs'; // Yjs CRDT 库，用于实现协作编辑
import { TiptapCollabProvider } from '~/lib/tiptap-collab-provider'; // Tiptap Cloud Provider

// ==================== Nuxt 配置 ====================
const config = useRuntimeConfig();

// ==================== 全局变量定义 ====================

/**
 * Y.Doc 实例
 * Yjs 的核心数据结构，用于存储和同步文档状态
 * 所有协作者共享同一个文档，通过 CRDT 算法确保数据一致性
 */
const doc = new Y.Doc();

/**
 * 协作提供者实例
 * TiptapCollabProvider 用于管理与 Tiptap Cloud 服务的 WebSocket 连接
 */
let provider: TiptapCollabProvider | null = null;

/**
 * 编辑器 JSON 数据的响应式引用
 * 用于在右侧面板实时显示编辑器的 JSON 结构
 */
const editorJson = ref('{}');

/**
 * 连接状态
 * 'disconnected' | 'connecting' | 'connected'
 */
const connectionStatus = ref<'disconnected' | 'connecting' | 'connected'>('disconnected');

/**
 * 未同步的更改数量
 */
const unsyncedChanges = ref(0);

/**
 * 连接状态文本
 */
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

// ==================== JSON 更新函数 ====================

/**
 * 更新 JSON 显示内容
 * 从编辑器获取当前文档的 JSON 表示，并格式化显示
 */
const updateJson = () => {
  if (editor.value) {
    try {
      // 获取编辑器的 JSON 表示，使用 2 个空格缩进格式化
      editorJson.value = JSON.stringify(editor.value.getJSON(), null, 2);
    } catch (error) {
      // 如果获取失败，显示空对象
      editorJson.value = '{}';
    }
  }
};

// ==================== 编辑器初始化 ====================

/**
 * 创建 Tiptap 编辑器实例
 * 配置编辑器的扩展、属性和回调函数
 */
const editor = useEditor({
  // 编辑器扩展配置
  extensions: [
    // StarterKit 提供基础编辑功能
    // 包含：段落、标题、列表、粗体、斜体、代码块、引用等
    StarterKit.configure({
      // 注意：Collaboration 扩展会处理历史记录管理
      // 所以不需要 StarterKit 中的 History 扩展
      undoRedo: false,
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

  // 编辑器内容更新时的回调
  onUpdate: () => {
    // 每次内容更新时，同步更新 JSON 显示
    updateJson();
  },

  // 编辑器创建完成时的回调
  onCreate: () => {
    // 编辑器创建后，初始化 JSON 显示
    updateJson();
  },
});

// ==================== 组件挂载时的初始化 ====================

/**
 * 组件挂载完成后的初始化逻辑
 * 1. 创建 TiptapCollabProvider 连接到 Tiptap Cloud 服务
 * 2. 设置连接状态监听
 * 3. 设置未同步更改监听
 * 4. 在同步完成后设置初始内容（如果文档为空）
 */
onMounted(async () => {
  // 确保只在客户端执行（Nuxt SSR 环境检查）
  if (process.client && typeof window !== 'undefined') {
    // 等待编辑器完全初始化
    await nextTick();

    // 确保编辑器已经初始化
    if (!editor.value) {
      console.error('❌ 编辑器尚未初始化');
      connectionStatus.value = 'disconnected';
      return;
    }

    // 获取配置信息
    // 优先使用 runtime config，如果没有则使用环境变量或默认值
    console.log(config.public.tiptap);
    const appId = config.public.tiptap?.documentServerId;
    const token = config.public.tiptap?.documentAppJwt;
    const documentName = 'collaboration-demo'; // 文档名称，用于标识要同步的文档

    // 检查必要的配置
    if (!appId) {
      console.warn(
        '⚠️ Tiptap AppID 未配置。请在环境变量中设置 TIPTOP_APP_ID 或在 nuxt.config.ts 中配置 runtimeConfig.public.tiptap.documentServerId',
      );
      connectionStatus.value = 'disconnected';
      return;
    }

    // 设置连接状态为连接中
    connectionStatus.value = 'connecting';

    try {
      // 创建 TiptapCollabProvider 实例
      // 这将建立与 Tiptap Cloud 服务的 WebSocket 连接
      provider = new TiptapCollabProvider({
        name: documentName, // 文档标识符，用于同步
        appId: appId, // Tiptap Cloud AppID
        token: token, // JWT 认证令牌
        document: doc, // Y.Doc 实例

        // 用户信息（可选，如果不需要可以移除）
        // user: `User-${Math.random().toString(36).substring(7)}`,

        // 同步完成回调
        // 当文档首次同步完成时，如果文档为空，则设置初始内容
        onSynced() {
          connectionStatus.value = 'connected';
          console.log('✅ 已连接到 Tiptap Cloud 并完成同步');

          // 使用 nextTick 确保所有更新都已完成
          nextTick(() => {
            try {
              // 确保编辑器仍然存在
              if (!editor.value) {
                console.warn('⚠️ 编辑器已销毁，跳过初始内容设置');
                return;
              }

              // 获取或创建 config map（getMap 如果不存在会自动创建）
              const configMap = doc.getMap('config');

              // 检查是否已经加载过初始内容
              // 使用 Y.Map 来存储配置信息，避免重复设置初始内容
              const initialContentLoaded = configMap.get('initialContentLoaded');

              if (!initialContentLoaded) {
                configMap.set('initialContentLoaded', true);

                // 设置初始内容（仅在文档为空时）
                const currentContent = editor.value.getJSON();
                const isEmpty =
                  currentContent.type === 'doc' &&
                  (!currentContent.content || currentContent.content.length === 0);

                if (isEmpty) {
                  editor.value.commands.setContent(`
                    <h1>欢迎使用云端协作编辑器</h1>
                    <p>这是一个使用 TiptapCollabProvider 实现的实时协作编辑器。</p>
                    <p>您可以：</p>
                    <ul>
                      <li>在不同浏览器或设备上打开此页面</li>
                      <li>实时看到其他协作者的编辑内容</li>
                      <li>观察连接状态和同步状态</li>
                    </ul>
                    <p>开始编辑吧！您的更改会实时同步到云端，其他协作者可以立即看到。</p>
                  `);
                }
              }
            } catch (error) {
              console.error('❌ 设置初始内容时出错:', error);
            }
          });
        },

        // 连接关闭回调
        onClose(event: any) {
          console.log('🔌 连接已关闭', event);
          connectionStatus.value = 'disconnected';

          // 如果是 JWT 验证失败，提示用户
          if (event?.reason === 'JWT verification failed') {
            console.error('❌ JWT 验证失败，请检查 token 配置');
          }
        },

        // 连接错误回调
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

        // 认证失败回调
        onAuthenticationFailed(event: any) {
          console.error('❌ 认证失败', event);
          connectionStatus.value = 'disconnected';
        },
      });

      // 监听未同步的更改数量
      // 当有未同步的更改时，更新 unsyncedChanges
      provider.on('unsyncedChanges', (event: any) => {
        try {
          unsyncedChanges.value = event.number || 0;
          if (event.number > 0) {
            console.log(`⚠️ 有 ${event.number} 个未同步的更改`);
          }
        } catch (error) {
          console.error('❌ 处理未同步更改事件时出错:', error);
        }
      });

      // 初始化未同步更改数量
      try {
        unsyncedChanges.value = provider.unsyncedChanges || 0;
      } catch (error) {
        console.error('❌ 获取未同步更改数量时出错:', error);
        unsyncedChanges.value = 0;
      }

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

/**
 * 组件卸载前的清理逻辑
 * 1. 销毁 TiptapCollabProvider 连接
 * 2. 销毁编辑器实例
 */
onBeforeUnmount(() => {
  // 销毁 provider 连接，关闭 WebSocket
  if (provider) {
    try {
      provider.destroy();
      console.log('🔌 TiptapCollabProvider 已销毁');
    } catch (error) {
      console.error('销毁 provider 时出错:', error);
    }
    provider = null;
  }

  // 销毁编辑器实例，清理事件监听器和 DOM 元素
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
