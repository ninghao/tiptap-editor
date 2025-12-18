import { Extension } from '@tiptap/core';
import { TiptapCollabProvider, WebSocketStatus } from '~/lib/tiptap-collab-provider';
import { TiptapTransformer } from '@hocuspocus/transformer';
import * as Y from 'yjs';

/**
 * Snapshot version information
 */
export interface SnapshotVersion {
  version: number;
  name?: string;
  date?: number;
}

/**
 * Snapshot extension storage
 */
export interface SnapshotStorage {
  provider: TiptapCollabProvider | null;
  status: WebSocketStatus;
  synced: boolean;
  latestVersion: number;
  currentVersion: number;
  lastSaved: Date | null;
  versions: SnapshotVersion[];
  versioningEnabled: boolean;
}

/**
 * Snapshot update payload
 */
export interface SnapshotUpdatePayload {
  versions: SnapshotVersion[];
  version: number;
  currentVersion: number;
  versioningEnabled: boolean;
}

/**
 * Snapshot extension options
 */
export interface SnapshotOptions {
  provider: TiptapCollabProvider | null;
  onUpdate?: (payload: SnapshotUpdatePayload) => void;
}

/**
 * Stateless event from TiptapCollabProvider
 */
interface StatelessEvent {
  payload: string;
}

/**
 * Snapshot Extension for Tiptap
 *
 * This extension provides version control and snapshot functionality for collaborative editing.
 * It allows users to save versions, revert to previous versions, and preview version content.
 */
export const Snapshot = Extension.create<SnapshotOptions>({
  name: 'snapshot',
  priority: 1000,

  addOptions() {
    return {
      provider: null,
      onUpdate: undefined,
    };
  },

  addStorage() {
    return {
      provider: null,
      status: WebSocketStatus.Disconnected,
      synced: false,
      latestVersion: 0,
      currentVersion: 0,
      lastSaved: null,
      versions: [],
      versioningEnabled: false,
    };
  },

  onCreate() {
    const isTiptapCollabProvider =
      this.options.provider instanceof TiptapCollabProvider ||
      (this.options.provider as any)?.tiptapCollabConfigurationPrefix;

    if (!this.options.provider || !isTiptapCollabProvider) {
      console.warn(
        `Notice: The Snapshot Extension is a paid feature of Tiptap Collaboration and is not supported with the Hocuspocus provider as part of our open-source offerings. To access and utilize the Snapshot Extension, please ensure you have an active Team, Growth, or Enterprise subscription and you are using it in conjunction with the Collaboration Cloud or On Premises images. For more information on our subscription plans and how to upgrade, please visit our Subscription Page: https://tiptap.dev/pricing
Thank you for understanding and supporting our efforts to provide high - quality, sustainable software.`,
      );
      return;
    }

    // Initialize versions from provider
    this.storage.versions =
      this.options.provider.document.getArray('__tiptapcollab__versions').toArray() || [];

    // Initialize versioning enabled state
    this.storage.versioningEnabled = !!this.options.provider.document
      .getMap('__tiptapcollab__config')
      .get('autoVersioning');

    // Initialize current version
    this.storage.currentVersion =
      this.options.provider.document.getMap('__tiptapcollab__config').get('currentVersion') || 0;

    // Calculate latest version
    this.storage.latestVersion = Math.max(0, this.storage.versions.length - 1);

    // Trigger initial update callback
    if (this.options.onUpdate) {
      this.options.onUpdate({
        versions: this.storage.versions,
        version: this.storage.latestVersion,
        currentVersion: this.storage.currentVersion,
        versioningEnabled: this.storage.versioningEnabled,
      });
    }

    // Listen to stateless events
    this.options.provider.on('stateless', (event: StatelessEvent) => {
      const payload = JSON.parse(event.payload);

      switch (payload.event) {
        case 'saved':
          this.storage.lastSaved = new Date();
          break;
        case 'version.created':
          this.storage.latestVersion = payload.version;
          this.storage.currentVersion = payload.version;
          break;
        case 'document.reverted':
          this.storage.currentVersion = payload.version;
          break;
        default:
          break;
      }

      if (this.options.onUpdate) {
        this.options.onUpdate({
          versions: this.storage.versions,
          version: this.storage.latestVersion,
          currentVersion: this.storage.currentVersion,
          versioningEnabled: this.storage.versioningEnabled,
        });
      }
    });

    // Listen to synced events
    this.options.provider.on('synced', () => {
      this.storage.versions =
        this.options.provider!.document.getArray('__tiptapcollab__versions').toArray() || [];

      this.storage.versioningEnabled = !!this.options
        .provider!.document.getMap('__tiptapcollab__config')
        .get('autoVersioning');

      this.storage.latestVersion = Math.max(0, this.storage.versions.length - 1);

      if (this.options.onUpdate) {
        this.options.onUpdate({
          versions: this.storage.versions,
          version: this.storage.latestVersion,
          currentVersion: this.storage.currentVersion,
          versioningEnabled: this.storage.versioningEnabled,
        });
      }
    });

    // Observe versions array changes
    this.options.provider.document.getArray('__tiptapcollab__versions').observe(() => {
      this.storage.versions =
        this.options.provider!.document.getArray('__tiptapcollab__versions').toArray() || [];

      if (this.options.onUpdate) {
        this.options.onUpdate({
          versions: this.storage.versions,
          version: this.storage.latestVersion,
          currentVersion: this.storage.currentVersion,
          versioningEnabled: this.storage.versioningEnabled,
        });
      }
    });

    // Observe config map changes
    this.options.provider.document.getMap('__tiptapcollab__config').observe(() => {
      this.storage.versioningEnabled = !!this.options
        .provider!.document.getMap('__tiptapcollab__config')
        .get('autoVersioning');

      this.storage.currentVersion =
        this.options.provider!.document.getMap('__tiptapcollab__config').get('currentVersion') || 0;

      if (this.options.onUpdate) {
        this.options.onUpdate({
          versions: this.storage.versions,
          version: this.storage.latestVersion,
          currentVersion: this.storage.currentVersion,
          versioningEnabled: this.storage.versioningEnabled,
        });
      }
    });
  },

  addCommands() {
    return {
      /**
       * Revert the document to a specific version
       *
       * @param version - The version number to revert to
       * @param newVersionName - Optional name for the new version created after revert
       * @param currentVersionName - Optional name for the current version before revert
       */
      revertToVersion:
        (version: number, newVersionName?: string, currentVersionName?: string) => () => {
          if (!this.options.provider) {
            return false;
          }

          this.options.provider.sendStateless(
            JSON.stringify({
              action: 'document.revert',
              version,
              currentVersionName: currentVersionName || `Before revert to version ${version}`,
              newVersionName: newVersionName || `Revert to version ${version}`,
            }),
          );

          return true;
        },

      /**
       * Toggle automatic versioning on/off
       */
      toggleVersioning: () => () => {
        if (!this.options.provider) {
          return false;
        }

        this.options.provider.document
          .getMap('__tiptapcollab__config')
          .set('autoVersioning', this.storage.versioningEnabled ? 0 : 1);

        return true;
      },

      /**
       * Save a new version with an optional name
       *
       * @param name - Optional name for the version
       */
      saveVersion: (name?: string) => () => {
        if (!this.options.provider) {
          return false;
        }

        this.options.provider.sendStateless(
          JSON.stringify({
            action: 'version.create',
            name,
          }),
        );

        return true;
      },
    };
  },
});

