import { describe, it, expect } from 'vitest';
import { getWidgetGuidelines, WIDGET_GUIDELINE_MODULES } from './guidelines';
import { WIDGET_THEME_VARS, WIDGET_UTILITY_CLASSES, getDesignSystemGuideText } from './designSystem';

describe('getWidgetGuidelines', () => {
  it('includes the hard rules in every call', () => {
    const text = getWidgetGuidelines();
    expect(text).toContain('Hard rules');
    expect(text).toContain('Fragment only');
    expect(text).toContain('position: fixed');
    expect(text).toContain('localStorage');
    expect(text).toContain('sessionStorage');
    expect(text).toContain('<form>');
    expect(text).toContain('100vh');
    expect(text).toContain('cdn.jsdelivr.net');
    expect(text).toContain('cdnjs.cloudflare.com');
    expect(text).toContain('unpkg.com');
  });

  it('includes every module section when no filter is given', () => {
    const text = getWidgetGuidelines();
    expect(text).toContain('## Diagrams');
    expect(text).toContain('## Charts');
    expect(text).toContain('## Interactive widgets');
    expect(text).toContain('## UI mockups');
  });

  it('includes every module section when an empty array is given (treated as "all")', () => {
    const text = getWidgetGuidelines([]);
    expect(text).toContain('## Diagrams');
    expect(text).toContain('## Charts');
  });

  it('filters to a single requested module', () => {
    const text = getWidgetGuidelines(['diagram']);
    expect(text).toContain('## Diagrams');
    expect(text).not.toContain('## Charts');
    expect(text).not.toContain('## Interactive widgets');
    expect(text).not.toContain('## UI mockups');
    // Hard rules always present regardless of module filter
    expect(text).toContain('Hard rules');
  });

  it('filters to multiple requested modules, preserving canonical order', () => {
    const text = getWidgetGuidelines(['mockup', 'chart']);
    const chartIdx = text.indexOf('## Charts');
    const mockupIdx = text.indexOf('## UI mockups');
    expect(chartIdx).toBeGreaterThan(-1);
    expect(mockupIdx).toBeGreaterThan(-1);
    expect(chartIdx).toBeLessThan(mockupIdx); // canonical WIDGET_GUIDELINE_MODULES order, not request order
    expect(text).not.toContain('## Diagrams');
  });

  it('ignores unknown module names', () => {
    const text = getWidgetGuidelines(['not-a-real-module']);
    // Falls back to "all" behavior — filter matched nothing, canonical list wins... actually
    // an unknown-only filter yields an empty requested list, not "all". Assert that shape instead.
    expect(text).toContain('Hard rules');
    expect(text).not.toContain('## Diagrams');
    expect(text).not.toContain('## Charts');
  });

  it('canonical module list has exactly the four documented modules', () => {
    expect(WIDGET_GUIDELINE_MODULES).toEqual(['diagram', 'chart', 'interactive', 'mockup']);
  });

  it('includes the design-system section (vars + classes), regardless of module filter', () => {
    // Every module-filter shape (default/empty/single/unknown) must still carry the
    // design-system section — it's a hard-rules-adjacent, always-present section.
    for (const text of [getWidgetGuidelines(), getWidgetGuidelines([]), getWidgetGuidelines(['diagram']), getWidgetGuidelines(['not-a-real-module'])]) {
      expect(text).toContain('## Design system');
      for (const v of WIDGET_THEME_VARS) expect(text).toContain(v.name);
      for (const c of WIDGET_UTILITY_CLASSES) expect(text).toContain(`.${c.name}`);
    }
  });

  it('single source: the design-system section is exactly designSystem.ts\'s guide text (no separate copy that could drift)', () => {
    const text = getWidgetGuidelines();
    expect(text).toContain(getDesignSystemGuideText());
  });
});
