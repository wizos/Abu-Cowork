import { create } from 'zustand';

interface PreviewState {
  // Currently previewed file path
  previewFilePath: string | null;
  // Resizable chat-column width (px) while a preview is open; null = use default.
  // The preview column flex-fills whatever the chat leaves.
  chatWidth: number | null;
  // Open file preview in right panel
  openPreview: (filePath: string) => void;
  // Close preview
  closePreview: () => void;
  // Set the chat-column width (during drag)
  setChatWidth: (width: number | null) => void;
}

export const usePreviewStore = create<PreviewState>((set) => ({
  previewFilePath: null,
  chatWidth: null,

  openPreview: (filePath) => {
    set({ previewFilePath: filePath });
  },

  closePreview: () => {
    set({ previewFilePath: null, chatWidth: null });
  },

  setChatWidth: (width) => {
    set({ chatWidth: width });
  },
}));
