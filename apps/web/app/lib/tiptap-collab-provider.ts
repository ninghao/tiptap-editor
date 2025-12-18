import { HocuspocusProvider } from '@hocuspocus/provider';
import { uuidv4 } from 'lib0/random';
import * as Y from 'yjs';
import { HocuspocusProviderWebsocket } from '@hocuspocus/provider';

/**
 * WebSocket connection status enum
 */
export enum WebSocketStatus {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
}

/**
 * TiptapCollabProviderWebsocket
 * Custom WebSocket provider for Tiptap Collaboration
 */
export class TiptapCollabProviderWebsocket extends HocuspocusProviderWebsocket {
  constructor(options: any) {
    if (Array.isArray(options.baseUrl)) {
      throw new Error('TiptapCollabProviderWebsocket does not support multiple baseUrls');
    }

    let baseUrl: string = options.baseUrl ?? `wss://${options.appId}.collab.tiptap.cloud`;

    if (options.shardKey) {
      baseUrl += baseUrl.includes('?') ? '&' : '?';
      baseUrl += `shard=${options.shardKey}`;
    }

    super({
      ...options,
      url: baseUrl,
    });
  }

  /**
   * Create a cluster connection with failover support
   */
  static async createCluster(
    appId: string,
    options: {
      baseUrl: string[];
      failOverIfNoConnectionAfterSeconds?: number;
      [key: string]: any;
    },
  ): Promise<TiptapCollabProviderWebsocket> {
    if (!Array.isArray(options.baseUrl)) {
      throw new Error('Cluster requires baseUrl to be an array of nodes');
    }

    let primaryNode = '';
    const alternativeNodes: string[] = [];
    let nodeIndex = 0;

    // Find primary node
    while (primaryNode === '' && nodeIndex < options.baseUrl.length) {
      if (!options.baseUrl[nodeIndex]) {
        nodeIndex += 1;
        continue;
      }

      try {
        const nodeUrl = options.baseUrl[nodeIndex];
        if (!nodeUrl) {
          nodeIndex += 1;
          continue;
        }
        const httpUrl = nodeUrl.replace('ws://', 'http://').replace('wss://', 'https://');

        const response = await fetch(`${httpUrl}/publicapi/cluster/node/${appId}`);

        if (response.ok) {
          const data = await response.json();
          primaryNode = data.primaryNode;
          alternativeNodes.push(...data.alternativeNodes);
        } else {
          console.error(response.status);
          console.error(await response.text());
        }
      } catch (error) {
        // Continue to next node
      }

      nodeIndex += 1;
    }

    if (primaryNode === '') {
      primaryNode = options.baseUrl[0] || '';
      if (!primaryNode) {
        throw new Error('No valid baseUrl provided');
      }
    }

    const failedNodes: string[] = [];
    let failoverInterval: NodeJS.Timeout | null = null;

    const provider = new TiptapCollabProviderWebsocket({
      ...options,
      baseUrl: primaryNode,
      onDestroy() {
        if (failoverInterval) {
          clearInterval(failoverInterval);
        }
      },
    });

    failoverInterval = setInterval(() => {
      if (provider.status !== 'connected') {
        provider.disconnect();
        failedNodes.push(provider.configuration.url);

        const nextNode = alternativeNodes.find((node) => !failedNodes.includes(node));

        if (!nextNode) {
          console.error('all nodes appear dead, retrying all.');
          failedNodes.splice(0, failedNodes.length);
          return;
        }

        console.log(`Primary node went down, switching to ${nextNode}`);
        provider.configuration.url = nextNode;
        provider.shouldConnect = true;
        provider.connect();
      } else {
        failedNodes.splice(0, failedNodes.length);
      }
    }, (options.failOverIfNoConnectionAfterSeconds ?? 5) * 1000);

    return provider;
  }
}

const defaultDeleteOptions = {
  deleteContent: false,
  deleteThread: false,
};

const defaultThreadOptions = {
  types: ['unarchived'] as const,
};

const defaultDeleteThreadOptions = {
  deleteComments: false,
  force: false,
};

/**
 * TiptapCollabProvider
 * Main provider class for Tiptap Collaboration
 */
export class TiptapCollabProvider extends HocuspocusProvider {
  private tiptapCollabConfigurationPrefix = '__tiptapcollab__';
  private userData?: Y.PermanentUserData;

