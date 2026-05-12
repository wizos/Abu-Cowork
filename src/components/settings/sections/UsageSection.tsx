import { useState, useMemo } from 'react';
import { useUsageStatsStore, type DailyRecord } from '@/stores/usageStatsStore';
import { useI18n, format } from '@/i18n';

// ── Helpers ──────────────────────────────────────────────────────────────────

type Period = 'today' | 'week' | 'month' | 'all';

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function currentDate(): string {
  return isoDate(new Date());
}

function getStartDate(period: Period): string {
  const today = currentDate();
  if (period === 'today') return today;
  if (period === 'week') {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return isoDate(d);
  }
  if (period === 'month') {
    return `${today.slice(0, 7)}-01`;
  }
  return ''; // all
}

interface Aggregated {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  bySkill: { skill: string; requests: number; tokens: number }[];
  byModel: { model: string; requests: number; tokens: number }[];
}

function aggregate(records: DailyRecord[], startDate: string, endDate: string): Aggregated {
  const skillMap = new Map<string, { requests: number; tokens: number }>();
  const modelMap = new Map<string, { requests: number; tokens: number }>();
  let requests = 0, inputTokens = 0, outputTokens = 0, cacheReadTokens = 0, cacheCreationTokens = 0;

  for (const rec of records) {
    if (startDate && rec.date < startDate) continue;
    if (rec.date > endDate) continue;
    for (const e of rec.entries) {
      requests += e.requests;
      inputTokens += e.inputTokens;
      outputTokens += e.outputTokens;
      cacheReadTokens += e.cacheReadTokens;
      cacheCreationTokens += e.cacheCreationTokens;

      const total = e.inputTokens + e.outputTokens;
      if (e.skill) {
        const prev = skillMap.get(e.skill) ?? { requests: 0, tokens: 0 };
        skillMap.set(e.skill, { requests: prev.requests + e.requests, tokens: prev.tokens + total });
      }
      const prevModel = modelMap.get(e.model) ?? { requests: 0, tokens: 0 };
      modelMap.set(e.model, { requests: prevModel.requests + e.requests, tokens: prevModel.tokens + total });
    }
  }

  return {
    requests, inputTokens, outputTokens, cacheReadTokens, cacheCreationTokens,
    bySkill: [...skillMap.entries()].map(([skill, v]) => ({ skill, ...v })).sort((a, b) => b.tokens - a.tokens),
    byModel: [...modelMap.entries()].map(([model, v]) => ({ model, ...v })).sort((a, b) => b.tokens - a.tokens),
  };
}

/** Build a date → total-tokens map from records */
function buildDateTokenMap(records: DailyRecord[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const rec of records) {
    let total = 0;
    for (const e of rec.entries) total += e.inputTokens + e.outputTokens;
    if (total > 0) map.set(rec.date, total);
  }
  return map;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatRate(num: number, den: number): string {
  if (den === 0) return '—';
  return `${Math.round((num / den) * 100)}%`;
}

// Heatmap color levels (warm clay palette, 5 levels)
const HEAT_COLORS = [
  'bg-[var(--abu-border)]',    // 0: no data
  'bg-[#fde8d8]',              // 1: faint
  'bg-[#f9c4a0]',              // 2: light
  'bg-[#f09060]',              // 3: medium
  'bg-[var(--abu-clay)]',      // 4: strong
] as const;

function heatLevel(tokens: number, maxTokens: number): number {
  if (tokens === 0 || maxTokens === 0) return 0;
  const ratio = tokens / maxTokens;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[var(--abu-border)] bg-[var(--abu-bg-card)] px-5 py-4 flex flex-col gap-1.5">
      <span className="text-[11px] text-[var(--abu-text-tertiary)] leading-none">{label}</span>
      <span className="text-2xl font-semibold text-[var(--abu-text-primary)] tabular-nums leading-tight">{value}</span>
      {sub && <span className="text-[10px] text-[var(--abu-text-muted)] leading-none">{sub}</span>}
    </div>
  );
}

