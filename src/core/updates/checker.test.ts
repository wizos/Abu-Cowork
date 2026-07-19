import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSettingsStore } from '@/stores/settingsStore';

// Controllable UI locale (checker.ts picks notes by getLocale()).
let mockLocale: 'zh-CN' | 'en-US' = 'zh-CN';
vi.mock('@/i18n', async (importActual) => {
  const actual = await importActual<typeof import('@/i18n')>();
  return { ...actual, getLocale: () => mockLocale };
});

// Tauri updater: check() returns our fake Update (body = English notes).
const mockCheck = vi.fn();
vi.mock('@tauri-apps/plugin-updater', () => ({
  check: () => mockCheck(),
}));

// Silence the notice bus (irrelevant to notes-language behavior).
vi.mock('@/core/notice/bus', () => ({ publish: vi.fn() }));

import { checkForUpdate } from './checker';

const EN_BODY = 'English release notes for v0.32.0 — multi-tab workspace and more.';
const ZH_NOTES = '中文更新说明：多页签工作区、卡片化改版等，内容足够长以通过丰富度判断。';

function fakeUpdate() {
  return { version: 'v0.32.0', date: '2026-07-19T00:00:00Z', body: EN_BODY };
}

function mockLatestJson(notesI18n: Record<string, string> | undefined) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: 'v0.32.0', notes: EN_BODY, notes_i18n: notesI18n }),
    }),
  );
}

describe('checkForUpdate — locale-aware release notes', () => {
  beforeEach(() => {
    mockCheck.mockReset();
    mockCheck.mockResolvedValue(fakeUpdate());
    useSettingsStore.setState({ lastUpdateCheck: 0, updateInfo: null, updateChecking: false });
    mockLocale = 'zh-CN';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('zh-CN user gets the Chinese notes from latest.json notes_i18n', async () => {
    mockLatestJson({ 'zh-CN': ZH_NOTES, 'en-US': EN_BODY });

    const info = await checkForUpdate(true);

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(info?.releaseNotes).toBe(ZH_NOTES);
    expect(useSettingsStore.getState().updateInfo?.releaseNotes).toBe(ZH_NOTES);
  });

  it('en-US user keeps the English updater body and does NOT refetch latest.json', async () => {
    mockLocale = 'en-US';
    vi.stubGlobal('fetch', vi.fn());

    const info = await checkForUpdate(true);

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(info?.releaseNotes).toBe(EN_BODY);
  });

  it('falls back to the English body when latest.json fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const info = await checkForUpdate(true);

    expect(info?.releaseNotes).toBe(EN_BODY);
  });

  it('falls back to the English body when notes_i18n lacks the locale', async () => {
    mockLatestJson({ 'en-US': EN_BODY }); // no zh-CN key

    const info = await checkForUpdate(true);

    expect(info?.releaseNotes).toBe(EN_BODY);
  });
});
