import { useSettingsStore, type AutomationTab } from '@/stores/settingsStore';
import { useI18n } from '@/i18n';
import { Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import ScheduleView from '@/components/schedule/ScheduleView';
import TriggerView from '@/components/trigger/TriggerView';

export default function AutomationView() {
  const { activeAutomationTab, setActiveAutomationTab } = useSettingsStore();
  const sidebarCollapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const { t } = useI18n();

  const navItems: { id: AutomationTab; label: string; icon: typeof Clock }[] = [
    { id: 'schedule', label: t.sidebar.scheduledTasks, icon: Clock },
    { id: 'trigger', label: t.sidebar.triggers, icon: Zap },
  ];

  return (
    <div className="h-full bg-[var(--abu-bg-base)] flex flex-col">
      {/* Top Navigation — horizontal tab bar for automation types (underline style).
          When the sidebar is collapsed, the window's floating controls + macOS
          traffic lights sit over the card's top-left, so pad the tabs right. */}
      <nav
        className={cn(
          'shrink-0 flex items-center gap-1 pt-3 pr-4 border-b border-[var(--abu-border)]',
          sidebarCollapsed ? 'pl-[184px]' : 'pl-4'
        )}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeAutomationTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveAutomationTab(item.id)}
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

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeAutomationTab === 'schedule' && <ScheduleView />}
        {activeAutomationTab === 'trigger' && <TriggerView />}
      </div>
    </div>
  );
}
