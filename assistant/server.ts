import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { chatRouter } from './routes/chat';
import { testsRouter } from './routes/tests';
import { gitRouter } from './routes/git';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.');
  process.exit(1);
}

const app = express();
const PORT = parseInt(process.env.ASSISTANT_PORT || '3000', 10);
const HOST = process.env.ASSISTANT_HOST || 'localhost';

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/chat', chatRouter);
app.use('/api/tests', testsRouter);
app.use('/api/git', gitRouter);

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`\n  Manticore Test Assistant`);
  console.log(`  http://${HOST}:${PORT}\n`);
});
