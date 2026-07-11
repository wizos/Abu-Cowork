import type { LLMProvider, ApiFormat } from '@/types';
import type { ModelDeclaredCapabilities } from '@/types/provider';
import { deriveDeclaredDefaults } from '@/core/llm/modelCapabilities';

/** Whether the "advanced config" (declared capabilities) section should show.
 *  Any custom provider (openai-compatible OR anthropic format), or local
 *  Ollama / LM Studio. Builtin cloud providers → false.
 *  Anthropic-format custom endpoints are often proxies fronting non-Claude
 *  models, so tools/vision/token-limit declarations are still meaningful;
 *  the fields that don't apply (useRawUrl, reasoning-effort) are hidden by
 *  AdvancedCapabilitiesFields based on apiFormat. */
export function computeShowAdvanced(
  isCustom: boolean,
  provider: LLMProvider | undefined,
  apiFormat: ApiFormat | undefined,
): boolean {
  return (isCustom && (apiFormat === 'openai-compatible' || apiFormat === 'anthropic'))
    || provider === 'ollama' || provider === 'lmstudio';
}

/** Toggle one effort level in the supportedEfforts array (order-preserving add/remove). */
export function toggleEffort(
  current: Array<'low' | 'medium' | 'high'> | undefined,
  effort: 'low' | 'medium' | 'high',
): Array<'low' | 'medium' | 'high'> {
  const set = new Set(current ?? []);
  if (set.has(effort)) set.delete(effort); else set.add(effort);
  return [...set];
}

/** Defaults for a newly added custom model (per-model), derived from the model id via
 *  `resolveCapabilities` (the same source of truth the UI capability badges use) —
 *  so a recognized vision model like `gpt-4o` seeds `supportsImages: true` instead of
 *  a hardcoded `false` (which used to silently disable vision at runtime). Unrecognized
 *  ids stay conservative (`supportsImages: false`) to avoid declaring vision for a model
 *  that may not actually support it. Tools always default on — no tools axis in
 *  `ModelCapabilities`. Intentionally omits `useRawUrl` — that's an endpoint-level
 *  setting, tracked in a sibling `useRawUrl` state, not part of per-model declared
 *  capabilities. */
export function defaultModelDeclaredCapabilities(modelId: string): ModelDeclaredCapabilities {
  return deriveDeclaredDefaults(modelId);
}
