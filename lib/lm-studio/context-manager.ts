import type { ChatMessage } from './client';

export interface ContextConfig {
  maxTokens: number;
  systemPrompt?: string;
  includeFileContext?: boolean;
  fileContextPaths?: string[];
}

export class ContextManager {
  private readonly avgCharsPerToken = 4;

  estimateTokens(text: string): number {
    return Math.ceil(text.length / this.avgCharsPerToken);
  }

  private trimMessage(message: ChatMessage, maxLength: number): ChatMessage {
    if (message.content.length <= maxLength) {
      return message;
    }

    return {
      ...message,
      content: message.content.slice(-maxLength) + '\n[Previous content truncated]',
    };
  }

  pruneMessages(
    messages: ChatMessage[],
    maxTokens: number,
    systemPrompt?: string
  ): ChatMessage[] {
    const systemTokens = systemPrompt ? this.estimateTokens(systemPrompt) : 0;
    const availableTokens = maxTokens - systemTokens - 500;

    if (availableTokens <= 0) {
      return [];
    }

    const result: ChatMessage[] = [];
    let currentTokens = 0;

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const messageTokens = this.estimateTokens(message.content);

      if (currentTokens + messageTokens <= availableTokens) {
        result.unshift(message);
        currentTokens += messageTokens;
      } else {
        const remainingTokens = availableTokens - currentTokens;
        if (remainingTokens > 100) {
          const maxChars = remainingTokens * this.avgCharsPerToken;
          result.unshift(this.trimMessage(message, maxChars));
        }
        break;
      }
    }

    return result;
  }

  buildContext(
    messages: ChatMessage[],
    config: ContextConfig
  ): ChatMessage[] {
    const systemMessage: ChatMessage[] = config.systemPrompt
      ? [{ role: 'system', content: config.systemPrompt }]
      : [];

    const prunedMessages = this.pruneMessages(
      messages,
      config.maxTokens,
      config.systemPrompt
    );

    return [...systemMessage, ...prunedMessages];
  }

  createSystemPrompt(agentType: string): string {
    const prompts: Record<string, string> = {
      coder: `You are an expert software developer assistant. Your role is to:
- Write clean, efficient, and well-documented code
- Follow best practices and design patterns
- Explain your code decisions clearly
- Consider edge cases and error handling
- Use modern language features appropriately`,

      reviewer: `You are a code review expert. Your role is to:
- Identify bugs, security issues, and performance problems
- Suggest improvements for code quality and maintainability
- Check adherence to coding standards
- Provide constructive feedback with specific examples
- Highlight both strengths and areas for improvement`,

      tester: `You are a testing specialist. Your role is to:
- Generate comprehensive test cases
- Write unit, integration, and end-to-end tests
- Identify edge cases and potential failure points
- Ensure good test coverage
- Follow testing best practices and patterns`,

      analyst: `You are a project analysis expert. Your role is to:
- Analyze code structure and architecture
- Identify technical debt and improvement opportunities
- Generate metrics and insights about code quality
- Provide recommendations for optimization
- Document findings clearly and actionably`,

      default: `You are a helpful AI assistant specialized in software development.
Provide clear, accurate, and actionable responses to help with coding tasks.`,
    };

    return prompts[agentType] || prompts.default;
  }

  addFileContext(messages: ChatMessage[], fileContents: string[]): ChatMessage[] {
    if (fileContents.length === 0) {
      return messages;
    }

    const fileContext = fileContents.join('\n\n---\n\n');
    const contextMessage: ChatMessage = {
      role: 'system',
      content: `Here are relevant files from the project:\n\n${fileContext}`,
    };

    return [contextMessage, ...messages];
  }
}

export const contextManager = new ContextManager();
