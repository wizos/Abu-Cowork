import { Globe, SquareTerminal } from 'lucide-react';
import { usePreviewStore } from '@/stores/previewStore';
import { useI18n } from '@/i18n';
import TabStrip from './TabStrip';
import PreviewPanel from '../PreviewPanel';

/**
 * Placeholder body for tab kinds whose real implementation lands in a later
 * pass (Rust pty + xterm for terminal; iframe chrome for browser — see
 * docs/2026-07-17-workspace-tabs-design.md P2/P3).
 */
function ComingSoonBody({ kind }: { kind: 'browser' | 'terminal' }) {
  const { t } = useI18n();
  const Icon = kind === 'browser' ? Globe : SquareTerminal;
  const hint = kind === 'browser' ? t.workspace.browserComingSoonHint : t.workspace.terminalComingSoonHint;
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-4">
      <Icon className="w-6 h-6 text-[var(--abu-text-tertiary)]" strokeWidth={1.5} />
      <p className="text-[13px] font-medium text-[var(--abu-text-secondary)]">{t.workspace.comingSoon}</p>
      <p className="text-[12px] text-[var(--abu-text-tertiary)]">{hint}</p>
    </div>
  );
}

/**
 * Owns the tab strip and the keep-alive tab bodies. Every open tab stays
 * mounted at all times — inactive ones are hidden with CSS (never
 * unmounted) so switching back preserves preview editor drafts / (later)
 * terminal scrollback / browser page state. See "Why keep-alive mount" in
 * docs/2026-07-17-workspace-tabs-design.md.
 */
export default function WorkspacePanel() {
  const tabs = usePreviewStore((s) => s.tabs);
  const activeTabId = usePreviewStore((s) => s.activeTabId);

  return (
    <div className="flex flex-col h-full">
      <TabStrip />
      <div className="flex-1 min-h-0 relative">
        {tabs.map((tab) => (
          <div key={tab.id} hidden={tab.id !== activeTabId} className="h-full">
            {tab.kind === 'preview' ? (
              <PreviewPanel filePath={tab.filePath} tabId={tab.id} embedded />
            ) : (
              <ComingSoonBody kind={tab.kind} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
