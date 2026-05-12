// Venice AI — OpenAI-compatible API, privacy-first, no data retention
// Docs: https://docs.venice.ai/api-reference
// Models: llama-3.3-70b (default), deepseek-r1-671b (reasoning), mistral-31-24b (fast)

const VENICE_API_URL = 'https://api.venice.ai/api/v1/chat/completions';

export function getVeniceModel(): string {
  return process.env.VENICE_MODEL || 'llama-3.3-70b';
}

export async function callVenice(
  systemPrompt: string,
  userPrompt: string,
  options: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
    timeoutMs?: number;
  } = {},
): Promise<string> {
  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) throw new Error('No VENICE_API_KEY configured');

  const {
    maxTokens = 2000,
    temperature = 0.3,
    model = getVeniceModel(),
    timeoutMs = 45000,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(VENICE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Venice AI ${res.status}: ${err.substring(0, 200)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    if (!content) throw new Error('Venice AI returned empty content');
    return content;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('Venice AI timeout after ' + timeoutMs + 'ms');
    throw err;
  }
}

// Parse JSON from AI response (handles markdown code blocks)
export function parseAIJson<T>(content: string): T | null {
  try {
    const stripped = content.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return null;
  }
}
