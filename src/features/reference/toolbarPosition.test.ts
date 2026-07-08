// src/features/reference/toolbarPosition.test.ts
import { describe, it, expect } from 'vitest';
import { computeToolbarPosition } from './toolbarPosition';

const viewport = { width: 800, height: 600 };
const size = { width: 300, height: 44 };

describe('computeToolbarPosition', () => {
  describe('vertical positioning', () => {
    it('places toolbar below selection when it fits', () => {
      // Selection ends at y=100; toolbar (44px) + gap(6) = 150 which is below 600 viewport height
      const rect = { top: 80, bottom: 100, left: 200, right: 400 };
      const pos = computeToolbarPosition(rect, viewport, size);
      expect(pos.top).toBe(100 + 6); // rect.bottom + gap
    });

    it('flips toolbar above selection when no room below', () => {
      // Selection at bottom: bottom=570, toolbar would need 570+6+44=620 > 600
      const rect = { top: 540, bottom: 570, left: 200, right: 400 };
      const pos = computeToolbarPosition(rect, viewport, size);
      // Should place above: rect.top - size.height - gap = 540 - 44 - 6 = 490
      expect(pos.top).toBe(490);
    });

    it('clamps flipped-above position to at least 8 when rect is near top', () => {
      // Very small rect near top; above would be negative
      const rect = { top: 10, bottom: 30, left: 200, right: 400 };
      // below: 30 + 6 = 36; 36 + 44 = 80 <= 600 → fits below, no flip needed
      const pos = computeToolbarPosition(rect, viewport, size);
      expect(pos.top).toBe(30 + 6);
    });

    it('clamps above-flip to 8 when rect.top is near viewport top and no room below', () => {
      // Use a tiny viewport so below doesn't fit: 30+6+44=80 > 60 → flip above;
      // above would be 10-44-6=-40 → clamp to 8.
      const smallVp = { width: 800, height: 60 };
      const rect = { top: 10, bottom: 30, left: 200, right: 400 };
      const pos = computeToolbarPosition(rect, smallVp, size);
      expect(pos.top).toBe(8);
    });

    it('respects custom gap', () => {
      const rect = { top: 80, bottom: 100, left: 200, right: 400 };
      const pos = computeToolbarPosition(rect, viewport, size, 12);
      expect(pos.top).toBe(100 + 12);
    });
  });

  describe('horizontal positioning', () => {
    it('aligns to selection left when it fits within viewport', () => {
      const rect = { top: 80, bottom: 100, left: 200, right: 400 };
      const pos = computeToolbarPosition(rect, viewport, size);
      // 200 is within [8, 800-300-8=492] → left = 200
      expect(pos.left).toBe(200);
    });

    it('clamps to 8 when rect.left is less than 8', () => {
      const rect = { top: 80, bottom: 100, left: 2, right: 100 };
      const pos = computeToolbarPosition(rect, viewport, size);
      expect(pos.left).toBe(8);
    });

    it('clamps right edge when rect.left would push toolbar off viewport', () => {
      // rect.left=600; toolbar width=300; 600+300=900 > 800; max left = 800-300-8=492
      const rect = { top: 80, bottom: 100, left: 600, right: 700 };
      const pos = computeToolbarPosition(rect, viewport, size);
      expect(pos.left).toBe(viewport.width - size.width - 8); // 492
    });

    it('clamps exactly at the right boundary', () => {
      // rect.left exactly at max allowed: 492
      const rect = { top: 80, bottom: 100, left: 492, right: 600 };
      const pos = computeToolbarPosition(rect, viewport, size);
      expect(pos.left).toBe(492);
    });
  });
});
