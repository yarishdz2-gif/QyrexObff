/**
 * Qyrexobf — 5 capas (estilo Katty/CypherShield, sin AST gigante)
 * 1. String encryption (XOR + Base64, key random)
 * 2. Name mangling
 * 3. Control-flow flatten
 * 4. Anti-sandbox
 * 5. Dead code + number opacity
 */
const crypto = require('crypto');

function rid(n = 8) {
  const a = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const b = a + '0123456789_';
  let s = a[crypto.randomInt(a.length)];
  for (let i = 1; i < n; i++) s += b[crypto.randomInt(b.length)];
  return '_' + s;
}

function b64(s) {
  return Buffer.from(String(s), 'utf8').toString('base64');
}

function xor(s, key) {
  let o = '';
  for (let i = 0; i < s.length; i++) o += String.fromCharCode(s.charCodeAt(i) ^ (key[(i % key.length)] & 0xff));
  return o;
}

const RESERVED = new Set([
  'break','case','catch','class','const','continue','debugger','default','delete','do','else',
  'export','extends','finally','for','function','if','import','in','instanceof','let','new',
  'return','super','switch','this','throw','try','typeof','var','void','while','with','yield',
  'enum','await','implements','interface','package','private','protected','public','static',
  'true','false','null','undefined','NaN','Infinity','arguments','eval',
  'console','window','document','global','globalThis','process','module','exports','require',
  'Buffer','Promise','Array','Object','String','Number','Boolean','Math','JSON','Date','Error',
  'Map','Set','WeakMap','WeakSet','Symbol','Proxy','Reflect','parseInt','parseFloat','isNaN',
  'isFinite','encodeURIComponent','decodeURIComponent','setTimeout','setInterval','clearTimeout',
  'clearInterval','fetch','atob','btoa','Uint8Array','RegExp','TypeError','Function','proxy',
  'length','name','prototype','constructor','call','apply','bind','toString','valueOf',
  'hasOwnProperty','__proto__','get','set'
]);

// ---- Layer 1: strings ----
function layerStrings(code) {
  const strings = [];
  const out = [];
  let i = 0;
  while (i < code.length) {
    const ch = code[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      const q = ch;
      let j = i + 1, val = '', ok = false;
      while (j < code.length) {
        if (code[j] === '\\') { val += code[j] + (code[j + 1] || ''); j += 2; continue; }
        if (code[j] === q) { ok = true; j++; break; }
        if (q === '`' && code[j] === '$' && code[j + 1] === '{') { ok = false; break; }
        val += code[j]; j++;
      }
      if (ok && q !== '`' && val.length > 0) {
        strings.push(val);
        out.push('__S[' + (strings.length - 1) + ']');
        i = j;
        continue;
      }
    }
    if (ch === '/' && code[i + 1] === '/') { while (i < code.length && code[i] !== '\n') i++; continue; }
    if (ch === '/' && code[i + 1] === '*') {
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    out.push(ch);
    i++;
  }

  if (!strings.length) return { code: out.join(''), prelude: '' };

  const keyBytes = Array.from(crypto.randomBytes(crypto.randomInt(4, 9)));
  const enc = strings.map((s) => b64(xor(s, keyBytes)));
  const arr = rid(7), dec = rid(7), keyN = rid(5), tmp = rid(4);

  const prelude = [
    'var ' + keyN + '=' + JSON.stringify(keyBytes) + ';',
    'var ' + arr + '=' + JSON.stringify(enc) + ';',
    'function ' + dec + '(i){',
    '  var s=atob(' + arr + '[i]),o="",k=' + keyN + ',j=0;',
    '  for(;j<s.length;j++)o+=String.fromCharCode(s.charCodeAt(j)^(k[j%k.length]&255));',
    '  return o;',
    '}',
    'var __S=(function(){var ' + tmp + '=[],i=0;for(;i<' + arr + '.length;i++)' + tmp + '[i]=' + dec + '(i);return ' + tmp + ';})();'
  ].join('');

  return { code: out.join(''), prelude };
}

// ---- Layer 2: names ----
function layerNames(code) {
  const map = new Map();
  const decl = /\b(?:var|let|const|function)\s+([A-Za-z_$][\w$]*)/g;
  let m;
  while ((m = decl.exec(code))) {
    const n = m[1];
    if (!RESERVED.has(n) && !map.has(n)) map.set(n, rid(9));
  }
  const params = /\bfunction\s+[A-Za-z_$][\w$]*\s*\(([^)]*)\)/g;
  while ((m = params.exec(code))) {
    for (const p of m[1].split(',')) {
      const n = p.trim().replace(/=[\s\S]*/, '').trim();
      if (n && /^[A-Za-z_$][\w$]*$/.test(n) && !RESERVED.has(n) && !map.has(n)) map.set(n, rid(8));
    }
  }
  if (!map.size) return code;
  return code.replace(/\b[A-Za-z_$][\w$]*\b/g, (id) => (RESERVED.has(id) ? id : (map.get(id) || id)));
}