  // Expose configuration property from parent class
  declare configuration: any;

  // Expose methods from parent class for TypeScript
  declare on: (event: string, fn: Function) => this;
  declare off: (event: string, fn?: Function) => this;
  declare sendStateless: (payload: string) => void;

  // Get document from parent class
  override get document(): Y.Doc {
    return super.document;
  }

  constructor(options: any) {
    const shouldManageSocket = !options.websocketProvider;

    if (!options.websocketProvider) {
      options.websocketProvider = new TiptapCollabProviderWebsocket({
        appId: options.appId,
        baseUrl: options.baseUrl,
      });
    }

    if (!options.token) {
      options.token = 'notoken';
    }

    super(options);

    if (shouldManageSocket) {
      this.manageSocket = true;
      this.attach();
    }

    if (options.user) {
      this.userData = new Y.PermanentUserData(
        this.document,
        this.document.getMap(`${this.tiptapCollabConfigurationPrefix}users`),
      );
      this.userData.setUserMapping(this.document, this.document.clientID, options.user);
    }
  }

  /**
   * Create a new version
   */
  createVersion(name: string, force: boolean = false) {
    return this.sendStateless(
      JSON.stringify({
        action: 'version.create',
        name,
        force,
      }),
    );
  }

  /**
   * Revert document to a specific version
   */
  revertToVersion(version: string, fields: string[] = ['default']) {
    return this.sendStateless(
      JSON.stringify({
        action: 'document.revert',
        version,
        fields,
      }),
    );
  }

  /**
   * Preview a specific version
   */
  previewVersion(version: string) {
    return this.sendStateless(
      JSON.stringify({
        action: 'version.preview',
        version,
      }),
    );
  }

  /**
   * Get all versions
   */
  getVersions() {
    return this.document.getArray(`${this.tiptapCollabConfigurationPrefix}versions`).toArray();
  }

  /**
   * Watch for version changes
   */
  watchVersions(callback: (event: any) => void) {
    return this.document.getArray('__tiptapcollab__versions').observe(callback);
  }

  /**
   * Unwatch version changes
   */
  unwatchVersions(callback: (event: any) => void) {
    return this.document.getArray('__tiptapcollab__versions').unobserve(callback);
  }

  /**
   * Check if auto versioning is enabled
   */
  isAutoVersioning(): boolean {
    return !!this.document
      .getMap(`${this.tiptapCollabConfigurationPrefix}config`)
      .get('autoVersioning');
  }

  /**
   * Set auto versioning interval
   */
  setAutoVersioningInterval(intervalSeconds: number) {
    return this.document
      .getMap(`${this.tiptapCollabConfigurationPrefix}config`)
      .set('intervalSeconds', intervalSeconds);
  }

  /**
   * Enable auto versioning
   */
  enableAutoVersioning() {
    return this.document
      .getMap(`${this.tiptapCollabConfigurationPrefix}config`)
      .set('autoVersioning', 1);
  }

  /**
   * Disable auto versioning
   */
  disableAutoVersioning() {
    return this.document
      .getMap(`${this.tiptapCollabConfigurationPrefix}config`)
      .set('autoVersioning', 0);
  }

  /**
   * Get last saved timestamp
   */
  getLastSaved(): Date | null {
    const timestamp = this.document
      .getMap(`${this.tiptapCollabConfigurationPrefix}config`)
      .get('lastSaved');

    if (!timestamp || (typeof timestamp !== 'string' && typeof timestamp !== 'number')) {
      return null;
    }

    return new Date(timestamp);
  }

  /**
   * Get Yjs threads array
   */
  getYThreads() {
    return this.document.getArray(`${this.tiptapCollabConfigurationPrefix}threads`);
  }

  /**
   * Get threads
   */
  getThreads(options: { types?: ('archived' | 'unarchived')[] } = {}) {
    const mergedTypes = { ...defaultThreadOptions, ...options };
    const types: ('archived' | 'unarchived')[] = (
      mergedTypes.types ? [...mergedTypes.types] : ['unarchived']
    ) as ('archived' | 'unarchived')[];
    const threads = this.getYThreads().toJSON();

    const hasArchived = (types as string[]).includes('archived');
    const hasUnarchived = (types as string[]).includes('unarchived');

    if (hasArchived && hasUnarchived) {
      return threads;
    }

    return threads.filter((thread: any) => {
      if (hasArchived && thread.deletedAt) {
        return true;
      }
      if (hasUnarchived && !thread.deletedAt) {
        return true;
      }
      return false;
    });
  }

