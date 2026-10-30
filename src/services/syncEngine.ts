export type SyncState = 'idle' | 'saving' | 'saved' | 'error';

export interface SyncEngineStatus {
  state: SyncState;
  isOnline: boolean;
  lastSavedAt: string | null;
  lastError: string | null;
}

class SyncEngine {
  private status: SyncEngineStatus = {
    state: 'idle',
    isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
    lastSavedAt: null,
    lastError: null
  };
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.setStatus({ isOnline: true }));
      window.addEventListener('offline', () => this.setStatus({ isOnline: false }));
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStatus(): SyncEngineStatus {
    return this.status;
  }

  public markSaving() {
    this.setStatus({ state: 'saving', lastError: null });
  }

  public markSaved() {
    this.setStatus({ state: 'saved', lastError: null, lastSavedAt: new Date().toISOString() });
  }

  public markError(message: string) {
    this.setStatus({ state: 'error', lastError: message });
  }

  private setStatus(patch: Partial<SyncEngineStatus>) {
    this.status = { ...this.status, ...patch };
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch (e) {
        console.error('Error in sync listener:', e);
      }
    });
  }
}

export const syncEngine = new SyncEngine();
