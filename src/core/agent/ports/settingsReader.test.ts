import { describe, it, expect } from 'vitest';
import { useSettingsStore } from '@/stores/settingsStore';
import { createInProcessSettingsReader } from './settingsReader';

describe('createInProcessSettingsReader', () => {
  it('getSnapshot() returns the same state as useSettingsStore.getState()', () => {
    const reader = createInProcessSettingsReader();
    expect(reader.getSnapshot()).toBe(useSettingsStore.getState());
  });

  it('reflects store updates on the next call (not cached at construction time)', () => {
    const reader = createInProcessSettingsReader();
    const before = reader.getSnapshot().agentMaxTurns;
    useSettingsStore.setState({ agentMaxTurns: before + 1 });
    expect(reader.getSnapshot().agentMaxTurns).toBe(before + 1);
    // restore
    useSettingsStore.setState({ agentMaxTurns: before });
  });
});
