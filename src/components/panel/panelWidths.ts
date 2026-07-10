// Shared layout widths for the chat + preview split (TRAE-style model).
//
// When a file preview is open, the CHAT column takes a stable width and the
// PREVIEW column flex-fills the rest. Opening the sidebar shrinks the *preview*,
// not the chat — so neither the 2-column nor the 3-column layout ever crushes the
// chat. See RightPanel.tsx (preview = flex-1) and App.tsx (chat = explicit width).
//
// The chat default is a fraction of the window so the preview stays the big "main
// stage" (~60%, matching Trae) on any monitor, bounded so the chat stays readable.

import { useEffect, useState } from 'react';

export const SIDEBAR_WIDTH = 260;        // Must match App.tsx sidebar fixed width
export const CHAT_RATIO = 0.40;          // Chat ≈ 40% of the window → preview ≈ 60%
export const CHAT_MIN_WIDTH = 480;       // Chat never narrower than this (fits the composer row)
export const CHAT_MAX_WIDTH = 820;       // Upper bound so the preview keeps the majority
export const PREVIEW_MIN_WIDTH = 460;    // Preview column keeps at least this much

export function getViewportWidth(): number {
  return typeof window !== 'undefined' ? window.innerWidth : 1440;
}

// Largest chat width that still leaves the preview its minimum, given sidebar state.
function maxChatWidth(viewportWidth: number, sidebarOpen: boolean): number {
  const available = viewportWidth - (sidebarOpen ? SIDEBAR_WIDTH : 0);
  return Math.max(CHAT_MIN_WIDTH, Math.min(CHAT_MAX_WIDTH, available - PREVIEW_MIN_WIDTH));
}

// Clamp a chat width into [CHAT_MIN_WIDTH, maxChatWidth].
export function clampChatWidth(width: number, viewportWidth: number, sidebarOpen: boolean): number {
  return Math.max(CHAT_MIN_WIDTH, Math.min(width, maxChatWidth(viewportWidth, sidebarOpen)));
}

// Resolve the on-screen chat width: the user's dragged value (if any) falls back to
// the window-proportional default, then is clamped to the viewport + sidebar state.
// Computed at render time so it restores toward the default when space frees up
// (e.g. the sidebar collapses) instead of staying stuck at an earlier shrunk value.
export function resolveChatWidth(chatWidth: number | null, viewportWidth: number, sidebarOpen: boolean): number {
  const preferred = chatWidth ?? Math.round(viewportWidth * CHAT_RATIO);
  return clampChatWidth(preferred, viewportWidth, sidebarOpen);
}

// Reactive window.innerWidth so the layout re-clamps on resize.
export function useViewportWidth(): number {
  const [width, setWidth] = useState<number>(getViewportWidth);
  useEffect(() => {
    const onResize = () => setWidth(getViewportWidth());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
}
