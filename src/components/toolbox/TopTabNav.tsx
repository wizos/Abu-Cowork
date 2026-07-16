import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TopTabNavItem<T extends string = string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

interface TopTabNavProps<T extends string> {
  items: TopTabNavItem<T>[];
  activeId: T;
  onSelect: (id: T) => void;
  sidebarCollapsed: boolean;
}

/**
 * Shared horizontal underline tab-nav (ToolboxModal / AutomationView). When the
 * sidebar is collapsed, the window's floating controls (sidebar toggle / search
 * / new-task) + macOS traffic lights sit over the card's top-left, so pad the
 * tabs right to clear them.
 */
export default function TopTabNav<T extends string>({ items, activeId, onSelect, sidebarCollapsed }: TopTabNavProps<T>) {
  return (
    <nav
      className={cn(
        'shrink-0 flex items-center gap-1 pt-3 pr-4 border-b border-[var(--abu-border)]',
        sidebarCollapsed ? 'pl-[184px]' : 'pl-4'
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 -mb-px border-b-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-[var(--abu-clay)] text-[var(--abu-text-primary)]'
                : 'border-transparent text-[var(--abu-text-tertiary)] hover:text-[var(--abu-text-primary)]'
            )}
          >
            <Icon className={cn(
              'h-4 w-4 shrink-0',
              isActive ? 'text-[var(--abu-clay)]' : 'text-[var(--abu-text-muted)]'
            )} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
