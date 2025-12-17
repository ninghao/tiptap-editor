<template>
  <div>
    <EditorContent :editor="editor" class="prose max-w-none h-full" />
  </div>
</template>

<script setup lang="ts">
/**
 * 本地协作编辑器页面
 *
 * 功能说明：
 * 1. 使用 Yjs 作为 CRDT 库实现无冲突的协作编辑
 * 2. 使用 BroadcastChannel API 实现同一浏览器不同标签页之间的实时同步
 * 3. 使用 IndexedDB 实现本地持久化存储
 * 4. 实时显示编辑器的 JSON 数据结构
 */

// ==================== 导入依赖 ====================
import { useEditor, EditorContent } from '@tiptap/vue-3'; // Tiptap Vue 3 编辑器核心
import StarterKit from '@tiptap/starter-kit'; // Tiptap 基础功能包（包含段落、标题、列表等）
import { onBeforeUnmount, onMounted, ref } from 'vue'; // Vue 3 组合式 API
import Collaboration from '@tiptap/extension-collaboration'; // Tiptap 协作扩展
import * as Y from 'yjs'; // Yjs CRDT 库，用于实现协作编辑

// ==================== 全局变量定义 ====================

/**
 * Y.Doc 实例
 * Yjs 的核心数据结构，用于存储和同步文档状态
 * 所有标签页共享同一个文档标识，通过 CRDT 算法确保数据一致性
 */
const doc = new Y.Doc();

/**
 * 协作提供者实例
 * 用于管理不同标签页之间的数据同步
 * 可以是 BroadcastChannel、WebSocket 或其他同步机制
 */
let provider: any = null;

/**
 * 防抖定时器
 * 用于延迟保存到 IndexedDB，避免频繁写入
 * 当用户快速输入时，只在停止输入 500ms 后才保存
 */
let saveTimeout: NodeJS.Timeout | null = null;

/**
 * 编辑器 JSON 数据的响应式引用
 * 用于在右侧面板实时显示编辑器的 JSON 结构
 */
const editorJson = ref('{}');

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

// ==================== IndexedDB 持久化工具函数 ====================

/**
 * 初始化 IndexedDB 数据库
 * 如果数据库不存在则创建，如果版本需要升级则执行升级逻辑
 *
 * @returns Promise<IDBDatabase> 返回数据库实例
 */
const initIndexedDB = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // 打开名为 'tiptap-demo-db' 的数据库，版本号为 1
    const request = indexedDB.open('tiptap-demo-db', 1);

    // 打开失败时的处理
    request.onerror = () => reject(request.error);

    // 打开成功时的处理
    request.onsuccess = () => resolve(request.result);

    // 数据库版本升级时的处理（首次创建或版本号增加时触发）
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 如果 'documents' 对象存储不存在，则创建它
      // 对象存储类似于关系数据库中的表
      if (!db.objectStoreNames.contains('documents')) {
        db.createObjectStore('documents');
      }
    };
  });
};

/**
 * 保存数据到 IndexedDB
 * 将 Yjs 文档的二进制状态保存到本地数据库，实现持久化
 *
 * @param data - Yjs 文档的二进制更新数据（Uint8Array 格式）
 */
