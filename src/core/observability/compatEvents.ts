/**
 * Lightweight observability helper for OpenAI-compatible adapter edge cases.
 *
 * Reports control-flow anomalies (unknown finish_reason, content_filter, etc.)
 * to Langfuse as trace events. Completely no-ops when no Langfuse key is
 * configured — the OSS default is zero-collection (CLAUDE.md privacy red line).
 *
 * IMPORTANT: must never include user message content — metadata only.
 */

import { getLangfuse } from './langfuse';

export interface CompatEventPayload {
  /** Discriminator for the type of anomaly. */
  kind:
    | 'unknown_finish_reason'
    | 'dropped_tool_calls'
    | 'error_finish_reason'
    | 'content_filtered';
  /** The model ID from ChatOptions (e.g. 'gpt-4o', 'glm-5'). */
  modelId?: string;
  /** Hostname of the provider endpoint (e.g. 'api.openai.com'). */
  requestHost?: string;
  /** The raw finish_reason string received from the provider. */
  finishReason?: string;
  /** Number of buffered tool calls at the time of the anomaly. */
  toolCallCount?: number;
}

/**
 * Emit a compat-event observation to Langfuse.
 * No-ops silently when observability is disabled (getLangfuse() === null).
 * Never throws — best-effort fire-and-forget, matching the rest of the
 * observability module's error-handling style.
 */
export function observeCompatEvent(evt: CompatEventPayload): void {
  const lf = getLangfuse();
  if (!lf) return;
  try {
    const trace = lf.trace({
      name: `compat-event:${evt.kind}`,
      metadata: {
        kind: evt.kind,
        ...(evt.modelId !== undefined ? { modelId: evt.modelId } : {}),
        ...(evt.requestHost !== undefined ? { requestHost: evt.requestHost } : {}),
        ...(evt.finishReason !== undefined ? { finishReason: evt.finishReason } : {}),
        ...(evt.toolCallCount !== undefined ? { toolCallCount: evt.toolCallCount } : {}),
      },
    });
    trace.update({ output: { observed: true } });
  } catch { /* best-effort */ }
}
