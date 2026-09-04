/**
 * Qyrexobf — server + obfuscator
 * Archivos: package.json | server.js | index.html
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 10000;
const ROOT = __dirname;

app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

// -------------------- OBFUSCATOR --------------------

function rndId(n = 8) {
  const c = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let s = c[crypto.randomInt(0, c.length)];
  const all = c + '0123456789_';
  for (let i = 1; i < n; i++) s += all[crypto.randomInt(0, all.length)];
  return '_' + s;
}

function b64(str) {
  return Buffer.from(String(str), 'utf8').toString('base64');
}

function xorStr(str, key) {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    out += String.fromCharCode(str.charCodeAt(i) ^ key);
  }
  return out;
}

const RESERVED = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else',
  'export', 'extends', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new',
  'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
  'enum', 'await', 'implements', 'interface', 'package', 'private', 'protected', 'public', 'static',
  'true', 'false', 'null', 'undefined', 'NaN', 'Infinity', 'arguments', 'eval',
  'console', 'window', 'document', 'global', 'globalThis', 'process', 'module', 'exports', 'require',
  'Buffer', 'Promise', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Math', 'JSON', 'Date', 'Error',
  'Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol', 'Proxy', 'Reflect', 'parseInt', 'parseFloat', 'isNaN',
  'isFinite', 'encodeURIComponent', 'decodeURIComponent', 'setTimeout', 'setInterval', 'clearTimeout',
  'clearInterval', 'fetch', 'atob', 'btoa', 'Uint8Array', 'Int8Array', 'DataView', 'RegExp', 'TypeError'
]);

function extractStrings(code) {
  const strings = [];
  const out = [];
  let i = 0;
  while (i < code.length) {
    const ch = code[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      let j = i + 1;
      let val = '';
      let ok = false;
      while (j < code.length) {
        if (code[j] === '\\') {
          val += code[j] + (code[j + 1] || '');
          j += 2;
          continue;
        }
        if (code[j] === quote) {
          ok = true;
          j++;
          break;
        }
        if (quote === '`' && code[j] === '$' && code[j + 1] === '{') {
          ok = false;
          break;
        }
        val += code[j];
        j++;
      }
      if (ok && quote !== '`' && val.length > 0) {
        const idx = strings.length;
        strings.push(val);
        out.push('__S[' + idx + ']');
        i = j;
        continue;
      }
    }
    if (ch === '/' && code[i + 1] === '/') {
      while (i < code.length && code[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && code[i + 1] === '*') {
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    out.push(ch);
    i++;
  }
  return { code: out.join(''), strings };
}

function mangleNames(code) {
  const map = new Map();
  const declRe = /\b(?:var|let|const|function)\s+([A-Za-z_$][\w$]*)/g;
  let m;
  while ((m = declRe.exec(code))) {
    const name = m[1];
    if (RESERVED.has(name) || map.has(name)) continue;
    map.set(name, rndId(8));
  }
  const paramRe = /\bfunction\s+[A-Za-z_$][\w$]*\s*\(([^)]*)\)/g;
  while ((m = paramRe.exec(code))) {
    for (const p of m[1].split(',')) {
      const name = p.trim().replace(/=.*/, '').trim();
      if (!name || RESERVED.has(name) || map.has(name)) continue;
      if (/^[A-Za-z_$][\w$]*$/.test(name)) map.set(name, rndId(8));
    }
  }
  if (map.size === 0) return code;
  return code.replace(/\b[A-Za-z_$][\w$]*\b/g, (id) => {
    if (RESERVED.has(id)) return id;
    return map.has(id) ? map.get(id) : id;
  });
}

function buildStringDecoder(strings) {
  if (!strings.length) return '';
  const key = crypto.randomInt(1, 200);
  const encoded = strings.map((s) => b64(xorStr(s, key)));
  const arrName = rndId(6);
  const decName = rndId(6);
  const keyName = rndId(5);
  return [
    'var ' + keyName + '=' + key + ';',
    'var ' + arrName + '=' + JSON.stringify(encoded) + ';',
    'function ' + decName + '(i){',
    '  var s=atob(' + arrName + '[i]),o="",k=' + keyName + ';',
    '  for(var j=0;j<s.length;j++)o+=String.fromCharCode(s.charCodeAt(j)^k);',
    '  return o;',
    '}',
    'var __S=' + arrName + '.map(function(_,i){return ' + decName + '(i);});'
  ].join('');
}

