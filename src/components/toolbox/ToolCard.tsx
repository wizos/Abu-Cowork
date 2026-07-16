import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Display-layer item for the toolbox card grid. Each tab (agents / skills / MCP)
 * maps its own domain object into this shape; the card is purely presentational
 * and never touches business state. `raw` is intentionally omitted — the owning
 * section keeps the source object and resolves it back on click via `id`.
 */
export interface ToolItem {
  id: string;
  name: string;
  description?: string;
  /** Rendered node so callers can pass an emoji, <img>, or a status-colored icon. */
  avatar?: ReactNode;
  tags?: string[];
  /** Optional top-right corner adornment (source badge, connection status dot, …). */
  badge?: ReactNode;
  /** Render in a muted/disabled style (e.g. an agent toggled off). */
  dimmed?: boolean;
}

/**
 * Fixed-height card. Every region is a fixed size and content is clamped
 * (name → 1 line, tags → 1 row of ≤3, description → 2 lines) so cards are
 * pixel-identical across all tabs regardless of how much text an item has —
 * long content can never stretch a card taller than its neighbours. The tags
 * row is always reserved (even when empty) so tagged and untagged items match.
 */
export default function ToolCard({ item, onClick }: { item: ToolItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex flex-col items-start gap-3 w-full h-[184px] overflow-hidden rounded-xl p-4 text-left',
        'bg-[var(--abu-bg-subtle)] border border-[var(--abu-border)]',
        'hover:border-[var(--abu-clay)] hover:shadow-sm transition-all duration-150'
      )}
    >
      {/* Avatar + optional badge */}
      <div className="flex items-center justify-between w-full shrink-0">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--abu-bg-active)] text-2xl select-none shrink-0">
          {item.avatar ?? '🤖'}
        </div>
        {item.badge}
      </div>

      {/* Name + tags (tags row always reserved for uniform height) */}
      <div className="w-full shrink-0">
        <p
          className={cn(
            'text-sm font-semibold leading-snug truncate',
            item.dimmed ? 'text-[var(--abu-text-placeholder)]' : 'text-[var(--abu-text-primary)]'
          )}
          title={item.name}
        >
          {item.name}
        </p>
        <div className="flex flex-wrap gap-1 mt-1.5 h-4 overflow-hidden">
          {item.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded text-[10px] leading-none font-medium bg-[var(--abu-bg-active)] text-[var(--abu-text-tertiary)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Description — fixed two-line height, always reserved. w-full + break-words
          so long unbreakable strings (e.g. URLs) wrap instead of overflowing. */}
      <p className="w-full h-[39px] text-[12px] text-[var(--abu-text-secondary)] leading-relaxed line-clamp-2 break-words shrink-0">
        {item.description}
      </p>
    </button>
  );
}
