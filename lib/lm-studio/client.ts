// @/lib/lm-studio/client.ts
import { LMStudioClient } from '@lmstudio/sdk';

export interface ModelInfo {
  path: string;
  type: string;
  size?: number;
  architecture?: string;
  capabilities?: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
}

class LMStudioService {
  private client: LMStudioClient | null = null;
  private baseUrl: string = process.env.LMSTUDIO_BASE_URL || 'ws://127.0.0.1:1234';
  private loadedModels: Record<string, any> = {}; // Cache loaded models

  /** Connect to LMStudio WS client */
  async connect(): Promise<void> {
    if (this.client) return;
    try {
      this.client = new LMStudioClient({ baseUrl: this.baseUrl });
    } catch (err) {
      console.warn('LMStudioClient connection warning:', err);
      this.client = null;
    }
  }

  private async fetchJson(path: string, opts: RequestInit = {}) {
    const url = this.baseUrl.replace(/^ws/, 'http').replace(/\/$/, '') + path;
    const res = await fetch(url, opts);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const e: any = new Error(`HTTP ${res.status} ${res.statusText}`);
      e.status = res.status;
      e.body = body;
      throw e;
    }
    return res.json();
  }

  /** Health check */
  async healthCheck(): Promise<boolean> {
    await this.connect();
    if (this.client) {
      try {
        const sdkModels = await this.client.system.listDownloadedModels();
        if (Array.isArray(sdkModels)) return true;
      } catch {}
    }
    try {
      const json = await this.fetchJson('/v1/models', { method: 'GET' });
      return !!(json && Array.isArray(json.data));
    } catch {
      return false;
    }
  }

  /** List available models */
  async listModels(): Promise<ModelInfo[]> {
    await this.connect();
    if (this.client) {
      try {
        const models = await this.client.system.listDownloadedModels();
        return (models || []).map((m: any) => ({
          path: m.id ?? m.path ?? String(m),
          type: m.type ?? 'model',
          size: m.sizeBytes ?? m.size,
          architecture: m.architecture,
          capabilities: ['chat', 'completion'],
        }));
      } catch {}
    }

    const json = await this.fetchJson('/v1/models', { method: 'GET' });
    const data = Array.isArray(json.data) ? json.data : [];
    return data.map((m: any) => ({
      path: m.id ?? m.path ?? String(m),
      type: m.type ?? 'model',
      size: m.sizeBytes ?? m.size,
      architecture: m.architecture,
      capabilities: ['chat', 'completion'],
    }));
  }

  /** Load a model (cached) */
  async loadModel(modelPath: string) {
    await this.connect();
    if (this.loadedModels[modelPath]) return this.loadedModels[modelPath];
    if (!this.client) throw new Error('LMStudio SDK unavailable.');
    const model = await this.client.llm.load(modelPath);
    this.loadedModels[modelPath] = model;
    return model;
  }

  /** Streaming chat using WS SDK */
  async *streamChat(modelPath: string, messages: ChatMessage[], options: StreamOptions = {}) {
    const model = await this.loadModel(modelPath);
    const validOptions: Record<string, any> = {};
    if (options.temperature !== undefined) validOptions.temperature = options.temperature;
    if (options.topP !== undefined) validOptions.topP = options.topP;
    if (options.stopSequences !== undefined) validOptions.stopStrings = options.stopSequences;

    const prediction = model.respond(
      messages.map((m) => ({ role: m.role, content: m.content })),
      validOptions
    );

    for await (const chunk of prediction) {
      if (typeof chunk === 'string') yield chunk;
      else if (chunk && 'content' in chunk) yield String(chunk.content);
    }
  }

  /** Non-streaming chat (await full response) */
  async chat(modelPath: string, messages: ChatMessage[], options: StreamOptions = {}): Promise<string> {
    let out = '';
    for await (const chunk of this.streamChat(modelPath, messages, options)) {
      out += chunk;
    }
    return out;
  }

  /** HTTP fallback chat */
  async httpChat(modelPath: string, messages: ChatMessage[], options: StreamOptions = {}) {
    const payload = { model: modelPath, messages, ...options };
    const json = await this.fetchJson('/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return json.response ?? json.output ?? '';
  }

  /** Disconnect SDK client */
  disconnect(): void {
    this.client = null;
    this.loadedModels = {};
  }
}

export const lmStudioService = new LMStudioService();