function injectAntiSandbox() {
  const n = rndId(5);
  return [
    '(function(){',
    '  try{',
    '    var ' + n + '=0;',
    '    if(typeof navigator!=="undefined"&&/Headless|Phantom|Selenium/i.test(String(navigator.userAgent||"")))' + n + '++;',
    '    if(typeof window!=="undefined"&&window.callPhantom)' + n + '++;',
    '    if(' + n + '>0){while(true){}}',
    '  }catch(e){}',
    '})();'
  ].join('');
}

function wrapControlFlow(body) {
  const st = rndId(5);
  return [
    '(function(){',
    '  var ' + st + '=0;',
    '  while(true){',
    '    switch(' + st + '){',
    '      case 0: ' + st + '=1; break;',
    '      case 1:',
    body,
    '        ' + st + '=2; break;',
    '      case 2: return;',
    '      default: return;',
    '    }',
    '  }',
    '})();'
  ].join('\n');
}

function deadJunk() {
  const a = rndId(4);
  const b = rndId(4);
  return 'var ' + a + '=' + crypto.randomInt(1, 99) + ';var ' + b + '=' + a + '*' + crypto.randomInt(2, 9) + ';if(' + b + '<0){' + a + '++;}';
}

function obfuscate(source, opts = {}) {
  const preset = opts.preset || 'Medium';
  const stringEncryption = opts.stringEncryption !== false;
  const nameMangling = opts.nameMangling !== false;
  const controlFlow = !!opts.controlFlow || preset === 'High' || preset === 'Ultra';
  const antiSandbox = !!opts.antiSandbox || preset === 'High' || preset === 'Ultra';
  const compact = !!opts.compact;

  let code = String(source || '');
  if (!code.trim()) throw new Error('Código vacío');

  const parts = [];
  if (antiSandbox) parts.push(injectAntiSandbox());
  parts.push(deadJunk());

  let body = code;
  let strings = [];

  if (stringEncryption) {
    const extracted = extractStrings(body);
    body = extracted.code;
    strings = extracted.strings;
    const dec = buildStringDecoder(strings);
    if (dec) parts.push(dec);
  }

  if (nameMangling) body = mangleNames(body);

  if (controlFlow && !/^\s*(import|export)\b/m.test(body)) {
    body = wrapControlFlow(body);
  }

  parts.push(body);
  let out = parts.join('\n');

  if (compact) {
    out = out
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}();,=\[\]])\s*/g, '$1')
      .trim();
  }

  return {
    code: out,
    summary: {
      originalSize: Buffer.byteLength(source, 'utf8'),
      obfuscatedSize: Buffer.byteLength(out, 'utf8'),
      strings: strings.length,
      preset
    }
  };
}

// -------------------- ROUTES --------------------

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'Qyrexobf', version: '2.1.0' });
});

app.post('/api/obfuscate', (req, res) => {
  try {
    const body = req.body || {};
    const code = String(body.code || '');
    if (!code.trim()) return res.status(400).json({ error: 'Código vacío' });
    if (Buffer.byteLength(code, 'utf8') > 1_500_000) {
      return res.status(400).json({ error: 'Código demasiado grande' });
    }
    const result = obfuscate(code, {
      preset: body.preset || 'Medium',
      stringEncryption: body.stringEncryption !== false,
      nameMangling: body.nameMangling !== false,
      controlFlow: !!body.controlFlow,
      antiSandbox: !!body.antiSandbox,
      compact: !!body.compact
    });
    res.json(result);
  } catch (e) {
    console.error('[Qyrexobf]', e);
    res.status(500).json({ error: e.message || 'Error' });
  }
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Qyrexobf listening on 0.0.0.0:' + PORT);
});
