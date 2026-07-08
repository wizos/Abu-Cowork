// src/features/reference/toolbarPosition.ts

export interface Rectish {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Compute a `position: fixed` {left, top} for the selection toolbar so it
 * stays fully within the viewport.
 *
 * Horizontal: align to the selection's left edge, clamped to [8, vw - width - 8].
 * Vertical: prefer below the selection (bottom + gap); flip above when it would
 * overflow the viewport bottom.
 */
export function computeToolbarPosition(
  rect: Rectish,
  viewport: { width: number; height: number },
  size: { width: number; height: number },
  gap = 6,
): { left: number; top: number } {
  // Horizontal: prefer aligning to selection left, clamp within [8, vw - width - 8]
  const left = Math.max(8, Math.min(rect.left, viewport.width - size.width - 8));

  // Vertical: below the selection if it fits, else flip above
  const below = rect.bottom + gap;
  const top =
    below + size.height <= viewport.height
      ? below
      : Math.max(8, rect.top - size.height - gap);

  return { left, top };
}
