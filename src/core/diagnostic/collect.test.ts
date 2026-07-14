import { describe, it, expect } from 'vitest';
import { capDiagnosticMessages, DEFAULT_DIAGNOSTIC_MESSAGE_CAP } from './collect';

describe('capDiagnosticMessages (Bug 2: 导出诊断包冻死)', () => {
  const many = Array.from({ length: 250 }, (_, i) => ({ id: `m${i}` }));

  it('keeps only the last N messages when over the cap, reporting the total', () => {
    const r = capDiagnosticMessages(many, 200);
    expect(r.capped).toBe(true);
    expect(r.total).toBe(250);
    expect(r.messages).toHaveLength(200);
    expect(r.messages[0].id).toBe('m50');       // dropped the oldest 50
    expect(r.messages[199].id).toBe('m249');    // kept the most recent
  });

  it('returns everything untouched when under the cap', () => {
    const few = many.slice(0, 10);
    const r = capDiagnosticMessages(few, 200);
    expect(r.capped).toBe(false);
    expect(r.total).toBe(10);
    expect(r.messages).toBe(few);               // same reference — no copy
  });

  it("'all' disables the cap even for huge conversations", () => {
    const r = capDiagnosticMessages(many, 'all');
    expect(r.capped).toBe(false);
    expect(r.messages).toHaveLength(250);
  });

  it('cap 0 embeds NO messages (not everything — slice(-0) trap)', () => {
    const r = capDiagnosticMessages(many, 0);
    expect(r.messages).toHaveLength(0);
    expect(r.total).toBe(250);
    expect(r.capped).toBe(true);
  });

  it('has a sane default cap', () => {
    expect(DEFAULT_DIAGNOSTIC_MESSAGE_CAP).toBe(200);
  });

  // message-storage P1 step 4: authoritativeTotal
  describe('authoritativeTotal (windowed conversations)', () => {
    it('reports the authoritative total when the in-memory array is a partial window', () => {
      // Only 150 messages loaded in memory (a window), but the catalog knows
      // the conversation really has 500. Cap is 200.
      const window = Array.from({ length: 150 }, (_, i) => ({ id: `w${i}` }));
      const r = capDiagnosticMessages(window, 200, 500);
      // total must reflect the authoritative count, not the window length.
      expect(r.total).toBe(500);
      // We only had 150 in memory, all kept, but it's capped relative to history.
      expect(r.messages).toHaveLength(150);
      expect(r.capped).toBe(true);
    });

    it('keeps the last N and reports authoritative total when the window itself exceeds the cap', () => {
      const window = Array.from({ length: 250 }, (_, i) => ({ id: `w${i}` }));
      const r = capDiagnosticMessages(window, 200, 900);
      expect(r.total).toBe(900);
      expect(r.messages).toHaveLength(200);
      expect(r.messages[0].id).toBe('w50');
      expect(r.capped).toBe(true);
    });

    it('falls back to messages.length when authoritativeTotal is omitted', () => {
      const window = Array.from({ length: 250 }, (_, i) => ({ id: `w${i}` }));
      const r = capDiagnosticMessages(window, 200);
      expect(r.total).toBe(250);
    });

    it('falls back to messages.length when authoritativeTotal is undefined', () => {
      const few = Array.from({ length: 10 }, (_, i) => ({ id: `w${i}` }));
      const r = capDiagnosticMessages(few, 200, undefined);
      expect(r.total).toBe(10);
      expect(r.capped).toBe(false);
    });
  });
});
