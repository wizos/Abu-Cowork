import { useScheduleStore } from '@/stores/scheduleStore';
import { useI18n } from '@/i18n';
import { navigateToChatWithInput } from '@/utils/navigation';
import { Plus, Clock, Info, Wand2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ScheduleTaskCard from './ScheduleTaskCard';
import ScheduleTaskDetail from './ScheduleTaskDetail';
import ScheduleEditor from './ScheduleEditor';

export default function ScheduleView() {
  const { t } = useI18n();
  const { tasks, selectedTaskId, openEditor } = useScheduleStore();

  const handleAskAbu = () => {
    navigateToChatWithInput(t.schedule.askAbuCreatePrompt);
  };

  const sortedTasks = Object.values(tasks).sort((a, b) => b.createdAt - a.createdAt);

  // Show detail page if a task is selected
  if (selectedTaskId && tasks[selectedTaskId]) {
    return (
      <div className="flex flex-col h-full bg-[var(--abu-bg-base)]">
        <ScheduleTaskDetail />
        <ScheduleEditor />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--abu-bg-base)]">
      {/* Header row: run-condition hint on the left (no background) + create
          actions on the right (only when there are tasks). The toolbox top-tab
          already labels the view, so no redundant title. */}
      <div className="flex items-center justify-between gap-3 px-6 pt-4 pb-2">
        <div className="flex items-center gap-1.5 text-[12px] text-[var(--abu-text-tertiary)] min-w-0">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{t.schedule.onlyRunWhileAwake}</span>
        </div>
        {sortedTasks.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAskAbu}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium bg-[var(--abu-bg-active)] text-[var(--abu-text-primary)] hover:bg-[var(--abu-border)] transition-colors shrink-0"
            >
              <Wand2 className="h-3.5 w-3.5 text-[var(--abu-clay)]" />
              {t.schedule.askAbuToCreate}
            </button>
            <button
              onClick={() => openEditor()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium bg-[var(--abu-clay)] text-white hover:bg-[var(--abu-clay-hover)] transition-colors shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              {t.schedule.newTask}
            </button>
          </div>
        )}
      </div>

      {/* Task list or empty state */}
      {sortedTasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="w-16 h-16 rounded-full bg-[var(--abu-bg-active)] flex items-center justify-center mb-4">
            <Clock className="h-7 w-7 text-[var(--abu-text-muted)]" />
          </div>
          <p className="text-[15px] text-[var(--abu-text-primary)] font-medium mb-1.5">
            {t.schedule.noTasks}
          </p>
          <p className="text-[13px] text-[var(--abu-text-tertiary)] mb-5">
            {t.schedule.noTasksHint}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => openEditor()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium bg-[var(--abu-clay)] text-white hover:bg-[var(--abu-clay-hover)] transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t.schedule.noTasksCTA}
            </button>
            <button
              onClick={handleAskAbu}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium bg-[var(--abu-bg-active)] text-[var(--abu-text-primary)] hover:bg-[var(--abu-border)] transition-colors"
            >
              <Wand2 className="h-4 w-4 text-[var(--abu-clay)]" />
              {t.schedule.askAbuToCreate}
            </button>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-3">
            {sortedTasks.map((task) => (
              <ScheduleTaskCard key={task.id} task={task} />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Editor modal */}
      <ScheduleEditor />
    </div>
  );
}
