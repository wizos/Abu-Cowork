/**
 * Computer Use session state — module-level reactive store.
 *
 * Used by toolExecutor to signal state changes, consumed by
 * ComputerUseStatusBar via useSyncExternalStore.
 *
 * Not a Zustand store because it bridges core/ and components/ without persistence.
 */

export type CUSessionStatus = 'idle' | 'active' | 'paused';

export interface CUState {
  status: CUSessionStatus;
  stepCount: number;
  currentAction: string | null;
  latestScreenshot: string | null; // base64
  activeConversationId: string | null; // for abort targeting
  /** Whether Abu window is hidden and border/stop-btn are shown (session-level, survives across batches) */
  sessionWindowHidden: boolean;
}

let state: CUState = {
  status: 'idle',
  stepCount: 0,
  currentAction: null,
  latestScreenshot: null,
  activeConversationId: null,
  sessionWindowHidden: false,
};

const listeners = new Set<() => void>();

function notify() {
  for (const fn of listeners) fn();
}

function update(partial: Partial<CUState>) {
  state = { ...state, ...partial };
  notify();
}

// ─── Actions (called by toolExecutor) ───

/** Enter Computer Use session. */
export function setComputerUseActive(active: boolean, conversationId?: string) {
  if (active) {
    update({ status: 'active', stepCount: 0, currentAction: null, latestScreenshot: null, activeConversationId: conversationId ?? null });
    setupAbortListener();
  } else {
    const wasHidden = state.sessionWindowHidden;
    update({ status: 'idle', stepCount: 0, currentAction: null, latestScreenshot: null, activeConversationId: null, sessionWindowHidden: false });
    cleanupAbortListener();
    // Session-level cleanup: restore window and hide overlay
    if (wasHidden) {
      import('@tauri-apps/api/core').then(({ invoke }) => {
        invoke('window_show').catch(() => {});
        invoke('hide_screen_border').catch(() => {});
      }).catch(() => {});
    }
  }
}

/** Increment step count and optionally set current action description. */
export function incrementComputerUseStep(action?: string) {
  if (state.status === 'active') {
    update({ stepCount: state.stepCount + 1, currentAction: action ?? null });
  }
}

/** Update the latest screenshot for live preview. */
export function updateLatestScreenshot(base64: string) {
  if (state.status === 'active') {
    update({ latestScreenshot: base64 });
  }
}

/** Mark that the window has been hidden for this CU session. */
export function setSessionWindowHidden(hidden: boolean) {
  update({ sessionWindowHidden: hidden });
}

/** Check if window is already hidden for this session (avoid re-hiding across batches). */
export function isSessionWindowHidden(): boolean {
  return state.sessionWindowHidden;
}

/** Set current action description. */
export function setCurrentAction(action: string | null) {
  update({ currentAction: action });
}

// ─── Stop button abort listener ───

let abortUnlisten: (() => void) | null = null;

async function setupAbortListener() {
  if (abortUnlisten) return;
  try {
    const { listen } = await import('@tauri-apps/api/event');
    const unlisten = await listen('computer-use-abort', () => {
      const convId = state.activeConversationId;
      if (convId) {
        // Dynamic import to avoid circular dependency
        import('../../stores/chatStore').then(({ useChatStore }) => {
          useChatStore.getState().cancelStreaming(convId);
        }).catch(() => {});
      }
    });
    abortUnlisten = unlisten;
  } catch { /* ignore — event API unavailable */ }
}

function cleanupAbortListener() {
  if (abortUnlisten) {
    abortUnlisten();
    abortUnlisten = null;
  }
}

// ─── React integration (useSyncExternalStore) ───

export function subscribeCUStatus(callback: () => void) {
  listeners.add(callback);
  return () => { listeners.delete(callback); };
}

export function getCUStatusSnapshot(): CUState {
  return state;
}
