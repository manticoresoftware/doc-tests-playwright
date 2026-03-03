import { Router } from 'express';
import { handleTool } from '../ai/tool-handlers';
import { spawnTestRun } from '../utils/test-runner';

const router = Router();

// GET /api/tests — list all test files
router.get('/', async (_req, res) => {
  const result = await handleTool('list_tests', {});
  try {
    res.json(JSON.parse(result));
  } catch {
    res.json([]);
  }
});

// POST /api/tests/run — run tests with SSE output
router.post('/run', (req, res) => {
  const { file, grep } = req.body || {};

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const args: string[] = [];
  if (file) args.push(file);
  if (grep) args.push('-g', grep);

  spawnTestRun(
    args,
    (chunk) => {
      res.write(`data: ${JSON.stringify({ type: 'output', content: chunk })}\n\n`);
    },
    (code) => {
      res.write(`data: ${JSON.stringify({ type: 'done', code })}\n\n`);
      res.end();
    },
  );
});

export { router as testsRouter };
