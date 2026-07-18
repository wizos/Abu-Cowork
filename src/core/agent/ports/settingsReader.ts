import { useSettingsStore, type SettingsState } from '@/stores/settingsStore';

/**
 * Port abstracting agentLoop's reads of settingsStore.
 *
 * Intentionally minimal: a single `getSnapshot()` action. The distinction
 * between "entry snapshot" (provider identity, pinned once at loop start)
 * and "per-turn snapshot" (mid-loop-tunable knobs like computerUseEnabled/
 * maxOutputTokens/contextWindowSize) is NOT modeled here — that anti-bleed
 * semantic lives in the caller (agentLoop.ts), which must call
 * `getSnapshot()` independently at each point and never cache or merge the
 * two results. See agentLoop.ts's `settings` vs `freshSettings` comment for
 * the invariant this protects (a global model switch mid-loop must never
 * bleed into an in-flight conversation on a different model).
 */
export interface SettingsReader {
  getSnapshot(): SettingsState;
}

/** Default in-process implementation — thin wrapper over the Zustand store's
 *  synchronous getState(). This is the seam a future out-of-process agent
 *  runtime (headless Node sidecar) would replace with an IPC/RPC-backed
 *  implementation. */
export function createInProcessSettingsReader(): SettingsReader {
  return {
    getSnapshot: () => useSettingsStore.getState(),
  };
}
