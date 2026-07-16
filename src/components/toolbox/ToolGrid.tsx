import type { ReactNode } from 'react';

/**
 * Dumb responsive grid wrapper for the toolbox card grid. Owns no state — the
 * calling section passes already-built <ToolCard> children.
 *
 * Columns are a FIXED pixel width (`repeat(auto-fill, 260px)`), not `1fr`, so a
 * card's size never changes when the window is resized — widening the window
 * only adds columns and narrowing only removes them (matching WorkBuddy).
 * `auto-fill` also keeps a group with only a couple of items at normal card
 * size rather than stretching them across the row.
 */
export default function ToolGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,260px)] gap-4">
      {children}
    </div>
  );
}
