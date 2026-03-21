// Claude AI Service - Anthropic API
// Remplace Gemini Flash pour des analyses de meilleure qualité
// Model: claude-haiku-4-5-20251001 (rapide) ou claude-sonnet-4-6 (qualité)

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export type ClaudeModel = 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6';

export async function callClaude(
  prompt: string,
  options: {
    system?: string;
    temperature?: number;
    maxTokens?: number;
    model?: ClaudeModel;
    timeoutMs?: number;
  } = {}
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return '';

  const {
    system,
    temperature = 0.5,
    maxTokens = 600,
    model = 'claude-haiku-4-5-20251001',
    timeoutMs = 30000,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const body: Record<string, unknown> = {
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    };
    if (system) body.system = system;
    // Note: temperature only supported on claude-sonnet/opus, not haiku via API directly
    // but we include it for compatibility
    if (model !== 'claude-haiku-4-5-20251001') body.temperature = temperature;

    const res = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[claude-ai] API error ${res.status}`);
      return '';
    }

    const data = await res.json();
    return data.content?.[0]?.text?.trim() || '';
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      console.warn('[claude-ai] Request timeout');
    } else {
      console.warn('[claude-ai] Error:', err);
    }
    return '';
  }
}
