import { useI18n } from '@/i18n';

export default function ExpertsCenter() {
  const { t } = useI18n();

  return (
    <div className="h-full overflow-auto bg-[var(--abu-bg-base)]">
      <div className="max-w-6xl mx-auto px-8 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-[var(--abu-text-primary)]">
            {t.experts.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--abu-text-secondary)]">
            {t.experts.subtitle}
          </p>
        </header>

        <div className="rounded-xl border border-dashed border-[var(--abu-border)] bg-[var(--abu-bg-subtle)] px-6 py-16 text-center text-sm text-[var(--abu-text-tertiary)]">
          {t.experts.comingSoon}
        </div>
      </div>
    </div>
  );
}
