import * as Y from 'yjs';

export interface BroadcastChannelProviderOptions {
  name: string;
  document: Y.Doc;
}

/**
 * BroadcastChannel Provider for Yjs
 *
 * A provider that uses the BroadcastChannel API to synchronize Yjs documents
 * across different tabs/windows in the same browser.
 *
 * @example
 * ```ts
 * const doc = new Y.Doc();
 * const provider = new BroadcastChannelProvider({
 *   name: 'my-document',
 *   document: doc,
 * });
 * ```
 */
export class BroadcastChannelProvider {
  private channel: BroadcastChannel | null = null;
  private document: Y.Doc;
  private name: string;
  private updateHandler?: (update: Uint8Array, origin: any) => void;

  constructor(options: BroadcastChannelProviderOptions) {
    this.name = options.name;
    this.document = options.document;

    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      this.init();
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

  /**
   * Destroy the provider and clean up resources
   */
  destroy() {
    if (this.updateHandler) {
      this.document.off('update', this.updateHandler);
    }
    this.channel?.close();
    this.channel = null;
  }
}
