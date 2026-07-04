/**
 * Unit tests for buildRenderSegments — the pure segment-building function
 * that interleaves text, tool-step, and mid-loop user-bubble segments.
 */
import { describe, it, expect } from 'vitest';
import { buildRenderSegments } from './MessageGroup';
import type { Message } from '@/types';
import type { ExecutionStep } from '@/types/execution';

function makeAssistant(id: string, text: string, toolCount = 0): Message {
  return {
    id,
    role: 'assistant',
    content: text,
    timestamp: 0,
    loopId: 'loop-1',
    toolCalls: Array.from({ length: toolCount }, (_, i) => ({
      id: `tc-${id}-${i}`,
      name: 'read_file',
      input: {},
      result: 'ok',
    })),
  };
}

function makeUser(id: string, text: string): Message {
  return { id, role: 'user', content: text, timestamp: 0, loopId: 'loop-1' };
}

function makeExecStep(id: string): ExecutionStep {
  return {
    id,
    executionId: 'exec-1',
    type: 'tool',
    label: id,
    status: 'completed',
    toolName: 'read_file',
    toolInput: {},
    source: 'agent',
    detailBlocks: [],
  };
}

describe('buildRenderSegments', () => {
  it('leading user message is NOT in segments (rendered by top bubble)', () => {
    const msgs: Message[] = [
      makeUser('u1', 'user start'),
      makeAssistant('a1', 'hello'),
    ];
    const segs = buildRenderSegments(msgs, [], []);
    expect(segs.some((s) => s.kind === 'user')).toBe(false);
    expect(segs).toHaveLength(1);
    expect(segs[0].kind).toBe('text');
  });

  it('mid-loop user message appears as a user segment between assistant segments', () => {
    const msgs: Message[] = [
      makeUser('u1', 'start'),
      makeAssistant('a1', 'text after tools', 0),
      makeUser('u2', 'queued mid-loop'),
      makeAssistant('a2', 'response'),
    ];
    const segs = buildRenderSegments(msgs, [], []);

    // Expect: text(a1), user(u2), text(a2)
    expect(segs).toHaveLength(3);
    expect(segs[0]).toMatchObject({ kind: 'text', message: expect.objectContaining({ id: 'a1' }) });
    expect(segs[1]).toMatchObject({ kind: 'user', message: expect.objectContaining({ id: 'u2' }) });
    expect(segs[2]).toMatchObject({ kind: 'text', message: expect.objectContaining({ id: 'a2' }) });
  });

  it('step slicing remains aligned with assistant messages when mid-user segments are present', () => {
    // a1 has 1 visible tool call, a2 has 1 visible tool call
    const msgs: Message[] = [
      makeUser('u1', 'start'),
      makeAssistant('a1', '', 1),   // tool-only turn
      makeUser('u2', 'queued'),
      makeAssistant('a2', 'done', 1), // tool + text turn
    ];
    const execStep1 = makeExecStep('step-1');
    const execStep2 = makeExecStep('step-2');
    const segs = buildRenderSegments(msgs, [execStep1, execStep2], []);

    // Expected: steps(a1 → step1), user(u2), text(a2) + steps(a2 → step2 pending flush)
    // The important thing: step1 belongs to a1, step2 belongs to a2 — not mixed up.
    const stepsSegs = segs.filter((s) => s.kind === 'steps');
    expect(stepsSegs).toHaveLength(2);
    const firstSteps = stepsSegs[0] as Extract<ReturnType<typeof buildRenderSegments>[0], { kind: 'steps' }>;
    const secondSteps = stepsSegs[1] as Extract<ReturnType<typeof buildRenderSegments>[0], { kind: 'steps' }>;
    expect(firstSteps.executionSteps).toHaveLength(1);
    expect(firstSteps.executionSteps[0].id).toBe('step-1');
    expect(secondSteps.executionSteps).toHaveLength(1);
    expect(secondSteps.executionSteps[0].id).toBe('step-2');
  });
});
