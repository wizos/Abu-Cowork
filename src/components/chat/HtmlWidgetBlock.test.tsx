/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest';
import { buildFullHtml } from './HtmlWidgetBlock';

describe('buildFullHtml — fullscreen wrapper', () => {
  it('injects the design system into the FRAGMENT-wrap branch', () => {
    // A widget styled inline with .w-*/--w-* must render identically
    // fullscreen — the wrap has to ship the same design CSS as RECEIVER_HTML.
    const html = buildFullHtml('<div class="w-card">hi</div>');
    expect(html).toContain('.w-card {');
    expect(html).toContain('--w-primary:');
  });

  it('leaves the full-DOCUMENT passthrough branch alone (author owns styling)', () => {
    // Complete documents render verbatim; our classes don't apply there, so we
    // must NOT inject the design system into them.
    const doc = '<!DOCTYPE html><html><head></head><body><p>x</p></body></html>';
    const out = buildFullHtml(doc);
    expect(out).not.toContain('.w-card {');
    expect(out).not.toContain('--w-primary:');
  });
});