const saveToIndexedDB = async (data: Uint8Array) => {
  try {
    // 获取数据库实例
    const db = await initIndexedDB();

    // 开启一个读写事务
    const transaction = db.transaction(['documents'], 'readwrite');

    // 获取对象存储
    const store = transaction.objectStore('documents');

    // 使用 Promise 包装 IndexedDB 的异步操作
    return new Promise<void>((resolve, reject) => {
      // 将数据保存到 'tiptap-demo-doc' 键下
      const request = store.put(data, 'tiptap-demo-doc');

      // 保存成功
      request.onsuccess = () => resolve();

      // 保存失败
      request.onerror = () => reject(request.error);

      // 事务完成
      transaction.oncomplete = () => resolve();

      // 事务失败
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
  }
};

/**
 * 从 IndexedDB 加载数据
 * 从本地数据库读取之前保存的文档状态
 *
 * @returns Promise<Uint8Array | null> 返回文档的二进制数据，如果不存在则返回 null
 */
const loadFromIndexedDB = async (): Promise<Uint8Array | null> => {
  try {
    // 获取数据库实例
    const db = await initIndexedDB();

    // 开启一个只读事务
    const transaction = db.transaction(['documents'], 'readonly');

    // 获取对象存储
    const store = transaction.objectStore('documents');

    // 读取 'tiptap-demo-doc' 键下的数据
    const request = store.get('tiptap-demo-doc');

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;

        // 如果数据存在，转换为 Uint8Array 返回
        if (result) {
          resolve(new Uint8Array(result));
        } else {
          // 如果数据不存在，返回 null
          resolve(null);
        }
      };

      // 读取失败
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error loading from IndexedDB:', error);
    return null;
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
 * 1. 从 IndexedDB 加载已保存的文档状态
 * 2. 设置自动保存到 IndexedDB
 * 3. 建立 BroadcastChannel 连接实现标签页同步
 */
onMounted(async () => {
  // 确保只在客户端执行（Nuxt SSR 环境检查）
  if (process.client && typeof window !== 'undefined') {
    // ========== 步骤 1: 从 IndexedDB 恢复文档状态 ==========
    const savedState = await loadFromIndexedDB();
    if (savedState) {
      try {
        // 将保存的状态应用到 Y.Doc
        // 'indexeddb' 作为 origin 标识，用于区分更新来源
        Y.applyUpdate(doc, savedState, 'indexeddb');

        // 等待编辑器完成更新（给编辑器一些时间处理状态恢复）
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 更新 JSON 显示
        updateJson();
      } catch (error) {
        console.error('Error loading state from IndexedDB:', error);
      }
    }

    // ========== 步骤 2: 设置自动保存到 IndexedDB ==========
    // 监听 Y.Doc 的更新事件，实现自动持久化
    // 使用防抖机制，避免频繁写入 IndexedDB
    doc.on('update', async (update: Uint8Array, origin: any) => {
      // 避免循环保存：
      // - 如果更新来自 IndexedDB（恢复数据时），不需要再次保存
      // - 如果更新来自 broadcast（其他标签页同步），不需要保存（由原始标签页保存）
      if (origin !== 'indexeddb' && origin !== 'broadcast') {
        // 清除之前的保存定时器（防抖：只保留最新的定时器）
        if (saveTimeout) {
          clearTimeout(saveTimeout);
        }

        // 设置新的保存定时器：500ms 后执行保存
        // 这样在用户快速输入时，只在停止输入 500ms 后才保存，减少 I/O 操作
        saveTimeout = setTimeout(async () => {
          // 获取文档的完整状态（编码为二进制格式）
          const state = Y.encodeStateAsUpdate(doc);
          // 保存到 IndexedDB
          await saveToIndexedDB(state);
        }, 500);
      }
    });

    // ========== 步骤 3: 建立 BroadcastChannel 连接 ==========
    // 使用浏览器原生的 BroadcastChannel API 实现同一浏览器不同标签页之间的实时同步
    // BroadcastChannel 允许同源的不同窗口/标签页之间进行通信
    if (window.BroadcastChannel) {
      // 创建名为 'tiptap-demo-sync' 的广播通道
      // 所有使用相同名称的标签页都会连接到同一个通道
      const channel = new BroadcastChannel('tiptap-demo-sync');

      // 监听来自其他标签页的消息
      channel.onmessage = (event) => {
        // 检查消息类型是否为 Yjs 更新
        if (event.data.type === 'yjs-update') {
          try {
            // BroadcastChannel 只能传输可序列化的数据
            // 所以更新数据被转换为数组传输，这里需要转换回 Uint8Array
            const update = new Uint8Array(event.data.update);

            // 将更新应用到本地 Y.Doc
            // 'broadcast' 作为 origin 标识，表示更新来自其他标签页
            Y.applyUpdate(doc, update, 'broadcast');
          } catch (error) {
            console.error('Error applying update from broadcast channel:', error);
          }
        }
      };

      // 监听 Y.Doc 的更新事件，将更新广播到其他标签页
      doc.on('update', (update: Uint8Array, origin: any) => {
        // 避免循环广播：
        // - 如果更新来自 broadcast（其他标签页），不需要再次广播
        // - 如果更新来自 indexeddb（恢复数据），不需要广播
        if (origin !== 'broadcast' && origin !== 'indexeddb') {
          // 将 Uint8Array 转换为数组（因为 BroadcastChannel 需要可序列化的数据）
          channel.postMessage({
            type: 'yjs-update', // 消息类型标识
            update: Array.from(update), // 更新数据（转换为数组）
          });
        }
      });

      // 保存 provider 实例，用于组件卸载时清理资源
      provider = {
        destroy: () => {
          // 关闭广播通道
          channel.close();
        },
      };
    }
  }
});

// ==================== 组件卸载时的清理 ====================

/**
 * 组件卸载前的清理逻辑
 * 1. 清除防抖定时器
 * 2. 保存最终状态到 IndexedDB
 * 3. 关闭 BroadcastChannel 连接
 * 4. 销毁编辑器实例
 */
onBeforeUnmount(async () => {
  // 清除防抖定时器，避免在组件卸载后执行保存操作
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  // 在卸载前保存最终状态到 IndexedDB
  // 确保用户关闭标签页时，最新的内容被保存
  if (doc) {
    // 获取文档的完整状态
    const state = Y.encodeStateAsUpdate(doc);
    // 保存到 IndexedDB
    await saveToIndexedDB(state);
  }

  // 关闭 BroadcastChannel 连接，释放资源
  provider?.destroy();

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
