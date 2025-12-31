// Groq API Service - FREE AI Alternative
// Groq offers free API access with high rate limits
// Uses Llama 3.1 70B, Mixtral, and other fast models
// Website: https://console.groq.com/ (create free account for API key)

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class GroqService {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
  }

  async chat(
    messages: GroqMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const {
      model = 'llama-3.1-70b-versatile', // Free and very capable
      temperature = 0.7,
      maxTokens = 4096,
    } = options;

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${error}`);
      }

      const data: GroqResponse = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Groq API error:', error);
      throw error;
    }
  }

  // Generate simple predictions (can be used for basic analysis)
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
    const prompt = `Tu es un expert en paris sportifs. Analyse ce match:

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
      const response = await this.chat([
        { role: 'system', content: 'Tu es un expert en analyse de matchs de football. Réponds toujours en JSON valide.' },
        { role: 'user', content: prompt },
      ], {
        model: 'llama-3.1-8b-instant', // Faster model for simple tasks
        temperature: 0.5,
        maxTokens: 500,
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        prediction: 'X',
        confidence: 50,
        analysis: 'Analyse non disponible',
      };
    } catch (error) {
      console.error('Error generating quick prediction:', error);
      return {
        prediction: 'X',
        confidence: 50,
        analysis: 'Analyse non disponible',
      };
    }
  }

  // Check if Groq is available
  isAvailable(): boolean {
    return !!this.apiKey;
  }
}

export const groqService = new GroqService();

/*
GROQ API - FREE TIER INFO:
==========================
- Create account: https://console.groq.com/
- Rate limits (free):
  - 30 requests/minute for most models
  - 14,400 requests/day
  - Very fast inference (1000+ tokens/second)

Available Models:
- llama-3.1-70b-versatile: Best for complex tasks
- llama-3.1-8b-instant: Fast for simple tasks
- mixtral-8x7b-32768: Good balance
- llama3-groq-70b-8192-tool-use-preview: Tool use

Add to .env:
GROQ_API_KEY=gsk_xxxxxxxxx
*/
