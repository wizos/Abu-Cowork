/// <reference types="@testing-library/jest-dom" />
/**
 * Codex-style staging strip: queued mid-task messages render as light-gray
 * pills at the composer's top-right edge, each cancellable — they are NOT
 * transcript bubbles until the loop consumes them.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QueuedMessagesStrip from './QueuedMessagesStrip';
import {
  enqueueUserInput,
  clearInputQueue,
  getQueuedInputs,
} from '@/core/agent/userInputQueue';

vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: {
      queueStrip: {
        queuedHint: '已排队',
        cancel: '取消排队',
      },
    },
  }),
}));

const CONV = 'conv-strip';

describe('QueuedMessagesStrip', () => {
  beforeEach(() => clearInputQueue(CONV));
  afterEach(() => {
    cleanup();
    clearInputQueue(CONV);
  });

  it('renders nothing when the queue is empty', () => {
    const { container } = render(<QueuedMessagesStrip conversationId={CONV} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a pill per queued message', () => {
    enqueueUserInput(CONV, '数完说你好');
    enqueueUserInput(CONV, '再说声晚安');
    render(<QueuedMessagesStrip conversationId={CONV} />);
    expect(screen.getByText('数完说你好')).toBeInTheDocument();
    expect(screen.getByText('再说声晚安')).toBeInTheDocument();
  });

  it('hides system-injected queue items', () => {
    enqueueUserInput(CONV, '后台结果', true);
    const { container } = render(<QueuedMessagesStrip conversationId={CONV} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('the × cancels a queued message before consumption', async () => {
    const user = userEvent.setup();
    enqueueUserInput(CONV, '取消我');
    render(<QueuedMessagesStrip conversationId={CONV} />);

    await user.click(screen.getByLabelText('取消排队'));

    expect(screen.queryByText('取消我')).not.toBeInTheDocument();
    expect(getQueuedInputs(CONV)).toHaveLength(0);
  });
});
