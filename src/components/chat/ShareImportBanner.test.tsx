/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import ShareImportBanner from './ShareImportBanner';
import type { Conversation } from '@/types';

afterEach(cleanup);

function makeConv(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'c1',
    title: 'Shared from Alice',
    createdAt: 0,
    updatedAt: 0,
    messages: [],
    status: 'idle',
    ...overrides,
  };
}

describe('ShareImportBanner', () => {
  it('renders nothing when conversation is not read-only', () => {
    const { container } = render(<ShareImportBanner conversation={makeConv()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders banner with role=status when conversation.readOnly is true', () => {
    render(<ShareImportBanner conversation={makeConv({ readOnly: true })} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows imported date when importedFrom.importedAt is present', () => {
    const importedAt = Date.UTC(2026, 3, 20); // 2026-04-20
    render(
      <ShareImportBanner
        conversation={makeConv({
          readOnly: true,
          importedFrom: { schemaVersion: 1, importedAt },
        })}
      />,
    );
    // Locale-dependent formatting — just assert the year lands in the bar.
    expect(screen.getByRole('status').textContent).toMatch(/2026/);
  });

  it('omits the date segment when importedFrom is missing', () => {
    render(<ShareImportBanner conversation={makeConv({ readOnly: true })} />);
    const bar = screen.getByRole('status').textContent ?? '';
    expect(bar).not.toMatch(/\d{4}/);
  });
});
