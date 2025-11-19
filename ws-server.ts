// ws-server.ts
import { WebSocketServer } from 'ws';
import { lmStudioService, ChatMessage } from '@/lib/lm-studio/client';
import { contextManager } from '@/lib/lm-studio/context-manager';

interface WSRequest {
  messages: ChatMessage[];
  modelPath: string;
  agentType?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  contextConfig?: {
    maxTokens?: number;
    includeFileContext?: boolean;
    fileContextPaths?: string[];
  };
}

const wss = new WebSocketServer({ port: 1235 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  let streaming = false; // prevent concurrent streams per client

  ws.on('message', async (msg) => {
    if (streaming) {
      ws.send(JSON.stringify({ error: 'Already streaming a message. Please wait.' }));
      return;
    }

    streaming = true;
    try {
      const data: WSRequest = JSON.parse(msg.toString());
      const {
        messages,
        modelPath,
        agentType = 'default',
        maxTokens = 2000,
        temperature = 0.7,
        topP = 0.9,
        stopSequences,
        contextConfig,
      } = data;

      if (!messages || !modelPath) {
        ws.send(JSON.stringify({ error: 'Missing messages or modelPath' }));
        streaming = false;
        return;
      }

      const systemPrompt = contextManager.createSystemPrompt(agentType);
      const contextMessages = contextManager.buildContext(messages, {
        maxTokens: contextConfig?.maxTokens || 4000,
        systemPrompt,
        includeFileContext: contextConfig?.includeFileContext,
        fileContextPaths: contextConfig?.fileContextPaths,
      });

      let accumulated = '';
      for await (const chunk of lmStudioService.streamChat(modelPath, contextMessages, {
        maxTokens,
        temperature,
        topP,
        stopSequences,
      })) {
        accumulated += chunk;
        ws.send(JSON.stringify({ content: chunk }));
      }

      ws.send(JSON.stringify({ done: true }));
    } catch (err) {
      console.error('WebSocket error:', err);
      ws.send(JSON.stringify({ error: 'Failed to generate response' }));
    } finally {
      streaming = false;
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server running at ws://localhost:1235');
