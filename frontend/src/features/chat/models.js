const models = {
  openai: [
    // GPT-5.2
    'gpt-5.2',
    // 'gpt-5.2-codex',
    // 'gpt-5.2-chat',
    // 'gpt-5.2-pro',

    // GPT-5.1
    'gpt-5.1',
    // 'gpt-5.1-chat',
    // 'gpt-5.1-codex',
    // 'gpt-5.1-codex-max',

    // GPT-5
    'gpt-5',
    // 'gpt-5-chat',
    // 'gpt-5-codex',
    // 'gpt-5-pro',
    'gpt-5-mini',
    'gpt-5-nano',

    // O-series
    // 'o3-pro',
    'o3',
    'o3-mini',
    'o4-mini',
    // 'o1-pro',
    'o1',
    // 'o1-preview',
    // 'o1-mini',

    // GPT-4.x family
    'gpt-4o-search-preview',
    'gpt-4o-mini-search-preview',
    // 'gpt-4.5-preview',
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-4o-2024-05-13',
    'gpt-4o-2024-08-06',
    'gpt-4o-2024-11-20',

    // GPT-4 classic
    'gpt-4',
    'gpt-4-turbo',
    'gpt-4-turbo-preview',

    // GPT-3.5
    // 'gpt-3.5-16k',
    // 'gpt-3.5-1106',
    // 'gpt-3.5-0125'
  ],

  anthropic: [
    'claude-opus-4.5',
    'claude-sonnet-4.5',
    'claude-haiku-4.5',
    'claude-sonnet-4.5-1m',
    'claude-opus-4.1',
    'claude-sonnet-4',
    'claude-sonnet-4-1m',
    'claude-opus-4',

    // 'claude-sonnet-3.7',
    // 'claude-sonnet-3.5',
    // 'claude-sonnet-3.5-2024-06',
    // 'claude-opus-3',
    // 'claude-sonnet-3',
    // 'claude-haiku-3',
    // 'claude-haiku-3.5'
  ],

  gemini: [
    // 'gemini-3-pro-image',
    // 'gemini-3-flash',
    'gemini-3-pro',

    'gemini-2.5-flash-image',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite-preview',
    'gemini-2.0-flash-lite',
    'gemini-2.0-pro-experimental',
    'gemini-experimental-1114',
    'gemini-experimental-1121',
    'gemini-experimental-1206',
    'gemini-2.0-flash-experimental',
    'gemini-2.0-flash-thinking-experimental',
    'gemini-2.5-flash-preview-04',
    'gemini-2.5-flash-05-20',
    'gemini-2.5-flash',
    'gemini-2.5-flash-09-25',
    'gemini-2.5-flash-lite-06-17',
    'gemini-2.5-flash-lite-09-25',
    'gemini-2.5-pro-preview-03-25',
    'gemini-2.5-pro-05-06'
  ],

  groq: [
    // 'groq/mixtral-8x7b-32768',
    // 'groq/llama3-8b-8192',
    // 'groq/llama3-70b-8192',
    'groq/llama-3.3-70b-versatile',
    'groq/llama-3.1-8b-instant'
  ]
};

export default models;
