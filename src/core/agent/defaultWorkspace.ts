/**
 * Default workspace — when an interactive-desktop conversation has no workspace,
 * point the agent at a managed default `~/Abu/<name>/` so it saves files there
 * instead of improvising (e.g. dumping onto the Desktop).
 *
 * LAZY binding: at loop start we only *suggest + authorize* the path (so the
 * system prompt directs the agent and the write isn't blocked). We do NOT bind
 * it to the conversation — a chat-only conversation must not show an empty,
 * non-existent workspace. `write_file` calls `bindWorkspaceFromWrite` on the
 * first successful write under `~/Abu/`, which is when the folder actually
 * exists and the workspace becomes real (file tree / workspace card appear).
 *
 * Only interactive-desktop conversations get this — IM / scheduled / trigger
 * runs are headless. That gate lives at the call sites.
 */

import { homeDir } from '@tauri-apps/api/path';
import { joinPath, normalizeSeparators } from '@/utils/pathUtils';
import { authorizeWorkspace } from '@/core/tools/pathSafety';
import { useChatStore } from '@/stores/chatStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { usePermissionStore } from '@/stores/permissionStore';
import { getI18n } from '@/i18n';

/** Managed default-workspace root under the user's home directory. */
const ABU_ROOT_DIR = 'Abu';
const MAX_NAME_LEN = 40;

// Control chars + path-hostile characters. Hyphens are kept (valid in folder
// names); spaces are handled by the whitespace collapse in sanitizeWorkspaceName.
// eslint-disable-next-line no-control-regex
const PATH_HOSTILE = new RegExp('[\\u0000-\\u001f/\\\\:*?"<>|]', 'g');

/**
 * Turn a conversation title into a safe single-segment folder name, or null if
 * it yields nothing usable. Strips path-hostile characters, collapses
 * whitespace, trims trailing dots/spaces (Windows-hostile), and caps length.
 */
export function sanitizeWorkspaceName(title: string | undefined | null): string | null {
  if (!title) return null;
  const cleaned = title
    .replace(PATH_HOSTILE, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME_LEN)
    .replace(/[. ]+$/, '')
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}

/** Timestamp folder name `YYYY-MM-DD-HHmmss` (stable, unique, no title needed). */
export function timestampWorkspaceName(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

/**
 * Pick the base folder name for a conversation's default workspace: a sanitized
 * title when it's meaningful, else a timestamp (the title is often still the
 * generic "new task" default at loop start).
 */
export function computeDefaultWorkspaceName(title: string | undefined, date: Date): string {
  const genericTitle = getI18n().chatDefaults.newConversationTitle;
  const fromTitle = title && title !== genericTitle ? sanitizeWorkspaceName(title) : null;
  return fromTitle ?? timestampWorkspaceName(date);
}

/** `~/Abu`, or null if the home directory can't be resolved. */
async function getAbuRoot(): Promise<string | null> {
  try {
    const home = await homeDir();
    return joinPath(normalizeSeparators(home), ABU_ROOT_DIR);
  } catch {
    return null;
  }
}

/**
 * Suggest (and authorize) a managed default workspace `~/Abu/<name>/` for a
 * conversation that has none, WITHOUT binding it. Returns the path to feed the
 * system prompt so the agent saves there; the write is authorized so it isn't
 * blocked. Binding happens later, in `bindWorkspaceFromWrite`, on the first
 * write. Returns null if the home dir can't be resolved.
 */
export async function prepareSuggestedWorkspace(conversationId: string): Promise<string | null> {
  const conv = useChatStore.getState().conversations[conversationId];
  if (conv?.workspacePath) return conv.workspacePath;

  const root = await getAbuRoot();
  if (!root) return null;
  const suggested = joinPath(root, computeDefaultWorkspaceName(conv?.title, new Date()));

  // Authorize + grant so the eventual write under this path isn't blocked by
  // pathSafety / the permission gate. Not bound to the conversation yet.
  usePermissionStore.getState().grantPermission(suggested, ['read', 'write', 'execute'], 'always');
  authorizeWorkspace(suggested, ['read', 'write']);
  return suggested;
}

/**
 * Called after a successful `write_file`. If the conversation has no workspace
 * and the file was written under `~/Abu/`, bind `~/Abu/<top-level-folder>/` as
 * the conversation's workspace — this is the moment the default workspace
 * becomes real (the folder now exists), so the UI (file tree / workspace card)
 * can show it. No-op if already bound, or the write went elsewhere.
 */
export async function bindWorkspaceFromWrite(
  conversationId: string | undefined,
  writtenPath: string,
): Promise<void> {
  if (!conversationId) return;
  const chat = useChatStore.getState();
  const conv = chat.conversations[conversationId];
  if (!conv || conv.workspacePath) return;

  const root = await getAbuRoot();
  if (!root) return;
  const normPath = normalizeSeparators(writtenPath);
  const prefix = `${root}/`;
  if (!normPath.startsWith(prefix)) return; // only auto-bind writes under ~/Abu/

  const firstSegment = normPath.slice(prefix.length).split('/')[0];
  if (!firstSegment) return;
  const workspace = joinPath(root, firstSegment);

  usePermissionStore.getState().grantPermission(workspace, ['read', 'write', 'execute'], 'always');
  chat.setConversationWorkspace(conversationId, workspace);
  if (useChatStore.getState().activeConversationId === conversationId) {
    // setWorkspace also authorizes the path via pathSafety + records it in recents.
    useWorkspaceStore.getState().setWorkspace(workspace);
  } else {
    authorizeWorkspace(workspace);
  }
}