  /**
   * Get thread index by ID
   */
  getThreadIndex(threadId: string): number | null {
    let index = null;
    let currentIndex = 0;

    for (const thread of this.getThreads({ types: ['archived', 'unarchived'] })) {
      if (thread.id === threadId) {
        index = currentIndex;
        break;
      }
      currentIndex += 1;
    }

    return index;
  }

  /**
   * Get thread by ID
   */
  getThread(threadId: string) {
    const index = this.getThreadIndex(threadId);
    if (index === null) {
      return null;
    }
    const yThread = this.getYThreads().get(index) as Y.Map<unknown> | undefined;
    return yThread ? (yThread.toJSON() as any) : null;
  }

  /**
   * Get Yjs thread by ID
   */
  getYThread(threadId: string): Y.Map<unknown> | null {
    const index = this.getThreadIndex(threadId);
    if (index === null) {
      return null;
    }
    const yThread = this.getYThreads().get(index);
    return yThread as Y.Map<unknown> | null;
  }

  /**
   * Create a new thread
   */
  createThread(data: any) {
    let result: any = {};

    this.document.transact(() => {
      const thread = new Y.Map();
      thread.set('id', uuidv4());
      thread.set('createdAt', new Date().toISOString());
      thread.set('comments', new Y.Array());
      thread.set('deletedComments', new Y.Array());
      thread.set('deletedAt', null);

      this.getYThreads().push([thread]);
      result = this.updateThread(String(thread.get('id')), data);
    });

    return result;
  }

  /**
   * Update a thread
   */
  updateThread(threadId: string, data: any) {
    let result: any = {};

    this.document.transact(() => {
      const thread = this.getYThread(threadId);
      if (thread === null) {
        return null;
      }

      thread.set('updatedAt', new Date().toISOString());

      if (data.data) {
        thread.set('data', data.data);
      }

      if (data.resolvedAt !== undefined || data.resolvedAt === null) {
        thread.set('resolvedAt', data.resolvedAt);
      }

      result = thread.toJSON();
    });

    return result;
  }

  /**
   * Delete a thread
   */
  deleteThread(threadId: string, options: { deleteComments?: boolean; force?: boolean } = {}) {
    const { deleteComments = false, force = false } = {
      ...defaultDeleteThreadOptions,
      ...options,
    };

    const index = this.getThreadIndex(threadId);
    if (index === null) {
      return null;
    }

    if (force) {
      this.getYThreads().delete(index, 1);
      return;
    }

    const thread = this.getYThreads().get(index) as Y.Map<unknown> | undefined;
    if (!thread) {
      return null;
    }

    thread.set('deletedAt', new Date().toISOString());

    if (deleteComments) {
      thread.set('comments', new Y.Array());
      thread.set('deletedComments', new Y.Array());
    }

    return thread.toJSON();
  }

  /**
   * Restore a deleted thread
   */
  restoreThread(threadId: string) {
    const index = this.getThreadIndex(threadId);
    if (index === null) {
      return null;
    }

    const thread = this.getYThreads().get(index) as Y.Map<unknown> | undefined;
    if (!thread) {
      return null;
    }

    thread.set('deletedAt', null);

    return thread.toJSON();
  }

  /**
   * Get thread comments
   */
  getThreadComments(threadId: string, includeDeleted: boolean = false) {
    if (this.getThreadIndex(threadId) === null) {
      return null;
    }

    const thread = this.getThread(threadId);

    if (includeDeleted) {
      const allComments = [...(thread?.comments || []), ...(thread?.deletedComments || [])].sort(
        (a: any, b: any) => a.createdAt.localeCompare(b.createdAt),
      );
      return allComments;
    }

    return thread?.comments || [];
  }

  /**
   * Get a specific comment from a thread
   */
  getThreadComment(threadId: string, commentId: string, includeDeleted: boolean = false) {
    if (this.getThreadIndex(threadId) === null) {
      return null;
    }

    const comments = this.getThreadComments(threadId, includeDeleted);
    return comments?.find((comment: any) => comment.id === commentId) ?? null;
  }

