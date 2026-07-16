import { useState } from 'react';
import type { ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Input } from '@/components/ui/input';

interface ToolboxToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  /** Create control(s) rendered on the right, next to the search toggle.
   *  Hidden while the search box is expanded — mirrors the previous per-section markup. */
  children?: ReactNode;
}

/**
 * Shared top toolbar for the Agents / Skills / MCP toolbox sections: a search
 * toggle (icon → expanded input with clear-X, blur-collapse, Escape-to-clear)
 * plus a create control supplied by the caller. Owns the `showSearch` UI state;
 * the search query itself is lifted (each section stores it in
 * settingsStore's `toolboxSearchQuery`).
 */
export default function ToolboxToolbar({ searchQuery, onSearchChange, children }: ToolboxToolbarProps) {
  const [showSearch, setShowSearch] = useState(false);
  const { t } = useI18n();

  return (
    <div className="shrink-0 px-6 pt-4 pb-3 flex items-center justify-end gap-1">
      {showSearch ? (
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--abu-text-tertiary)]" />
          <Input
            autoFocus
            type="text"
            placeholder={t.toolbox.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onBlur={() => { if (!searchQuery) setShowSearch(false); }}
            onKeyDown={(e) => { if (e.key === 'Escape') { onSearchChange(''); setShowSearch(false); } }}
            className="h-auto py-1 pl-7 pr-7 rounded-md bg-[var(--abu-bg-base)] focus:ring-1 focus:border-[var(--abu-border)]"
          />
          <button
            onClick={() => { onSearchChange(''); setShowSearch(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--abu-text-tertiary)] hover:text-[var(--abu-text-primary)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => setShowSearch(true)}
            className="p-1 text-[var(--abu-text-muted)] hover:text-[var(--abu-text-primary)] transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
          {children}
        </>
      )}
    </div>
  );
}
