import { HocuspocusProvider } from '@hocuspocus/provider';
import { uuidv4 } from 'lib0/random';
import * as Y from 'yjs';
import { HocuspocusProviderWebsocket } from '@hocuspocus/provider';
import type {
  CompleteHocuspocusProviderWebsocketConfiguration,
  HocuspocusProviderConfiguration,
} from '@hocuspocus/provider';
import { AbstractType, YArrayEvent } from 'yjs';

// Type definitions
interface AdditionalTiptapCollabProviderWebsocketConfiguration {
  /**
   * A Hocuspocus Cloud App ID, get one here: https://cloud.tiptap.dev
   */
  appId?: string;
  /**
   * If you are using the on-premise version of TiptapCollab, put your baseUrl here (e.g. https://collab.yourdomain.com)
   */
  baseUrl?: string | string[];
  /**
   * Only fill this if you are using Tiptap Collab HA.
   */
  shardKey?: string;
}

type TiptapCollabProviderWebsocketConfiguration =
  Partial<CompleteHocuspocusProviderWebsocketConfiguration> &
    AdditionalTiptapCollabProviderWebsocketConfiguration;

interface TiptapCollabProviderWebsocketClusterConfiguration {
  /**
   * Timeout after which we fall over to the next server in no connection was successfully established
   */
  failOverIfNoConnectionAfterSeconds?: number;
}

type TCollabThread<Data = any, CommentData = any> = {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  resolvedAt?: string;
  comments: TCollabComment<CommentData>[];
  deletedComments: TCollabComment<CommentData>[];
  data: Data;
};

type TCollabComment<Data = any> = {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  data: Data;
  content: any;
};

type THistoryVersion = {
  name?: string;
  version: number;
  date: number;
};

type DeleteCommentOptions = {
  /**
   * If `true`, the thread will also be deleted if the deleted comment was the first comment in the thread.
   */
  deleteThread?: boolean;
  /**
   * If `true`, will remove the content of the deleted comment
   */
  deleteContent?: boolean;
};

type DeleteThreadOptions = {
  /**
   * If `true`, will remove the comments on the thread,
   * otherwise will only mark the thread as deleted
   * and keep the comments
   * @default false
   */
  deleteComments?: boolean;
  /**
   * If `true`, will forcefully remove the thread and all comments,
   * otherwise will only mark the thread as deleted
   * and keep the comments
   * @default false
   */
  force?: boolean;
};

/**
 * The type of thread
 */
type ThreadType = 'archived' | 'unarchived';

type GetThreadsOptions = {
  /**
   * The types of threads to get
   * @default ['unarchived']
   */
  types?: ThreadType[];
};

interface AdditionalTiptapCollabProviderConfiguration {
  /**
   * A Hocuspocus Cloud App ID, get one here: https://cloud.tiptap.dev
   */
  appId?: string;
  /**
   * If you are using the on-premise version of TiptapCollab, put your baseUrl here (e.g. https://collab.yourdomain.com)
   */
  baseUrl?: string;
  websocketProvider?: TiptapCollabProviderWebsocket;
  user?: string;
}

