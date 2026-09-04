import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Qyrexobf from './core/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'Qyrexobf', version: '2.0.0', engine: 'katty-ast' });
});

app.post('/api/obfuscate', (req, res) => {
  try {
    const body = req.body || {};
    const code = String(body.code || '');
    if (!code.trim()) return res.status(400).json({ error: 'Código vacío' });
    if (Buffer.byteLength(code, 'utf8') > 1_500_000) {
      return res.status(400).json({ error: 'Código demasiado grande' });
    }

    const preset = ['Low', 'Medium', 'High', 'Ultra'].includes(body.preset)
      ? body.preset
      : 'Medium';

    const config = {
      preset,
      stringEncryption: body.stringEncryption !== false,
      controlFlowFlattening: body.controlFlowFlattening === true || body.controlFlow === true,
      nameMangling: body.nameMangling !== false,
      antiSandbox: body.antiSandbox === true,
      compact: body.compact === true,
      debugLogging: false
    };

    // High/Ultra defaults
    if (preset === 'High' || preset === 'Ultra') {
      if (body.controlFlowFlattening === undefined && body.controlFlow === undefined) {
        config.controlFlowFlattening = true;
      }
      if (body.antiSandbox === undefined) config.antiSandbox = true;
    }

    const obfuscator = new Qyrexobf(config);
    const result = obfuscator.obfuscate(code);
    res.json({
      code: result.code,
      summary: result.summary || null,
      preset,
      config: {
        stringEncryption: config.stringEncryption,
        controlFlowFlattening: config.controlFlowFlattening,
        nameMangling: config.nameMangling,
        antiSandbox: config.antiSandbox,
        compact: config.compact
      }
    });
  } catch (e) {
    console.error('[Qyrexobf]', e);
    res.status(500).json({ error: e.message || 'Error al ofuscar' });
  }
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Qyrexobf listening on 0.0.0.0:' + PORT);
});
