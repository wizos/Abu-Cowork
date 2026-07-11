/**
 * Widget design guidelines — the authoritative styling/structure rules for
 * `show_widget` output, served to the model via the `read_me` tool.
 *
 * Single source: both `read_me`'s result and any future doc/help surface
 * compose from the section constants below, so the rules never drift between
 * what's documented and what's enforced (the hard rules here mirror the
 * validation in `widgetTools.ts` — keep both in sync when either changes).
 * The design-system section is itself sourced from `designSystem.ts`
 * (`getDesignSystemGuideText()`), which generates its text from the exact
 * same constants that build the CSS shipped to the widget iframe — that's
 * what keeps documented vars/classes from drifting off the runtime CSS.
 *
 * P1 shipped one flat "hard rules" section covering every module uniformly.
 * P2 adds the always-present design-system section (vars/classes/examples)
 * plus keeps the per-module pointers; the `modules` filter parameter and
 * section-map structure exist so per-module growth doesn't require
 * reshaping the call sites in widgetTools.ts.
 */
import { getDesignSystemGuideText } from './designSystem';

/** Widget guideline module identifiers `read_me` accepts. */
export type WidgetGuidelineModule = 'diagram' | 'chart' | 'interactive' | 'mockup';

export const WIDGET_GUIDELINE_MODULES: readonly WidgetGuidelineModule[] = [
  'diagram',
  'chart',
  'interactive',
  'mockup',
];

/**
 * CDN hosts widgets may load scripts from — the single guidance-layer
 * source, reused by the hard rules below and by agentLoop's two
 * visual-output prompt variants. NOTE: HtmlWidgetBlock's iframe CSP keeps
 * its own deliberately larger list — that is the enforcement boundary (and
 * serves the fence-fallback path); this list is what we TELL models to use.
 */
export const WIDGET_CDN_HOSTS: readonly string[] = [
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'unpkg.com',
];

/**
 * Hard rules — apply to every widget regardless of module. These are
 * contract-level constraints; `widgetTools.ts`'s `showWidgetTool.execute()`
 * hard-rejects violations of the structural ones (fragment-only, no
 * position:fixed, no localStorage/sessionStorage, no <form>) rather than
 * just documenting them here.
 */
const HARD_RULES = `## Hard rules (apply to every widget)
- **Fragment only** — no \`<!DOCTYPE>\`, \`<html>\`, \`<head>\`, or \`<body>\` tags. Write the inner content only (style + markup + script).
- **No \`position: fixed\`** — widget height is auto-sized from in-flow content; fixed positioning breaks that measurement.
- **No \`localStorage\` / \`sessionStorage\`** — the widget renders in a sandboxed iframe with an opaque origin; storage APIs are unavailable.
- **No \`<form>\` elements** — use normal controls (buttons, inputs) with event handlers instead of form submission.
- **No initial-hidden reveal animations** — patterns like \`opacity: 0\` + scroll/IntersectionObserver reveal leave content permanently blank if the observer never fires in the preview context. Content must be visible on first paint; animate other properties (transform, color) if you want motion.
- **No \`100vh\` / viewport-height layouts and no internal scrolling** — the widget grows to fit its content in the conversation flow; it is not a standalone viewport.
- **CDN allowlist** — only load scripts from ${WIDGET_CDN_HOSTS.map((h) => `\`${h}\``).join(', ')}.
- **Size budget** — keep the fragment under ~1MB.
- **Optional \`window.sendPrompt(text)\`** — call this to send a short follow-up into the chat composer (max 500 characters; longer text is truncated). It fills the input box for the user to review, it does NOT auto-send — use it for things like a button that proposes a next question or action, not for anything the widget needs to happen silently.`;

/** Per-module guidance — brief, general-purpose pointers. Shared styling
 *  vocabulary (vars/classes) lives in the always-present design-system
 *  section instead of being duplicated per module. */
const MODULE_SECTIONS: Record<WidgetGuidelineModule, string> = {
  diagram: `## Diagrams
- Prefer inline SVG for flowcharts, trees, and simple node/edge graphics — it's crisp at any size and needs no CDN dependency.
- Keep label text legible: minimum ~12px, sufficient contrast against the background.`,
  chart: `## Charts
- Prefer inline SVG for simple charts (a handful of bars/points) — no library needed.
- For anything data-heavy (multi-series, tooltips, legends), use Chart.js loaded from the CDN allowlist.
- Canvas cannot resolve CSS custom properties (\`var(--...)\`) — use hardcoded hex colors for canvas-drawn content. The design-system section below documents fixed hex values for exactly this (\`--w-primary\`/\`--w-series-2..4\`); reuse those (they're chosen mid-tone to stay legible on both light and dark hosts) instead of inventing new ones, and avoid pure black/white extremes for canvas text or axes.`,
  interactive: `## Interactive widgets
- Wire real event handlers (click, input, change) directly on elements — no \`<form>\` submission flow.
- Keep state in-memory (plain JS variables/closures); there is no persistent storage available.`,
  mockup: `## UI mockups
- Build with plain HTML + CSS; avoid framework runtimes unless the user specifically asked for a live interactive prototype.
- Match Abu's light, uncluttered visual style rather than inventing a heavy custom theme.`,
};

/**
 * Compose the guidelines text for the requested modules (default: all).
 * Unknown module names are ignored rather than erroring — `read_me` treats
 * this as a best-effort filter, not a strict schema.
 */
export function getWidgetGuidelines(modules?: readonly string[]): string {
  const requested = modules && modules.length > 0
    ? WIDGET_GUIDELINE_MODULES.filter((m) => modules.includes(m))
    : WIDGET_GUIDELINE_MODULES;

  const sections = [HARD_RULES, getDesignSystemGuideText(), ...requested.map((m) => MODULE_SECTIONS[m])];
  return sections.join('\n\n');
}
