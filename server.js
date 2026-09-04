const express = require('express');
const path = require('path');
const { obfuscate } = require('./obfuscator');

const app = express();
const PORT = process.env.PORT || 10000;
const ROOT = __dirname;

app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'Qyrexobf', version: '2.2.0', layers: 5 });
});

app.post('/api/obfuscate', (req, res) => {
  try {
    const body = req.body || {};
    const code = String(body.code || '');
    if (!code.trim()) return res.status(400).json({ error: 'Código vacío' });

    const result = obfuscate(code, {
      preset: body.preset || 'Medium',
      strings: body.strings !== false && body.stringEncryption !== false,
      names: body.names !== false && body.nameMangling !== false,
      controlFlow: !!body.controlFlow,
      antiSandbox: !!body.antiSandbox,
      junk: body.junk !== false,
      compact: !!body.compact
    });
    res.json(result);
  } catch (e) {
    console.error('[Qyrexobf]', e);
    res.status(500).json({ error: e.message || 'Error' });
  }
});

app.get('/', (_req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.get('*', (_req, res) => res.sendFile(path.join(ROOT, 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log('Qyrexobf listening on 0.0.0.0:' + PORT);
});