/**
 * Get preview content from a version payload
 *
 * @param payload - The stateless event payload string
 * @param fieldName - The field name to use for transformation (default: "default")
 * @returns The Tiptap document content or undefined if not a version preview event
 */
export function getPreviewContentFromVersionPayload(
  payload: string,
  fieldName: string = 'default',
) {
  const parsed = JSON.parse(payload);

  if (parsed.event !== 'version.preview') {
    return;
  }

  const doc = new Y.Doc();
  const binary = Uint8Array.from(atob(parsed.ydoc), (c) => c.charCodeAt(0));

  Y.applyUpdate(doc, binary);

  return TiptapTransformer.fromYdoc(doc, fieldName);
}

/**
 * Watch for preview content from version preview events
 *
 * @param provider - The TiptapCollabProvider instance
 * @param callback - Callback function that receives the preview content
 * @param fieldName - The field name to use for transformation (default: "default")
 * @returns A cleanup function to stop watching
 */
export function watchPreviewContent(
  provider: TiptapCollabProvider,
  callback: (content: any) => void,
  fieldName: string = 'default',
): () => void {
  const handler = (event: StatelessEvent) => {
    if (!event) {
      return;
    }

    const content = getPreviewContentFromVersionPayload(event.payload, fieldName);

    if (content) {
      callback(content);
    }
  };

  provider.on('stateless', handler);

  return () => {
    provider.off('stateless', handler);
  };
}

export default Snapshot;

// Extend Tiptap Commands interface with snapshot commands
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    snapshot: {
      /**
       * Save a new version with an optional name
       */
      saveVersion: (name?: string) => ReturnType;
      /**
       * Revert the document to a specific version
       */
      revertToVersion: (
        version: number,
        newVersionName?: string,
        currentVersionName?: string,
      ) => ReturnType;
      /**
       * Toggle automatic versioning on/off
       */
      toggleVersioning: () => ReturnType;
    };
  }
}