type TiptapCollabProviderConfiguration = Required<Pick<HocuspocusProviderConfiguration, 'name'>> &
  Partial<HocuspocusProviderConfiguration> &
  (
    | Required<Pick<AdditionalTiptapCollabProviderConfiguration, 'websocketProvider'>>
    | Required<Pick<AdditionalTiptapCollabProviderConfiguration, 'appId'>>
    | Required<Pick<AdditionalTiptapCollabProviderConfiguration, 'baseUrl'>>
  ) &
  Pick<AdditionalTiptapCollabProviderConfiguration, 'user'> & {
    /**
     * Pass `true` if you want to delete a thread when the first comment is deleted.
     */
    deleteThreadOnFirstCommentDelete?: boolean;
  };

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
  constructor(configuration: TiptapCollabProviderWebsocketConfiguration) {
    if (Array.isArray(configuration.baseUrl)) {
      throw new Error('TiptapCollabProviderWebsocket does not support multiple baseUrls');
    }

    let baseUrl: string =
      configuration.baseUrl ?? `wss://${configuration.appId}.collab.tiptap.cloud`;

    if (configuration.shardKey) {
      baseUrl += baseUrl.includes('?') ? '&' : '?';
      baseUrl += `shard=${configuration.shardKey}`;
    }

    super({
      ...configuration,
      url: baseUrl,
    });
  }

  /**
   * Create a cluster connection with failover support
   */
  static async createCluster(
    name: string,
    configuration: TiptapCollabProviderWebsocketConfiguration &
      TiptapCollabProviderWebsocketClusterConfiguration,
  ): Promise<TiptapCollabProviderWebsocket> {
    if (!Array.isArray(configuration.baseUrl)) {
      throw new Error('Cluster requires baseUrl to be an array of nodes');
    }

    let primaryNode = '';
    const alternativeNodes: string[] = [];
    let nodeIndex = 0;

    const baseUrls = Array.isArray(configuration.baseUrl)
      ? configuration.baseUrl
      : [configuration.baseUrl];

    // Find primary node
    while (primaryNode === '' && nodeIndex < baseUrls.length) {
      if (!baseUrls[nodeIndex]) {
        nodeIndex += 1;
        continue;
      }

      try {
        const nodeUrl = baseUrls[nodeIndex];
        if (!nodeUrl) {
          nodeIndex += 1;
          continue;
        }
        const httpUrl = nodeUrl.replace('ws://', 'http://').replace('wss://', 'https://');

        const appId = configuration.appId;
        if (!appId) {
          throw new Error('appId is required for cluster creation');
        }

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
      primaryNode = baseUrls[0] || '';
      if (!primaryNode) {
        throw new Error('No valid baseUrl provided');
      }
    }

    const failedNodes: string[] = [];
    let failoverInterval: NodeJS.Timeout | null = null;

    const provider = new TiptapCollabProviderWebsocket({
      ...configuration,
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
    }, (configuration.failOverIfNoConnectionAfterSeconds ?? 5) * 1000);

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
  tiptapCollabConfigurationPrefix: string = '__tiptapcollab__';
  userData?: Y.PermanentUserData;

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

  constructor(configuration: TiptapCollabProviderConfiguration) {
    const shouldManageSocket = !configuration.websocketProvider;

    if (!configuration.websocketProvider) {
      const wsConfig: TiptapCollabProviderWebsocketConfiguration = {
        appId: 'appId' in configuration ? configuration.appId : undefined,
        baseUrl: 'baseUrl' in configuration ? configuration.baseUrl : undefined,
      };
      configuration.websocketProvider = new TiptapCollabProviderWebsocket(wsConfig);
    }

    if (!configuration.token) {
      configuration.token = 'notoken';
    }

    super(configuration as any);

    if (shouldManageSocket) {
      this.manageSocket = true;
      this.attach();
    }

    if (configuration.user) {
      this.userData = new Y.PermanentUserData(
        this.document,
        this.document.getMap(`${this.tiptapCollabConfigurationPrefix}users`),
      );
      this.userData.setUserMapping(this.document, this.document.clientID, configuration.user);
    }
  }

  /**
   * Create a new version
   */
  createVersion(name?: string, force?: boolean): void {
    this.sendStateless(
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
  revertToVersion(targetVersion: number, fields?: string[]): void {
    this.sendStateless(
      JSON.stringify({
        action: 'document.revert',
        version: targetVersion,
        fields: fields || ['default'],
      }),
    );
  }

  /**
   * Preview a specific version
   * The server will reply with a stateless message (THistoryVersionPreviewEvent)
   */
  previewVersion(targetVersion: number): void {
    this.sendStateless(
      JSON.stringify({
        action: 'version.preview',
        version: targetVersion,
      }),
    );
  }

  /**
   * Get all versions
   */
  getVersions(): THistoryVersion[] {
    return this.document
      .getArray(`${this.tiptapCollabConfigurationPrefix}versions`)
      .toArray() as THistoryVersion[];
  }

  /**
   * Watch for version changes
   */
  watchVersions(
    callback: Parameters<AbstractType<YArrayEvent<THistoryVersion>>['observe']>[0],
  ): void {
    this.document.getArray('__tiptapcollab__versions').observe(callback as any);
  }

  /**
   * Unwatch version changes
   */
  unwatchVersions(
    callback: Parameters<AbstractType<YArrayEvent<THistoryVersion>>['unobserve']>[0],
  ): void {
    this.document.getArray('__tiptapcollab__versions').unobserve(callback as any);
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
  setAutoVersioningInterval(seconds: number): number {
    this.document
      .getMap(`${this.tiptapCollabConfigurationPrefix}config`)
      .set('intervalSeconds', seconds);
    return seconds;
  }

  /**
   * Enable auto versioning
   */
  enableAutoVersioning(): 1 {
    this.document.getMap(`${this.tiptapCollabConfigurationPrefix}config`).set('autoVersioning', 1);
    return 1;
  }

  /**
   * Disable auto versioning
   */
  disableAutoVersioning(): 0 {
    this.document.getMap(`${this.tiptapCollabConfigurationPrefix}config`).set('autoVersioning', 0);
    return 0;
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
   * Returns all users in the document as Y.Map objects
   * @returns An array of Y.Map objects
   */
  private getYThreads() {
    return this.document.getArray(`${this.tiptapCollabConfigurationPrefix}threads`);
  }

  /**
   * Finds all threads in the document and returns them as JSON objects
   * @options Options to control the output of the threads (e.g. include deleted threads)
   * @returns An array of threads as JSON objects
   */
  getThreads<Data = any, CommentData = any>(
    options?: GetThreadsOptions,
  ): TCollabThread<Data, CommentData>[] {
    const mergedTypes = { ...defaultThreadOptions, ...options };
    const types: ThreadType[] = (
      mergedTypes.types ? [...mergedTypes.types] : ['unarchived']
    ) as ThreadType[];
    const threads = this.getYThreads().toJSON() as TCollabThread<Data, CommentData>[];

    const hasArchived = types.includes('archived');
    const hasUnarchived = types.includes('unarchived');

    if (hasArchived && hasUnarchived) {
      return threads;
    }

    return threads.filter((thread) => {
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
   * Find the index of a thread by its id
   * @param id The thread id
   * @returns The index of the thread or null if not found
   */
  private getThreadIndex(id: string): number | null {
    let index = null;
    let currentIndex = 0;

    for (const thread of this.getThreads({ types: ['archived', 'unarchived'] })) {
      if (thread.id === id) {
        index = currentIndex;
        break;
      }
      currentIndex += 1;
    }

    return index;
  }

  /**
   * Gets a single thread by its id
   * @param id The thread id
   * @returns The thread as a JSON object or null if not found
   */
  getThread<Data = any, CommentData = any>(id: string): TCollabThread<Data, CommentData> | null {
    const index = this.getThreadIndex(id);
    if (index === null) {
      return null;
    }
    const yThread = this.getYThreads().get(index) as Y.Map<unknown> | undefined;
    return yThread ? (yThread.toJSON() as TCollabThread<Data, CommentData>) : null;
  }

  /**
   * Gets a single thread by its id as a Y.Map object
   * @param id The thread id
   * @returns The thread as a Y.Map object or null if not found
   */
  private getYThread(id: string): Y.Map<unknown> | null {
    const index = this.getThreadIndex(id);
    if (index === null) {
      return null;
    }
    const yThread = this.getYThreads().get(index);
    return yThread as Y.Map<unknown> | null;
  }

  /**
   * Create a new thread
   * @param data The thread data
   * @returns The created thread
   */
  createThread<Data = any, CommentData = any>(
    data: Omit<
      TCollabThread<Data, CommentData>,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'comments' | 'deletedComments'
    >,
  ): TCollabThread<Data, CommentData> {
    let result: TCollabThread<Data, CommentData> = {} as TCollabThread<Data, CommentData>;

    this.document.transact(() => {
      const thread = new Y.Map();
      thread.set('id', uuidv4());
      thread.set('createdAt', new Date().toISOString());
      thread.set('comments', new Y.Array());
      thread.set('deletedComments', new Y.Array());
      thread.set('deletedAt', null);

      this.getYThreads().push([thread]);
      result = this.updateThread(String(thread.get('id')), data) as TCollabThread<
        Data,
        CommentData
      >;
    });

    return result;
  }

  /**
   * Update a specific thread
   * @param id The thread id
   * @param data New data for the thread
   * @returns The updated thread or null if the thread is not found
   */
  updateThread<Data = any, CommentData = any>(
    id: TCollabThread<Data, CommentData>['id'],
    data: Partial<
      Pick<TCollabThread<Data, CommentData>, 'data'> & {
        resolvedAt: TCollabThread<Data, CommentData>['resolvedAt'] | null;
      }
    >,
  ): TCollabThread<Data, CommentData> {
    let result: TCollabThread<Data, CommentData> = {} as TCollabThread<Data, CommentData>;

    this.document.transact(() => {
      const thread = this.getYThread(id);
      if (thread === null) {
        throw new Error(`Thread with id ${id} not found`);
      }

      thread.set('updatedAt', new Date().toISOString());

      if (data.data) {
        thread.set('data', data.data);
      }

      if (data.resolvedAt !== undefined || data.resolvedAt === null) {
        thread.set('resolvedAt', data.resolvedAt);
      }

      result = thread.toJSON() as TCollabThread<Data, CommentData>;
    });

    return result;
  }

  /**
   * Handle the deletion of a thread. By default, the thread and it's comments are not deleted, but marked as deleted
   * via the `deletedAt` property. Forceful deletion can be enabled by setting the `force` option to `true`.
   *
   * If you only want to delete the comments of a thread, you can set the `deleteComments` option to `true`.
   * @param id The thread id
   * @param options A set of options that control how the thread is deleted
   * @returns The deleted thread or null if the thread is not found
   */
  deleteThread<Data = any, CommentData = any>(
    id: TCollabThread<Data, CommentData>['id'],
    options?: DeleteThreadOptions,
  ): TCollabThread<Data, CommentData> | null | undefined {
    const { deleteComments = false, force = false } = {
      ...defaultDeleteThreadOptions,
      ...options,
    };

    const index = this.getThreadIndex(id);
    if (index === null) {
      return null;
    }

    if (force) {
      this.getYThreads().delete(index, 1);
      return undefined;
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

    return thread.toJSON() as TCollabThread<Data, CommentData>;
  }

  /**
   * Tries to restore a deleted thread
   * @param id The thread id
   * @returns The restored thread or null if the thread is not found
   */
  restoreThread<Data = any, CommentData = any>(
    id: TCollabThread<Data, CommentData>['id'],
  ): TCollabThread<Data, CommentData> | null {
    const index = this.getThreadIndex(id);
    if (index === null) {
      return null;
    }

    const thread = this.getYThreads().get(index) as Y.Map<unknown> | undefined;
    if (!thread) {
      return null;
    }

    thread.set('deletedAt', null);

    return thread.toJSON() as TCollabThread<Data, CommentData>;
  }

  /**
   * Returns comments from a thread, either deleted or not
   * @param threadId The thread id
   * @param includeDeleted If you want to include deleted comments, defaults to `false`
   * @returns The comments or null if the thread is not found
   */
  getThreadComments<CommentData = any>(
    threadId: TCollabThread<any, CommentData>['id'],
    includeDeleted?: boolean,
  ): TCollabComment<CommentData>[] | null {
    if (this.getThreadIndex(threadId) === null) {
      return null;
    }

    const thread = this.getThread(threadId);

    if (includeDeleted) {
      const allComments = [...(thread?.comments || []), ...(thread?.deletedComments || [])].sort(
        (a, b) => a.createdAt.localeCompare(b.createdAt),
      );
      return allComments as TCollabComment<CommentData>[];
    }

    return (thread?.comments || []) as TCollabComment<CommentData>[];
  }

  /**
   * Get a single comment from a specific thread
   * @param threadId The thread id
   * @param commentId The comment id
   * @param includeDeleted If you want to include deleted comments in the search
   * @returns The comment or null if not found
   */
  getThreadComment<CommentData = any>(
    threadId: TCollabThread<any, CommentData>['id'],
    commentId: TCollabComment<CommentData>['id'],
    includeDeleted?: boolean,
  ): TCollabComment<CommentData> | null {
    if (this.getThreadIndex(threadId) === null) {
      return null;
    }

    const comments = this.getThreadComments(threadId, includeDeleted);
    return comments?.find((comment) => comment.id === commentId) ?? null;
  }

  /**
   * Adds a comment to a thread
   * @param threadId The thread id
   * @param data The comment data
   * @returns The updated thread or null if the thread is not found
   * @example addComment('123', { content: 'Hello world', data: { author: 'Maria Doe' } })
   */
  addComment<Data = any, CommentData = any>(
    threadId: TCollabThread<Data, CommentData>['id'],
    data: Omit<TCollabComment<CommentData>, 'id' | 'updatedAt' | 'createdAt'>,
  ): TCollabThread<Data, CommentData> {
    let result: TCollabThread<Data, CommentData> = {} as TCollabThread<Data, CommentData>;

    this.document.transact(() => {
      const thread = this.getYThread(threadId);
      if (thread === null) {
        throw new Error(`Thread with id ${threadId} not found`);
      }

      const comment = new Y.Map<unknown>();
      comment.set('id', uuidv4());
      comment.set('createdAt', new Date().toISOString());
      const comments = thread.get('comments') as Y.Array<Y.Map<unknown>> | undefined;
      if (comments) {
        comments.push([comment]);
      }

      this.updateComment(threadId, String(comment.get('id')), data);
      result = thread.toJSON() as TCollabThread<Data, CommentData>;
    });

    return result;
  }

  /**
   * Update a comment in a thread
   * @param threadId The thread id
   * @param commentId The comment id
   * @param data The new comment data
   * @returns The updated thread or null if the thread or comment is not found
   * @example updateComment('123', { content: 'The new content', data: { attachments: ['file1.jpg'] }})
   */
  updateComment<Data = any, CommentData = any>(
    threadId: TCollabThread<Data, CommentData>['id'],
    commentId: TCollabComment<CommentData>['id'],
    data: Partial<Pick<TCollabComment<CommentData>, 'data' | 'content'>>,
  ): TCollabThread<Data, CommentData> {
    let result: TCollabThread<Data, CommentData> = {} as TCollabThread<Data, CommentData>;

    this.document.transact(() => {
      const thread = this.getYThread(threadId);
      if (thread === null) {
        throw new Error(`Thread with id ${threadId} not found`);
      }

      const comments = thread.get('comments') as Y.Array<Y.Map<unknown>> | undefined;
      if (!comments) {
        throw new Error(`Comments array not found for thread ${threadId}`);
      }

      let comment: Y.Map<unknown> | null = null;
      for (const c of comments) {
        if (c.get('id') === commentId) {
          comment = c;
          break;
        }
      }

      if (comment === null) {
        throw new Error(`Comment with id ${commentId} not found in thread ${threadId}`);
      }

      comment.set('updatedAt', new Date().toISOString());

      if (data.data) {
        comment.set('data', data.data);
      }

      if (data.content) {
        comment.set('content', data.content);
      }

      result = thread.toJSON() as TCollabThread<Data, CommentData>;
    });

    return result;
  }

  /**
   * Deletes a comment from a thread
   * @param threadId The thread id
   * @param commentId The comment id
   * @param options A set of options that control how the comment is deleted
   * @returns The updated thread or null if the thread or comment is not found
   */
  deleteComment<Data = any, CommentData = any>(
    threadId: TCollabThread<Data, CommentData>['id'],
    commentId: TCollabComment<CommentData>['id'],
    options: DeleteCommentOptions,
  ): TCollabThread<Data, CommentData> | null | undefined {
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
      return undefined;
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

    return thread.toJSON() as TCollabThread<Data, CommentData>;
  }

  /**
   * Start watching threads for changes
   * @param callback The callback function to be called when a thread changes
   */
  watchThreads(callback: () => void): void {
    this.getYThreads().observeDeep(callback);
  }

  /**
   * Stop watching threads for changes
   * @param callback The callback function to be removed
   */
  unwatchThreads(callback: () => void): void {
    this.getYThreads().unobserveDeep(callback);
  }

  /**
   * Acquire a lock
   */
  acquireLock(key: string, timeoutInMilliseconds: number): Promise<boolean> {
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
          timeout: timeoutInMilliseconds,
        }),
      );
    });
  }

  /**
   * Release a lock
   */
  releaseLock(key: string): Promise<void> {
    this.sendStateless(
      JSON.stringify({
        action: 'mutex.release',
        key,
      }),
    );
    return Promise.resolve();
  }
}

// Re-export from @hocuspocus/provider
export * from '@hocuspocus/provider';

// Export default
export default TiptapCollabProvider;