function BarRow({ label, tokens, maxTokens }: { label: string; tokens: number; maxTokens: number }) {
  const pct = maxTokens > 0 ? Math.max(2, Math.round((tokens / maxTokens) * 100)) : 0;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="w-32 shrink-0 text-[12px] text-[var(--abu-text-secondary)] truncate" title={label}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[var(--abu-border)] overflow-hidden">
        <div className="h-full rounded-full bg-[var(--abu-clay-60)] transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right shrink-0 text-[11px] text-[var(--abu-text-tertiary)] tabular-nums">{formatTokens(tokens)}</span>
    </div>
  );
}

function UsageHeatmap({ dateTokenMap }: { dateTokenMap: Map<string, number> }) {
  const { t } = useI18n();
  const today = new Date();
  const todayStr = isoDate(today);

  // Start from Monday 11 weeks before the current Monday
  const dowToday = (today.getDay() + 6) % 7; // Mon=0, Sun=6
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - dowToday - 11 * 7);

  // Build 84 cells (7 rows × 12 cols)
  const cells: { date: string; isFuture: boolean }[] = [];
  for (let i = 0; i < 84; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = isoDate(d);
    cells.push({ date: dateStr, isFuture: dateStr > todayStr });
  }

  const maxTokens = Math.max(...cells.map(c => dateTokenMap.get(c.date) ?? 0), 1);
  const weekdays = t.usage.heatmapWeekdays;

  return (
    <div className="space-y-2">
      {/* Title row with inline legend */}
      <div className="flex items-center gap-2">
        <h3 className="text-[11px] font-medium text-[var(--abu-text-tertiary)] uppercase tracking-wider shrink-0">
          {t.usage.heatmapTitle}
        </h3>
        <div className="flex items-center gap-1 ml-1">
          <span className="text-[9px] text-[var(--abu-text-muted)]">{t.usage.heatmapLegendLess}</span>
          {HEAT_COLORS.map((cls, i) => (
            <div key={i} className={`h-2.5 w-2.5 rounded-[2px] ${cls}`} />
          ))}
          <span className="text-[9px] text-[var(--abu-text-muted)]">{t.usage.heatmapLegendMore}</span>
        </div>
      </div>
      <div className="flex gap-1.5">
        {/* Weekday labels */}
        <div className="flex flex-col gap-0.5 pt-0.5 shrink-0">
          {weekdays.map((wd) => (
            <span key={wd} className="h-3 flex items-center text-[9px] text-[var(--abu-text-muted)] w-4">{wd}</span>
          ))}
        </div>
        {/* 12 week columns — flex-1 so the grid fills available width */}
        <div className="flex gap-0.5 flex-1">
          {Array.from({ length: 12 }, (_, col) => (
            <div key={col} className="flex flex-col gap-0.5 flex-1">
              {Array.from({ length: 7 }, (_, row) => {
                const cell = cells[col * 7 + row];
                const tokens = cell.isFuture ? 0 : (dateTokenMap.get(cell.date) ?? 0);
                const level = cell.isFuture ? 0 : heatLevel(tokens, maxTokens);
                const dotDate = cell.date.replace(/-/g, '.');
                const tooltip = cell.isFuture
                  ? ''
                  : tokens > 0
                    ? format(t.usage.heatmapTooltipUsed, { date: dotDate, tokens: formatTokens(tokens) })
                    : format(t.usage.heatmapTooltipNoData, { date: dotDate });
                return (
                  <div
                    key={cell.date}
                    title={tooltip}
                    className={`w-full aspect-square rounded-sm ${HEAT_COLORS[level]} ${cell.isFuture ? 'opacity-0' : ''}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsageDailyBar({ dateTokenMap }: { dateTokenMap: Map<string, number> }) {
  const { t } = useI18n();
  const today = new Date();

  const days = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (29 - i));
      const date = isoDate(d);
      return { date, tokens: dateTokenMap.get(date) ?? 0 };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateTokenMap]);

  const maxTokens = Math.max(...days.map(d => d.tokens), 1);

  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-medium text-[var(--abu-text-tertiary)] uppercase tracking-wider">
        {t.usage.dailyTitle}
      </h3>
      <div className="flex items-end gap-0.5 h-20">
        {days.map(({ date, tokens }) => (
          <div
            key={date}
            title={tokens > 0 ? `${date}: ${formatTokens(tokens)}` : date}
            className="flex-1 rounded-t-sm bg-[var(--abu-clay-60)] opacity-80 hover:opacity-100 transition-opacity min-h-px"
            style={{ height: `${Math.max(tokens > 0 ? 4 : 0, Math.round((tokens / maxTokens) * 100))}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-[var(--abu-text-muted)]">
        <span>{days[0].date.slice(5)}</span>
        <span>{days[29].date.slice(5)}</span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function UsageSection() {
  const { t } = useI18n();
  const records = useUsageStatsStore((s) => s.records);
  const [period, setPeriod] = useState<Period>('today');

  const periods: { id: Period; label: string }[] = [
    { id: 'today', label: t.usage.periodToday },
    { id: 'week', label: t.usage.periodWeek },
    { id: 'month', label: t.usage.periodMonth },
    { id: 'all', label: t.usage.periodAll },
  ];

  const data = useMemo(() => {
    const today = currentDate();
    return aggregate(records, getStartDate(period), today);
  }, [records, period]);

  const dateTokenMap = useMemo(() => buildDateTokenMap(records), [records]);

  const totalTokens = data.inputTokens + data.outputTokens;
  const cacheTotal = data.inputTokens + data.cacheReadTokens + data.cacheCreationTokens;
  const maxSkillTokens = data.bySkill[0]?.tokens ?? 0;
  const maxModelTokens = data.byModel[0]?.tokens ?? 0;

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      {/* Period switcher */}
      <div className="flex gap-1">
        {periods.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setPeriod(id)}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
              period === id
                ? 'bg-[var(--abu-clay-bg)] text-[var(--abu-clay)] border border-[var(--abu-clay-20)]'
                : 'text-[var(--abu-text-tertiary)] hover:text-[var(--abu-text-secondary)] hover:bg-[var(--abu-bg-hover)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Row 1 — KPI cards (period-filtered) */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label={t.usage.requests} value={String(data.requests)} />
        <KpiCard
          label={t.usage.inputTokens}
          value={formatTokens(data.inputTokens)}
          sub={data.cacheReadTokens > 0 ? `cache ${formatTokens(data.cacheReadTokens)}` : undefined}
        />
        <KpiCard label={t.usage.outputTokens} value={formatTokens(data.outputTokens)} />
        <KpiCard
          label={t.usage.cacheHitRate}
          value={formatRate(data.cacheReadTokens, cacheTotal)}
          sub={totalTokens > 0 ? `${formatTokens(totalTokens)} total` : undefined}
        />
      </div>

      {/* Row 2 — Heatmap + Daily bar (fixed windows) */}
      <div className="grid grid-cols-2 gap-8">
        <UsageHeatmap dateTokenMap={dateTokenMap} />
        <UsageDailyBar dateTokenMap={dateTokenMap} />
      </div>

      {/* Row 3 — By Skill + By Model (period-filtered) */}
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-3">
          <h3 className="text-[11px] font-medium text-[var(--abu-text-tertiary)] uppercase tracking-wider">{t.usage.bySkill}</h3>
          {data.bySkill.length === 0
            ? <p className="text-[12px] text-[var(--abu-text-muted)] py-2">—</p>
            : <div className="space-y-3">{data.bySkill.slice(0, 10).map(item => <BarRow key={item.skill} label={item.skill} tokens={item.tokens} maxTokens={maxSkillTokens} />)}</div>
          }
        </div>
        <div className="space-y-3">
          <h3 className="text-[11px] font-medium text-[var(--abu-text-tertiary)] uppercase tracking-wider">{t.usage.byModel}</h3>
          {data.byModel.length === 0
            ? <p className="text-[12px] text-[var(--abu-text-muted)] py-2">—</p>
            : <div className="space-y-3">{data.byModel.slice(0, 10).map(item => <BarRow key={item.model} label={item.model} tokens={item.tokens} maxTokens={maxModelTokens} />)}</div>
          }
        </div>
      </div>
    </div>
  );
}
