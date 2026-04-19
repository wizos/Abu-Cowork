import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sourceToUXCategory } from './uxCategory';

describe('sourceToUXCategory', () => {
  it('groups user / standard / project / project-standard into "mine"', () => {
    expect(sourceToUXCategory('user')).toBe('mine');
    expect(sourceToUXCategory('standard')).toBe('mine');
    expect(sourceToUXCategory('project')).toBe('mine');
    expect(sourceToUXCategory('project-standard')).toBe('mine');
  });

  it('groups workspace-auto + draft into "agent-evolved"', () => {
    // Regression guard: before this refactor, workspace-auto/draft
    // fell into the default branch and silently appeared under the
    // user's own skills — the exact mental-model confusion Task #25/
    // taxonomy rework addresses.
    expect(sourceToUXCategory('workspace-auto')).toBe('agent-evolved');
    expect(sourceToUXCategory('draft')).toBe('agent-evolved');
  });

  it('maps builtin separately from mine', () => {
    expect(sourceToUXCategory('builtin')).toBe('builtin');
  });

  it('treats undefined source as legacy "mine" (no source field yet)', () => {
    // Some older persisted skills may predate the source field.
    expect(sourceToUXCategory(undefined)).toBe('mine');
  });

  describe('unknown source (runtime safety)', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('returns null and warns — unknown skills are hidden, not misfiled', () => {
      // Cast forces the runtime-only branch (TS would reject this).
      const result = sourceToUXCategory('some-future-value' as never);
      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('unknown skill source'),
      );
    });
  });
});
