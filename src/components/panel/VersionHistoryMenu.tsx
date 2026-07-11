import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { listVersions, revertToVersion, type VersionMeta } from '@/utils/canvasVersions';
import { formatRelativeTime } from '@/utils/messageTime';
import { useToastStore } from '@/stores/toastStore';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

interface VersionHistoryMenuProps {
  /** Absolute path of the file this history belongs to. */
  filePath: string;
  open: boolean;
  onClose: () => void;
  /** Wrapping element (trigger button's container) — used for outside-click detection. */
  anchorRef: React.RefObject<HTMLElement | null>;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Lightweight dropdown listing per-file version snapshots (see
 * `@/utils/canvasVersions`), with one-click revert. Mirrors the
 * open/close/outside-click/Escape conventions of `ModelSelector`.
 */
export function VersionHistoryMenu({ filePath, open, onClose, anchorRef }: VersionHistoryMenuProps) {
  const { t } = useI18n();
  const [versions, setVersions] = useState<VersionMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load the version list every time the menu opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    listVersions(filePath)
      .then((list) => {
        if (!cancelled) setVersions(list);
      })
      .catch((err) => {
        console.error('[VersionHistoryMenu] Failed to list versions:', filePath, err);
        if (!cancelled) {
          setVersions([]);
          useToastStore.getState().addToast({
            type: 'error',
            title: t.panel.versionHistoryLoadFailed,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t is stable from i18n singleton
  }, [open, filePath]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [open, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const panel = panelRef.current;
      const anchor = anchorRef.current;
      if (
        panel &&
        !panel.contains(e.target as Node) &&
        anchor &&
        !anchor.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    // setTimeout avoids catching the same click that opened the panel
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open, onClose, anchorRef]);

  const handleRevert = async (id: string) => {
    if (revertingId) return;
    setRevertingId(id);
    try {
      // The write lands on disk; usePreviewFileWatch's fs-watch + reloadNonce
      // (already wired in PreviewPanel) picks it up and refreshes the editor
      // / rendered preview — no direct store call needed here.
      await revertToVersion(filePath, id);
      useToastStore.getState().addToast({
        type: 'success',
        title: t.panel.versionHistoryReverted,
      });
      onClose();
    } catch (err) {
      console.error('[VersionHistoryMenu] Revert failed:', filePath, id, err);
      useToastStore.getState().addToast({
        type: 'error',
        title: t.panel.versionHistoryRevertFailedTitle,
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setRevertingId(null);
    }
  };

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className={cn(
        'absolute top-full right-0 mt-1.5 z-50',
        'w-64 max-h-80 rounded-lg shadow-lg',
        'bg-[var(--abu-bg-base)] border border-[var(--abu-border)]',
        'flex flex-col overflow-hidden'
      )}
    >
      <div className="px-3 py-2 border-b border-[var(--abu-bg-pressed)] text-[12px] font-medium text-[var(--abu-text-primary)] shrink-0">
        {t.panel.versionHistory}
      </div>
      <div className="overflow-y-auto flex-1 p-1">
        {loading ? (
          <div className="px-3 py-4 text-center text-xs text-[var(--abu-text-muted)]">…</div>
        ) : versions.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-[var(--abu-text-muted)]">
            {t.panel.versionHistoryEmpty}
          </div>
        ) : (
          versions.map((v) => (
            <button
              key={v.id}
              type="button"
              disabled={revertingId !== null}
              onClick={() => handleRevert(v.id)}
              title={t.panel.versionHistoryRevert}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-left',
                'text-xs transition-colors',
                'text-[var(--abu-text-secondary)] hover:bg-[var(--abu-bg-hover)]',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                revertingId === v.id && 'opacity-60'
              )}
            >
              <Clock className="h-3 w-3 shrink-0 text-[var(--abu-text-muted)]" />
              <span className="flex-1 truncate">{formatRelativeTime(v.ts)}</span>
              <span className="text-[var(--abu-text-muted)] shrink-0">{formatBytes(v.byteSize)}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
