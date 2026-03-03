import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam, ContentBlockParam } from '@anthropic-ai/sdk/resources/messages';
import type { Response } from 'express';
import { tools } from './tools';
import { handleTool } from './tool-handlers';
import { buildSystemPrompt } from './system-prompt';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

const MAX_ITERATIONS = 15;

export async function streamChat(
  messages: MessageParam[],
  res: Response,
): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const systemPrompt = buildSystemPrompt();

  try {
    await agenticLoop(messages, systemPrompt, res);
  } catch (err: any) {
    sendSSE(res, { type: 'error', message: err.message });
  }

  res.write('data: [DONE]\n\n');
  res.end();
}

async function agenticLoop(
  messages: MessageParam[],
  systemPrompt: string,
  res: Response,
): Promise<void> {
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    // Trim conversation if too long
    trimConversation(messages);

    const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
    const stream = getClient().messages.stream({
      model,
      max_tokens: 8192,
      system: systemPrompt,
      tools,
      messages,
    });

    // Stream text deltas in real time
    stream.on('text', (text) => {
      sendSSE(res, { type: 'text_delta', content: text });
    });

    const response = await stream.finalMessage();
    const assistantContent = response.content;

    // Add assistant message to history
    messages.push({ role: 'assistant', content: assistantContent });

    // Find tool_use blocks
    const toolUses = assistantContent.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use',
    );

    if (toolUses.length === 0) {
      // No tool calls — done
      return;
    }

    // Execute tools and send indicators to the frontend
    const toolResults: ContentBlockParam[] = [];

    for (const toolUse of toolUses) {
      sendSSE(res, {
        type: 'tool_call',
        name: toolUse.name,
        input: toolUse.input,
      });

      const result = await handleTool(
        toolUse.name,
        toolUse.input as Record<string, string>,
      );

      sendSSE(res, {
        type: 'tool_result',
        name: toolUse.name,
        result: result.length > 1000 ? result.substring(0, 1000) + '...' : result,
      });

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: result,
      });
    }

    // Add tool results and loop
    messages.push({ role: 'user', content: toolResults });
  }
}

function trimConversation(messages: MessageParam[]): void {
  const MAX_CHARS = 150_000;
  let total = messages.reduce(
    (sum, m) => sum + JSON.stringify(m.content).length,
    0,
  );

  while (total > MAX_CHARS && messages.length > 4) {
    const removed = messages.shift();
    total -= JSON.stringify(removed!.content).length;
  }
}

function sendSSE(res: Response, data: Record<string, any>): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}
