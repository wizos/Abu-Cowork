import { useSettingsStore, type AutomationTab } from '@/stores/settingsStore';
import { useI18n } from '@/i18n';
import { Clock, Zap } from 'lucide-react';
import ScheduleView from '@/components/schedule/ScheduleView';
import TriggerView from '@/components/trigger/TriggerView';
import TopTabNav from '@/components/toolbox/TopTabNav';

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
      {/* Top Navigation — horizontal tab bar for automation types (underline style). */}
      <TopTabNav
        items={navItems}
        activeId={activeAutomationTab}
        onSelect={setActiveAutomationTab}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeAutomationTab === 'schedule' && <ScheduleView />}
        {activeAutomationTab === 'trigger' && <TriggerView />}
      </div>
    </div>
  );
}
