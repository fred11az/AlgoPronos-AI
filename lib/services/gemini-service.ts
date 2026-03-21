// AI Service — Groq (Llama 3.3 70B)
// Remplace Gemini Flash pour de meilleures analyses en français
// Get your free key: https://console.groq.com → API Keys
// Free tier: ~14 000 req/jour, 30 req/min

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

class GeminiService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
  }

  async chat(
    systemPrompt: string,
    userPrompt: string,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const { temperature = 0.7, maxTokens = 4096 } = options;

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('Groq API error:', error);
      throw error;
    }
  }

  async generateQuickPrediction(matchInfo: {
    homeTeam: string;
    awayTeam: string;
    league: string;
    odds?: { home: number; draw: number; away: number };
  }): Promise<{
    prediction: string;
    confidence: number;
    analysis: string;
  }> {
    const userPrompt = `Tu es un expert en paris sportifs. Analyse ce match:

${matchInfo.homeTeam} vs ${matchInfo.awayTeam}
Championnat: ${matchInfo.league}
${matchInfo.odds ? `Cotes: 1=${matchInfo.odds.home}, X=${matchInfo.odds.draw}, 2=${matchInfo.odds.away}` : ''}

Donne une prédiction concise avec:
1. Pronostic recommandé (1, X, 2, 1X, 12, X2, ou un score exact)
2. Confiance (0-100%)
3. Analyse courte (2-3 phrases max)

Réponds en JSON:
{"prediction": "...", "confidence": 75, "analysis": "..."}`;

    try {
      const response = await this.chat(
        'Tu es un expert en analyse de matchs de football. Réponds toujours en JSON valide.',
        userPrompt,
        { temperature: 0.5, maxTokens: 500 }
      );

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { prediction: 'X', confidence: 50, analysis: 'Analyse non disponible' };
    } catch (error) {
      console.error('Error generating quick prediction:', error);
      return { prediction: 'X', confidence: 50, analysis: 'Analyse non disponible' };
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }
}

export const geminiService = new GeminiService();

/*
GROQ API - FREE TIER INFO:
===========================
- Créer une clé: https://console.groq.com → API Keys
- Rate limits (gratuit):
  - 30 requêtes/minute
  - ~14 000 requêtes/jour
  - Modèle: llama-3.3-70b-versatile

Add to .env:
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
*/
