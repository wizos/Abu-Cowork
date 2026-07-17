import { SquareTerminal, Globe } from 'lucide-react';
import { usePreviewStore } from '@/stores/previewStore';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';

/**
 * Direct launchers for a terminal / browser tab, shown in the right panel's
 * details mode. Without these the only entry point is the tab strip's `+`,
 * which is unreachable until at least one tab already exists — so opening a
 * terminal or browser used to require opening a file preview first. Clicking
 * either creates its tab and flips the panel into workspace (tabbed) mode.
 */
export default function WorkspaceLauncher() {
  const { t } = useI18n();
  const openTerminal = usePreviewStore((s) => s.openTerminal);
  const openBrowser = usePreviewStore((s) => s.openBrowser);

  return (
    <div className="shrink-0 mt-7 px-3 py-1.5 flex items-center gap-1 border-b border-[var(--abu-bg-pressed)]">
      <Button
        variant="ghost"
        size="xs"
        onClick={() => openTerminal()}
        className="gap-1 text-[var(--abu-text-secondary)]"
      >
        <SquareTerminal className="w-3.5 h-3.5" strokeWidth={1.5} />
        {t.workspace.terminalTitle}
      </Button>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => openBrowser()}
        className="gap-1 text-[var(--abu-text-secondary)]"
      >
        <Globe className="w-3.5 h-3.5" strokeWidth={1.5} />
        {t.workspace.browserTitle}
      </Button>
    </div>
  );
}
