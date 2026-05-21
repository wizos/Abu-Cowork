import { getDeviceId } from './deviceId'
import { APP_VERSION } from './version'

const CONSOLE_URL = import.meta.env.VITE_CONSOLE_URL as string | undefined

export function sendFeedback(
  rating: 'positive' | 'negative' | 'cancel',
  conversationId?: string,
  messageId?: string,
): void {
  if (!CONSOLE_URL) return

  fetch(`${CONSOLE_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceId: getDeviceId(),
      conversationId,
      messageId,
      rating,
      appVersion: APP_VERSION,
    }),
  }).catch(() => {})
}
