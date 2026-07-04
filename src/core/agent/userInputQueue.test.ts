/**
 * Queue staging semantics (Codex-style): queued messages live OUTSIDE the
 * transcript in a cancellable staging area and only become chat messages
 * when the running loop drains them.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  enqueueUserInput,
  drainQueuedInputs,
  clearInputQueue,
  getQueuedInputs,
  removeQueuedInput,
} from './userInputQueue';

const CONV = 'conv-queue-test';

describe('userInputQueue staging', () => {
  beforeEach(() => clearInputQueue(CONV));

  it('getQueuedInputs exposes queued items for rendering', () => {
    enqueueUserInput(CONV, '数完说你好');
    enqueueUserInput(CONV, '再说声晚安');
    const items = getQueuedInputs(CONV);
    expect(items.map((i) => i.text)).toEqual(['数完说你好', '再说声晚安']);
  });

  it('returns a stable empty array for conversations with no queue', () => {
    expect(getQueuedInputs(CONV)).toBe(getQueuedInputs(CONV));
    expect(getQueuedInputs(CONV)).toHaveLength(0);
  });

  it('returns a stable reference between mutations (useSyncExternalStore contract)', () => {
    enqueueUserInput(CONV, 'a');
    const snap1 = getQueuedInputs(CONV);
    expect(getQueuedInputs(CONV)).toBe(snap1);
    enqueueUserInput(CONV, 'b');
    expect(getQueuedInputs(CONV)).not.toBe(snap1);
  });

  it('removeQueuedInput cancels a single staged item', () => {
    enqueueUserInput(CONV, 'keep');
    enqueueUserInput(CONV, 'cancel me');
    const target = getQueuedInputs(CONV).find((i) => i.text === 'cancel me')!;
    removeQueuedInput(CONV, target.id);
    expect(getQueuedInputs(CONV).map((i) => i.text)).toEqual(['keep']);
    expect(drainQueuedInputs(CONV).map((i) => i.text)).toEqual(['keep']);
  });
});
