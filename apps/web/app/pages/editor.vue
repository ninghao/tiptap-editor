<template>
  <div class="container mx-auto max-w-6xl flex">
    <div class="flex gap-4 h-full flex-1 min-h-screen">
      <!-- 编辑器区域 -->
      <div class="min-w-md flex-1">
        <EditorContent :editor="editor" class="prose max-w-none h-full" />
      </div>
      <!-- JSON 显示区域 -->
      <div class="mb-6 my-4 max-h-screen overflow-scroll">
        <pre class="font-mono text-xs">{{ editorJson }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import Collaboration from '@tiptap/extension-collaboration';
import * as Y from 'yjs';

const doc = new Y.Doc(); // Initialize Y.Doc for shared editing
let provider: any = null;
let saveTimeout: NodeJS.Timeout | null = null;

const editorJson = ref('{}');

const updateJson = () => {
  if (editor.value) {
    try {
      editorJson.value = JSON.stringify(editor.value.getJSON(), null, 2);
    } catch (error) {
      editorJson.value = '{}';
    }
  }
};

// IndexedDB 持久化工具函数
const initIndexedDB = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('tiptap-demo-db', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('documents')) {
        db.createObjectStore('documents');
      }
    };
  });
};

const saveToIndexedDB = async (data: Uint8Array) => {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction(['documents'], 'readwrite');
    const store = transaction.objectStore('documents');

    return new Promise<void>((resolve, reject) => {
      const request = store.put(data, 'tiptap-demo-doc');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
  }
};

const loadFromIndexedDB = async (): Promise<Uint8Array | null> => {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction(['documents'], 'readonly');
    const store = transaction.objectStore('documents');
    const request = store.get('tiptap-demo-doc');

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve(new Uint8Array(result));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error loading from IndexedDB:', error);
    return null;
  }
};

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      // Collaboration extension handles history management
    }),
    Collaboration.configure({
      document: doc, // Configure Y.Doc for collaboration
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

onMounted(async () => {
  if (process.client && typeof window !== 'undefined') {
    // 先从 IndexedDB 加载已保存的状态
    const savedState = await loadFromIndexedDB();
    if (savedState) {
      try {
        Y.applyUpdate(doc, savedState, 'indexeddb');
        // 等待编辑器更新
        await new Promise((resolve) => setTimeout(resolve, 100));
        updateJson();
      } catch (error) {
        console.error('Error loading state from IndexedDB:', error);
      }
    }

    // 设置 IndexedDB 持久化（使用防抖，避免频繁保存）
    doc.on('update', async (update: Uint8Array, origin: any) => {
      // 避免循环：如果更新来自 IndexedDB 或 broadcast，就不保存
      if (origin !== 'indexeddb' && origin !== 'broadcast') {
        // 清除之前的保存定时器
        if (saveTimeout) {
          clearTimeout(saveTimeout);
        }
        // 防抖：500ms 后保存
        saveTimeout = setTimeout(async () => {
          const state = Y.encodeStateAsUpdate(doc);
          await saveToIndexedDB(state);
        }, 500);
      }
    });

    // 使用浏览器原生的 BroadcastChannel API 实现同一浏览器不同标签页之间的同步
    if (window.BroadcastChannel) {
      const channel = new BroadcastChannel('tiptap-demo-sync');

      // 监听来自其他标签页的消息
      channel.onmessage = (event) => {
        if (event.data.type === 'yjs-update') {
          try {
            // 将数组转换回 Uint8Array
            const update = new Uint8Array(event.data.update);
            Y.applyUpdate(doc, update, 'broadcast');
          } catch (error) {
            console.error('Error applying update from broadcast channel:', error);
          }
        }
      };

      // 监听 Y.Doc 的更新并广播到其他标签页
      doc.on('update', (update: Uint8Array, origin: any) => {
        // 避免循环更新：如果更新来自 broadcast 或 indexeddb，就不再广播
        if (origin !== 'broadcast' && origin !== 'indexeddb') {
          channel.postMessage({
            type: 'yjs-update',
            update: Array.from(update),
          });
        }
      });

      provider = {
        destroy: () => {
          channel.close();
        },
      };
    }
  }
});

onBeforeUnmount(async () => {
  // 清除防抖定时器
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  // 在卸载前保存最终状态
  if (doc) {
    const state = Y.encodeStateAsUpdate(doc);
    await saveToIndexedDB(state);
  }
  provider?.destroy();
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
