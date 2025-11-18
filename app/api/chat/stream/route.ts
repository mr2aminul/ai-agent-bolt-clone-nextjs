import { NextRequest } from 'next/server';
import { lmStudioService } from '@/lib/lm-studio/client';
import { contextManager } from '@/lib/lm-studio/context-manager';
import type { ChatMessage } from '@/lib/lm-studio/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RequestBody {
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

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const {
      messages,
      modelPath,
      agentType = 'default',
      maxTokens = 2000,
      temperature = 0.7,
      topP = 0.9,
      stopSequences,
      contextConfig,
    } = body;

    if (!messages || !modelPath) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: messages, modelPath' }),
        { status: 400 }
      );
    }

    const systemPrompt = contextManager.createSystemPrompt(agentType);
    const contextMessages = contextManager.buildContext(messages, {
      maxTokens: contextConfig?.maxTokens || 4000,
      systemPrompt,
      includeFileContext: contextConfig?.includeFileContext,
      fileContextPaths: contextConfig?.fileContextPaths,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of lmStudioService.streamChat(
            modelPath,
            contextMessages,
            {
              maxTokens,
              temperature,
              topP,
              stopSequences,
            }
          )) {
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = `data: ${JSON.stringify({
            error: 'Failed to generate response'
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
      cancel() {
        console.log('Stream cancelled by client');
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat stream:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}
