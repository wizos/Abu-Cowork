/**
 * Tests for observeCompatEvent:
 *  - must no-op (no throw, no client call) when getLangfuse() returns null.
 *  - must forward metadata (no user content) when observability is enabled.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.mock with a factory — hoisted by vitest, so no top-level variable refs.
// We expose the mock via vi.importMock pattern: override per test with vi.mocked().
vi.mock('./langfuse', () => ({
  getLangfuse: vi.fn(),
}));

import { observeCompatEvent } from './compatEvents';
import { getLangfuse } from './langfuse';

const mockGetLangfuse = vi.mocked(getLangfuse);

describe('observeCompatEvent', () => {
  beforeEach(() => {
    mockGetLangfuse.mockReset();
  });

  it('does not throw and does not call the client when getLangfuse() returns null', () => {
    mockGetLangfuse.mockReturnValue(null);
    expect(() =>
      observeCompatEvent({ kind: 'unknown_finish_reason', modelId: 'test-model', finishReason: 'weird' })
    ).not.toThrow();
  });

  it('does not throw for any kind when observability is disabled', () => {
    mockGetLangfuse.mockReturnValue(null);
    const kinds = [
      'unknown_finish_reason',
      'dropped_tool_calls',
      'error_finish_reason',
      'content_filtered',
    ] as const;
    for (const kind of kinds) {
      expect(() => observeCompatEvent({ kind })).not.toThrow();
    }
  });

  it('calls lf.trace() with the event kind when observability is enabled', () => {
    const mockUpdate = vi.fn();
    const mockTrace = vi.fn().mockReturnValue({ update: mockUpdate });
    mockGetLangfuse.mockReturnValue({ trace: mockTrace } as unknown as ReturnType<typeof getLangfuse>);

    observeCompatEvent({
      kind: 'content_filtered',
      modelId: 'gpt-4o',
      requestHost: 'api.openai.com',
      finishReason: 'content_filter',
    });

    expect(mockTrace).toHaveBeenCalledOnce();
    const call = mockTrace.mock.calls[0][0] as Record<string, unknown>;
    expect(call.name).toBe('compat-event:content_filtered');
    const meta = call.metadata as Record<string, unknown>;
    expect(meta.kind).toBe('content_filtered');
    expect(meta.modelId).toBe('gpt-4o');
    expect(meta.requestHost).toBe('api.openai.com');
    expect(meta.finishReason).toBe('content_filter');
  });

  it('omits undefined optional fields from metadata', () => {
    const mockUpdate = vi.fn();
    const mockTrace = vi.fn().mockReturnValue({ update: mockUpdate });
    mockGetLangfuse.mockReturnValue({ trace: mockTrace } as unknown as ReturnType<typeof getLangfuse>);

    observeCompatEvent({ kind: 'unknown_finish_reason' });

    const call = mockTrace.mock.calls[0][0] as Record<string, unknown>;
    const meta = call.metadata as Record<string, unknown>;
    expect('modelId' in meta).toBe(false);
    expect('requestHost' in meta).toBe(false);
    expect('finishReason' in meta).toBe(false);
  });

  it('does not throw even if lf.trace() throws internally', () => {
    mockGetLangfuse.mockReturnValue({
      trace: vi.fn().mockImplementation(() => { throw new Error('langfuse unavailable'); }),
    } as unknown as ReturnType<typeof getLangfuse>);

    expect(() => observeCompatEvent({ kind: 'error_finish_reason', finishReason: 'error' })).not.toThrow();
  });

  it('includes toolCallCount in metadata when provided', () => {
    const mockUpdate = vi.fn();
    const mockTrace = vi.fn().mockReturnValue({ update: mockUpdate });
    mockGetLangfuse.mockReturnValue({ trace: mockTrace } as unknown as ReturnType<typeof getLangfuse>);

    observeCompatEvent({ kind: 'dropped_tool_calls', toolCallCount: 3 });

    const call = mockTrace.mock.calls[0][0] as Record<string, unknown>;
    const meta = call.metadata as Record<string, unknown>;
    expect(meta.toolCallCount).toBe(3);
  });
});
