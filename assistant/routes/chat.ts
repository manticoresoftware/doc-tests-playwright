import { Router } from 'express';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { streamChat } from '../ai/client';

const router = Router();

// In-memory conversation store (keyed by session ID)
const conversations = new Map<string, MessageParam[]>();

router.post('/', async (req, res) => {
  const { message, sessionId = 'default' } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, []);
  }

  const messages = conversations.get(sessionId)!;
  messages.push({ role: 'user', content: message });

  await streamChat(messages, res);
});

router.delete('/:sessionId', (_req, res) => {
  conversations.delete(_req.params.sessionId);
  res.json({ ok: true });
});

export { router as chatRouter };
