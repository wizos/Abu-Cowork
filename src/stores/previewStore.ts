import { create } from 'zustand';

interface PreviewState {
  // Currently previewed file path
  previewFilePath: string | null;
  // Resizable chat-column width (px) while a preview is open; null = use default.
  // The preview column flex-fills whatever the chat leaves.
  chatWidth: number | null;
  // Bumped whenever the currently-previewed file changes on disk (fs watch)
  // or a caller explicitly requests a re-render. Purely ephemeral signal —
  // no meaning on its own beyond "different from last render". Not persisted
  // (this store has no `persist` middleware; it's in-memory UI state).
  reloadNonce: number;
  // Open file preview in right panel
  openPreview: (filePath: string) => void;
  // Close preview
  closePreview: () => void;
  // Set the chat-column width (during drag)
  setChatWidth: (width: number | null) => void;
  // Force the preview to re-read/re-render the current file (fs-watch driven
  // auto-refresh, or manual "reload" affordance).
  refreshPreview: () => void;
}

export const usePreviewStore = create<PreviewState>((set) => ({
  previewFilePath: null,
  chatWidth: null,
  reloadNonce: 0,

  openPreview: (filePath) => {
    // Switching to a different file already forces PreviewPanel's loadFile
    // effect to re-run (previewFilePath is a dep), so reloadNonce is left
    // untouched here. Re-opening the *same* path (no-op for React state)
    // relies on the caller invoking refreshPreview() explicitly.
    set({ previewFilePath: filePath });
  },

  closePreview: () => {
    set({ previewFilePath: null, chatWidth: null });
  },

  setChatWidth: (width) => {
    set({ chatWidth: width });
  },

  refreshPreview: () => {
    set((s) => ({ reloadNonce: s.reloadNonce + 1 }));
  },
}));
