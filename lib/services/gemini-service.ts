// Gemini Flash API Service - FREE AI Alternative
// Google Gemini Flash offers free API access via Google AI Studio
// Get your free key: https://aistudio.google.com → "Get API key"
// Model: gemini-2.0-flash (free tier: 15 req/min, 1500 req/day)

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
    };
  }[];
}

class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
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
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const {
      model = 'gemini-2.0-flash',
      temperature = 0.7,
      maxTokens = 4096,
    } = options;

    const url = `${this.baseUrl}/${model}:generateContent?key=${this.apiKey}`;

    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${error}`);
      }

      const data: GeminiResponse = await response.json();
      return data.candidates[0]?.content?.parts[0]?.text || '';
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  // Generate simple predictions
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
        { model: 'gemini-2.0-flash', temperature: 0.5, maxTokens: 500 }
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
GEMINI API - FREE TIER INFO:
=============================
- Créer une clé: https://aistudio.google.com → "Get API key"
- Rate limits (gratuit):
  - 15 requêtes/minute
  - 1 500 requêtes/jour
  - 1 million de tokens/minute

Available Models:
- gemini-2.0-flash: Rapide et gratuit (recommandé)
- gemini-1.5-flash: Alternative stable

Add to .env:
GEMINI_API_KEY=AIzaSy_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
*/
