import * as Y from 'yjs';

export interface BroadcastChannelProviderOptions {
  name: string;
  document: Y.Doc;
  /**
   * Enable IndexedDB persistence. Defaults to true.
   * @default true
   */
  enablePersistence?: boolean;
  /**
   * Debounce time in milliseconds for saving to IndexedDB.
   * @default 500
   */
  saveDebounceMs?: number;
  /**
   * Database name for IndexedDB.
   * @default 'yjs-broadcast-db'
   */
  dbName?: string;
}

/**
 * BroadcastChannel Provider for Yjs with IndexedDB persistence
 *
 * A provider that uses the BroadcastChannel API to synchronize Yjs documents
 * across different tabs/windows in the same browser, with automatic
 * persistence to IndexedDB.
 *
 * @example
 * ```ts
 * const doc = new Y.Doc();
 * const provider = new BroadcastChannelProvider({
 *   name: 'my-document',
 *   document: doc,
 *   enablePersistence: true, // Enable IndexedDB storage
 * });
 * ```
 */
export class BroadcastChannelProvider {
  private channel: BroadcastChannel | null = null;
  private document: Y.Doc;
  private name: string;
  private updateHandler?: (update: Uint8Array, origin: any) => void;
  private saveHandler?: (update: Uint8Array, origin: any) => void;
  private saveTimeout: NodeJS.Timeout | null = null;
  private enablePersistence: boolean;
  private saveDebounceMs: number;
  private dbName: string;
  private lastSaved: Date | null = null;

  constructor(options: BroadcastChannelProviderOptions) {
    this.name = options.name;
    this.document = options.document;
    this.enablePersistence = options.enablePersistence ?? true;
    this.saveDebounceMs = options.saveDebounceMs ?? 500;
    this.dbName = options.dbName ?? 'yjs-broadcast-db';

    if (typeof window !== 'undefined') {
      if (window.BroadcastChannel) {
        this.init();
      }
      if (this.enablePersistence && window.indexedDB) {
        this.initPersistence();
      }
    }
  }

  private init() {
    // Create a BroadcastChannel with the document name
    this.channel = new BroadcastChannel(`yjs-sync-${this.name}`);

    // Listen for messages from other tabs
    this.channel.onmessage = (event) => {
      if (event.data.type === 'yjs-update') {
        try {
          const update = new Uint8Array(event.data.update);
          Y.applyUpdate(this.document, update, 'broadcast');
        } catch (error) {
          console.error('Error applying update from broadcast channel:', error);
        }
      }
    };

    // Listen for document updates and broadcast them
    this.updateHandler = (update: Uint8Array, origin: any) => {
      // Avoid circular broadcasting
      if (origin !== 'broadcast' && origin !== 'indexeddb') {
        this.channel?.postMessage({
          type: 'yjs-update',
          update: Array.from(update),
        });
      }
    };

    this.document.on('update', this.updateHandler);
  }

  private async initPersistence() {
    // Load saved state from IndexedDB
    const savedState = await this.loadFromIndexedDB();
    if (savedState) {
      try {
        Y.applyUpdate(this.document, savedState, 'indexeddb');
        this.lastSaved = new Date();
      } catch (error) {
        console.error('Error loading state from IndexedDB:', error);
      }
    }

    // Set up auto-save
    this.saveHandler = (update: Uint8Array, origin: any) => {
      // Avoid circular saving: don't save updates from IndexedDB or broadcast
      if (origin !== 'indexeddb' && origin !== 'broadcast') {
        // Clear previous save timeout (debounce)
        if (this.saveTimeout) {
          clearTimeout(this.saveTimeout);
        }

        // Set new save timeout
        this.saveTimeout = setTimeout(async () => {
          const state = Y.encodeStateAsUpdate(this.document);
          await this.saveToIndexedDB(state);
          this.lastSaved = new Date();
        }, this.saveDebounceMs);
      }
    };

    this.document.on('update', this.saveHandler);
  }

  private async initIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents');
        }
      };
    });
  }

  private async saveToIndexedDB(data: Uint8Array): Promise<void> {
    try {
      const db = await this.initIndexedDB();
      const transaction = db.transaction(['documents'], 'readwrite');
      const store = transaction.objectStore('documents');

      return new Promise<void>((resolve, reject) => {
        const request = store.put(data, this.name);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Error saving to IndexedDB:', error);
    }
  }

  private async loadFromIndexedDB(): Promise<Uint8Array | null> {
    try {
      const db = await this.initIndexedDB();
      const transaction = db.transaction(['documents'], 'readonly');
      const store = transaction.objectStore('documents');
      const request = store.get(this.name);

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
  }

  /**
   * Get the last saved timestamp
   * @returns The last saved date or null if never saved
   */
  getLastSaved(): Date | null {
    return this.lastSaved;
  }

  /**
   * Manually save the document to IndexedDB
   */
  async save(): Promise<void> {
    const state = Y.encodeStateAsUpdate(this.document);
    await this.saveToIndexedDB(state);
    this.lastSaved = new Date();
  }

  /**
   * Destroy the provider and clean up resources
   */
  async destroy() {
    // Clear save timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Save final state before destroying
    if (this.enablePersistence && this.saveHandler) {
      const state = Y.encodeStateAsUpdate(this.document);
      await this.saveToIndexedDB(state);
    }

    // Remove event handlers
    if (this.updateHandler) {
      this.document.off('update', this.updateHandler);
    }
    if (this.saveHandler) {
      this.document.off('update', this.saveHandler);
    }

    // Close broadcast channel
    this.channel?.close();
    this.channel = null;
  }
}
