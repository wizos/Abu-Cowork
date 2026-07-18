import { useSyncExternalStore } from 'react';
import { CornerDownRight, X } from 'lucide-react';
import {
  subscribeToInputQueue,
  getQueuedInputs,
  removeQueuedInput,
} from '@/core/agent/userInputQueue';
import { useI18n } from '@/i18n';

/**
 * Codex-style staging strip for mid-task messages: queued inputs sit at the
 * composer's top-right edge as light-gray cancellable pills. They become
 * transcript bubbles only when the running loop drains them (agentLoop's
 * drainQueuedInputs block) — until then the × removes them without a trace.
 */
export default function QueuedMessagesStrip({ conversationId }: { conversationId: string }) {
  const { t } = useI18n();
  const items = useSyncExternalStore(
    subscribeToInputQueue,
    () => getQueuedInputs(conversationId),
  );
  const visible = items.filter((qi) => !qi.isSystem);
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      {visible.map((qi) => (
        <div
          key={qi.id}
          className="flex items-center gap-1.5 max-w-[75%] rounded-full bg-[var(--abu-bg-muted)] border border-[var(--abu-border-subtle)] pl-2.5 pr-1 py-1"
          title={t.queueStrip.queuedHint}
        >
          <CornerDownRight className="h-3 w-3 text-[var(--abu-text-muted)] shrink-0" />
          <span className="text-minor text-[var(--abu-text-muted)] truncate">{qi.text}</span>
          <button
            aria-label={t.queueStrip.cancel}
            title={t.queueStrip.cancel}
            onClick={() => removeQueuedInput(conversationId, qi.id)}
            className="btn-ghost shrink-0 rounded-full p-0.5 text-[var(--abu-text-muted)] hover:text-[var(--abu-text-primary)] hover:bg-[var(--abu-bg-hover)] transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
