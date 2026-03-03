import { Router } from 'express';
import { handleTool } from '../ai/tool-handlers';

const router = Router();

// GET /api/git/status
router.get('/status', async (_req, res) => {
  const result = await handleTool('git_status', {});
  res.json({ output: result });
});

export { router as gitRouter };
