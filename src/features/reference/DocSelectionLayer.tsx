// src/features/reference/DocSelectionLayer.tsx
import { useRef, useState, useCallback, useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useI18n } from '@/i18n';
import { useTextSelection, type TextSelectionResult } from './useTextSelection';
import { SelectionToolbar } from './SelectionToolbar';
import { markdownSelectionSource } from './markdownSelectionSource';
import { highlightRegistry } from './highlightRegistry';
import { getBaseName } from '@/utils/pathUtils';

/** 包裹文档预览内容：选区 → 工具条 → 生成引用 → 注入 chatStore + 高亮留痕。 */
export function DocSelectionLayer({ filePath, children }: { filePath: string; children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<TextSelectionResult | null>(null);
  const addPendingReference = useChatStore((s) => s.addPendingReference);
  const { t } = useI18n();

  const onSelect = useCallback((r: TextSelectionResult | null) => setSel(r), []);
  useTextSelection({ containerRef, onSelect });

  // Dismiss the toolbar on scroll or window resize: the toolbar uses `position: fixed`
  // with coordinates captured at selection time, so any scroll/resize makes the rect
  // stale and the toolbar floats away from its selection visually.
  // capture:true catches scrolls inside the Radix ScrollArea viewport (which don't
  // bubble to window). passive:true lets the browser handle scroll without blocking.
  // Note: no success-state flash is intentional — the composer chip is the feedback.
  useEffect(() => {
    if (!sel) return;
    const dismiss = () => setSel(null);
    window.addEventListener('scroll', dismiss, { capture: true, passive: true });
    window.addEventListener('resize', dismiss);
    return () => {
      window.removeEventListener('scroll', dismiss, { capture: true });
      window.removeEventListener('resize', dismiss);
    };
  }, [sel]);

  const commit = useCallback((comment?: string) => {
    if (!sel) return;
    const nativeSel = window.getSelection();
    const ref = markdownSelectionSource.extract(nativeSel!, {
      path: filePath,
      name: getBaseName(filePath),
    });
    if (ref) {
      if (comment) ref.comment = comment;
      addPendingReference(ref);
      highlightRegistry.add(ref.id, sel.range.cloneRange());
    }
    nativeSel?.removeAllRanges();
    setSel(null);
  }, [sel, filePath, addPendingReference]);

  return (
    <div ref={containerRef} data-doc-selection-layer aria-label={t.reference.addToChat}>
      {children}
      {sel && (
        <SelectionToolbar
          rect={sel.rect}
          onAdd={() => commit()}
          onComment={(c) => commit(c)}
          onDismiss={() => setSel(null)}
        />
      )}
    </div>
  );
}
