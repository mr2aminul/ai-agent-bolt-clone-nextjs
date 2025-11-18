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
  private baseUrl: string = 'ws://localhost:1234';

  async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    try {
      this.client = new LMStudioClient({ baseUrl: this.baseUrl });
    } catch (error) {
      console.error('Failed to connect to LM Studio:', error);
      throw new Error('Unable to connect to LM Studio. Please ensure LM Studio is running.');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.connect();
      const models = await this.client!.system.listDownloadedModels();
      return models !== null;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      await this.connect();
      const models = await this.client!.system.listDownloadedModels();

      return models.map((model) => ({
        path: model.path,
        type: model.type || 'unknown',
        size: model.sizeBytes,
        architecture: model.architecture,
        capabilities: ['chat', 'completion'],
      }));
    } catch (error) {
      console.error('Failed to list models:', error);
      throw new Error('Failed to fetch available models');
    }
  }

  async loadModel(modelPath: string) {
    try {
      await this.connect();
      return await this.client!.llm.load(modelPath);
    } catch (error) {
      console.error('Failed to load model:', error);
      throw new Error(`Failed to load model: ${modelPath}`);
    }
  }

  async *streamChat(
    modelPath: string,
    messages: ChatMessage[],
    options: StreamOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    try {
      await this.connect();
      const model = await this.loadModel(modelPath);

      const validOptions: Record<string, any> = {};

      if (options.temperature !== undefined) {
        validOptions.temperature = options.temperature;
      }
      if (options.topP !== undefined) {
        validOptions.topP = options.topP;
      }
      if (options.stopSequences !== undefined) {
        validOptions.stopStrings = options.stopSequences;
      }

      const prediction = model.respond(
        messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        validOptions
      );

      for await (const chunk of prediction) {
        if (typeof chunk === 'string') {
          yield chunk;
        } else if (chunk && typeof chunk === 'object' && 'content' in chunk) {
          yield String((chunk as any).content);
        }
      }
    } catch (error) {
      console.error('Failed to stream chat:', error);
      throw new Error('Failed to generate response');
    }
  }

  async chat(
    modelPath: string,
    messages: ChatMessage[],
    options: StreamOptions = {}
  ): Promise<string> {
    let fullResponse = '';

    for await (const chunk of this.streamChat(modelPath, messages, options)) {
      fullResponse += chunk;
    }

    return fullResponse;
  }

  disconnect(): void {
    this.client = null;
  }
}

export const lmStudioService = new LMStudioService();
