import OpenAI from 'openai';

let _client = null;

export function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('[openai] OPENAI_API_KEY não configurada.');
  }
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}