  /**
   * Add a comment to a thread
   */
  addComment(threadId: string, data: any) {
    let result: any = {};

    this.document.transact(() => {
      const thread = this.getYThread(threadId);
      if (thread === null) {
        return null;
      }

      const comment = new Y.Map<unknown>();
      comment.set('id', uuidv4());
      comment.set('createdAt', new Date().toISOString());
      const comments = thread.get('comments') as Y.Array<Y.Map<unknown>> | undefined;
      if (comments) {
        comments.push([comment]);
      }

      this.updateComment(threadId, String(comment.get('id')), data);
      result = thread.toJSON();
    });

    return result;
  }

  /**
   * Update a comment
   */
  updateComment(threadId: string, commentId: string, data: any) {
    let result: any = {};

    this.document.transact(() => {
      const thread = this.getYThread(threadId);
      if (thread === null) {
        return null;
      }

      const comments = thread.get('comments') as Y.Array<Y.Map<unknown>> | undefined;
      if (!comments) {
        return null;
      }

      let comment: Y.Map<unknown> | null = null;
      for (const c of comments) {
        if (c.get('id') === commentId) {
          comment = c;
          break;
        }
      }

      if (comment === null) {
        return null;
      }

      comment.set('updatedAt', new Date().toISOString());

      if (data.data) {
        comment.set('data', data.data);
      }

      if (data.content) {
        comment.set('content', data.content);
      }

      result = thread.toJSON();
    });

    return result;
  }

  /**
   * Delete a comment
   */
  deleteComment(
    threadId: string,
    commentId: string,
    options: { deleteContent?: boolean; deleteThread?: boolean } = {},
  ) {
    const { deleteContent = false, deleteThread = false } = {
      ...defaultDeleteOptions,
      ...options,
    };

    const thread = this.getYThread(threadId);
    if (thread === null) {
      return null;
    }

    const comments = thread.get('comments') as Y.Array<Y.Map<unknown>> | undefined;
    if (!comments) {
      return null;
    }

    let commentIndex = 0;
    for (const comment of comments) {
      if (comment.get('id') === commentId) {
        break;
      }
      commentIndex += 1;
    }

    if (commentIndex === 0 && deleteThread) {
      this.deleteThread(threadId);
      return;
    }

    const comment = comments.get(commentIndex);
    if (!comment) {
      return null;
    }

    const deletedComment = new Y.Map<unknown>();
    deletedComment.set('id', comment.get('id'));
    deletedComment.set('createdAt', comment.get('createdAt'));
    deletedComment.set('updatedAt', new Date().toISOString());
    deletedComment.set('deletedAt', new Date().toISOString());
    deletedComment.set('data', comment.get('data'));
    deletedComment.set('content', deleteContent ? null : comment.get('content'));

    const deletedComments = thread.get('deletedComments') as Y.Array<Y.Map<unknown>> | undefined;
    if (deletedComments) {
      deletedComments.push([deletedComment]);
    }
    comments.delete(commentIndex);

    return thread.toJSON();
  }

  /**
   * Watch for thread changes
   */
  watchThreads(callback: (event: any) => void) {
    this.getYThreads().observeDeep(callback);
  }

  /**
   * Unwatch thread changes
   */
  unwatchThreads(callback: (event: any) => void) {
    this.getYThreads().unobserveDeep(callback);
  }

  /**
   * Acquire a lock
   */
  async acquireLock(key: string, timeout?: number): Promise<boolean> {
    return new Promise((resolve) => {
      const handler = (event: any) => {
        const payload = JSON.parse(event.payload);
        const eventParts = payload.event?.split('.') || [];

        if (eventParts.length && eventParts[0] === 'mutex') {
          this.off('stateless', handler);
          resolve(payload.event === 'mutex.granted');
        }
      };

      this.on('stateless', handler);
      this.sendStateless(
        JSON.stringify({
          action: 'mutex.request',
          key,
          timeout,
        }),
      );
    });
  }

  /**
   * Release a lock
   */
  async releaseLock(key: string) {
    this.sendStateless(
      JSON.stringify({
        action: 'mutex.release',
        key,
      }),
    );
  }
}

// Re-export from @hocuspocus/provider
export * from '@hocuspocus/provider';

// Export default
export default TiptapCollabProvider;
