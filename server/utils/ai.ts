import { HTTPError } from 'nitro/h3';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIProviderOptions {
  model: string;
  messages: AIMessage[];
  token: string;
}

export interface AIProvider {
  chat(options: AIProviderOptions): Promise<string>;
}

export const GeminiProvider: AIProvider = {
  async chat({ model, messages, token }) {
    // Note: Gemini API native endpoint format
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    
    // Map OpenAI standard messages to Gemini contents
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': token
      },
      body: JSON.stringify({ contents })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      throw new HTTPError('Error from Gemini Provider', { status: response.status });
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response content";
  }
};

export const OpenAIProvider: AIProvider = {
  async chat({ model, messages, token }) {
    const endpoint = 'https://api.openai.com/v1/chat/completions';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ model, messages })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', errorText);
      throw new HTTPError('Error from OpenAI Provider', { status: response.status });
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response content";
  }
};

export const OpenRouterProvider: AIProvider = {
  async chat({ model, messages, token }) {
    const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ model, messages })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error:', errorText);
      throw new HTTPError('Error from OpenRouter Provider', { status: response.status });
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response content";
  }
};

export function getAIProvider(providerName: string): AIProvider {
  switch (providerName.toLowerCase()) {
    case 'gemini': return GeminiProvider;
    case 'openai': return OpenAIProvider;
    case 'openrouter': return OpenRouterProvider;
    default:
      throw new HTTPError('Unsupported AI provider', { status: 400 });
  }
}