// ---- Layer 3: control flow ----
function layerControlFlow(body) {
  if (/^\s*(import|export)\b/m.test(body)) return body;
  const st = rid(6), go = rid(5);
  // split body into rough chunks by semicolons at depth 0 (best-effort)
  const chunks = [];
  let cur = '', depth = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '{' || c === '(' || c === '[') depth++;
    if (c === '}' || c === ')' || c === ']') depth = Math.max(0, depth - 1);
    cur += c;
    if (c === ';' && depth === 0 && cur.trim()) {
      chunks.push(cur);
      cur = '';
    }
  }
  if (cur.trim()) chunks.push(cur);
  if (chunks.length < 2) {
    return [
      '(function(){',
      '  var ' + st + '=0;',
      '  while(1){',
      '    switch(' + st + '){',
      '      case 0:',
      body,
      '        ' + st + '=1;break;',
      '      default:return;',
      '    }',
      '  }',
      '})();'
    ].join('\n');
  }

  const order = chunks.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    const t = order[i]; order[i] = order[j]; order[j] = t;
  }
  // map original index -> case id (shuffled labels)
  const labels = order.map(() => crypto.randomInt(10, 900));
  const nextMap = {};
  for (let i = 0; i < chunks.length; i++) {
    nextMap[i] = i + 1 < chunks.length ? labels[i + 1] : -1;
  }

  const cases = [];
  for (let i = 0; i < chunks.length; i++) {
    const lab = labels[i];
    const nxt = nextMap[i];
    cases.push(
      '      case ' + lab + ':\n' +
      chunks[i] +
      (nxt === -1 ? ('\n        ' + st + '=-1;break;') : ('\n        ' + st + '=' + nxt + ';break;'))
    );
  }

  return [
    '(function(){',
    '  var ' + st + '=' + labels[0] + ';',
    '  while(' + st + '!==-1){',
    '    switch(' + st + '){',
    cases.join('\n'),
    '      default:' + st + '=-1;break;',
    '    }',
    '  }',
    '})();'
  ].join('\n');
}

// ---- Layer 4: anti-sandbox ----
function layerAntiSandbox() {
  const a = rid(5), b = rid(5), c = rid(5);
  return [
    '(function(){',
    '  try{',
    '    var ' + a + '=0;',
    '    if(typeof navigator!=="undefined"){',
    '      var ' + b + '=String(navigator.userAgent||"");',
    '      if(/HeadlessChrome|PhantomJS|Selenium|Puppeteer|WebDriver/i.test(' + b + '))' + a + '++;',
    '      if(navigator.webdriver)' + a + '++;',
    '    }',
    '    if(typeof window!=="undefined"){',
    '      if(window.callPhantom||window._phantom||window.__nightmare)' + a + '++;',
    '      if(window.document&&!window.document.createElement)' + a + '++;',
    '    }',
    '    var ' + c + '=Date.now();',
    '    for(var i=0;i<2e4;i++){}',
    '    if(Date.now()-' + c + '>120)' + a + '++;',
    '    if(' + a + '>1){while(true){}}',
    '  }catch(e){}',
    '})();'
  ].join('');
}

// ---- Layer 5: dead code + opaque numbers ----
function layerJunk() {
  const x = rid(4), y = rid(4), z = rid(4);
  const n1 = crypto.randomInt(2, 50);
  const n2 = crypto.randomInt(2, 50);
  return [
    'var ' + x + '=' + n1 + ';',
    'var ' + y + '=(' + x + '^' + x + ')+' + n2 + ';',
    'var ' + z + '=' + y + '*' + x + '-' + x + '*' + y + ';',
    'if(' + z + '!==0){' + x + '=' + y + ';}',
    'if((' + x + '|' + y + ')<' + x + '&&' + y + '){' + z + '++;}'
  ].join('');
}

function opaqueNumbers(code) {
  // replace standalone small integers with equivalent expressions (skip in strings already handled)
  return code.replace(/\b([2-9]|[1-9][0-9])\b/g, (n) => {
    if (crypto.randomInt(100) < 55) return n; // keep some plain
    const v = Number(n);
    const a = crypto.randomInt(1, v);
    return '((' + a + '+' + (v - a) + '))';
  });
}

/**
 * @param {string} source
 * @param {object} opts
 */
function obfuscate(source, opts = {}) {
  const preset = opts.preset || 'Medium';
  const flags = {
    strings: opts.strings !== false,
    names: opts.names !== false,
    controlFlow: opts.controlFlow === true || preset === 'High' || preset === 'Ultra',
    antiSandbox: opts.antiSandbox === true || preset === 'High' || preset === 'Ultra',
    junk: opts.junk !== false,
    compact: !!opts.compact
  };

  let code = String(source || '');
  if (!code.trim()) throw new Error('Código vacío');
  if (Buffer.byteLength(code, 'utf8') > 1_500_000) throw new Error('Código demasiado grande');

  const head = [];
  if (flags.antiSandbox) head.push(layerAntiSandbox());
  if (flags.junk) head.push(layerJunk());

  let body = code;
  let stringCount = 0;

  if (flags.strings) {
    const r = layerStrings(body);
    body = r.code;
    stringCount = (r.prelude.match(/","/g) || []).length + (r.prelude ? 1 : 0);
    if (r.prelude) {
      // better count
      try {
        const m = r.prelude.match(/\[(.*)\]/s);
        stringCount = r.prelude.includes('atob') ? (r.prelude.match(/","/g) || []).length + 1 : 0;
      } catch (_) {}
      head.push(r.prelude);
    }
    // recount properly from prelude array length
    const arrMatch = r.prelude && r.prelude.match(/=(\[.*?\]);/);
    if (arrMatch) {
      try { stringCount = JSON.parse(arrMatch[1]).length; } catch (_) {}
    }
  }

  if (flags.names) body = layerNames(body);
  if (flags.junk) body = opaqueNumbers(body);
  if (flags.controlFlow) body = layerControlFlow(body);

  head.push(body);
  let out = head.join('\n');

  if (flags.compact) {
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
      strings: stringCount,
      preset,
      layers: [
        flags.strings && 'strings',
        flags.names && 'names',
        flags.controlFlow && 'controlFlow',
        flags.antiSandbox && 'antiSandbox',
        flags.junk && 'junk'
      ].filter(Boolean)
    }
  };
}

module.exports = { obfuscate };
