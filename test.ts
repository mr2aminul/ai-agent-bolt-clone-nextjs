import { lmStudioService, ChatMessage } from './lib/lm-studio/client';

async function run() {
  const messages: ChatMessage[] = [
    { role: 'user', content: 'Hello world' }
  ];

  const modelPath = 'qwen/qwen3-1.7b';

  try {
    const isHealthy = await lmStudioService.healthCheck();
    if (!isHealthy) {
      console.error('LM Studio is not running or not accessible via WS.');
      process.exit(1);
    }
    console.log('✅ LM Studio is healthy!');

    const response = await lmStudioService.chat(modelPath, messages);
    console.log('💬 LM Studio response:', response);
  } catch (err) {
    console.error('Error chatting with LM Studio:', err);
  } finally {
    lmStudioService.disconnect();
  }
}

run();
