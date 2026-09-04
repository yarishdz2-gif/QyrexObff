import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import CypherShield from './core/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3000);

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '2mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'QyrexObf', version: '2.3.0' }));

app.post('/api/obfuscate', (req, res) => {
  try {
    const { source, preset = 'High', compact = true } = req.body || {};
    if (typeof source !== 'string' || !source.trim()) {
      return res.status(400).json({ error: 'Source code is required.' });
    }
    if (Buffer.byteLength(source, 'utf8') > 1_500_000) {
      return res.status(413).json({ error: 'Source too large (max 1.5 MB).' });
    }

    const allowed = new Set(['Low', 'Medium', 'High', 'Ultra']);
    const safePreset = allowed.has(preset) ? preset : 'High';
    const obfuscator = new CypherShield({
      preset: safePreset,
      stringEncryption: false,
      controlFlowFlattening: true,
      nameMangling: true,
      antiSandbox: false,
      compact: Boolean(compact),
      minify: Boolean(compact),
    });

    const result = obfuscator.obfuscate(source);
    res.json({ code: result.code, summary: result.summary, preset: safePreset });
  } catch (error) {
    res.status(422).json({ error: error?.message || 'Obfuscation failed.' });
  }
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[QyrexObf] Web server listening on 0.0.0.0:${PORT}`);
});
