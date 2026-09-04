/**
 * Qyrexobf — ALL-IN-ONE (server + UI + obfuscator)
 * Sube SOLO esta carpeta: package.json + server.js
 */
const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 10000;

app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

// ===================== OBFUSCATOR =====================

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
  'break','case','catch','class','const','continue','debugger','default','delete','do','else',
  'export','extends','finally','for','function','if','import','in','instanceof','let','new',
  'return','super','switch','this','throw','try','typeof','var','void','while','with','yield',
  'enum','await','implements','interface','package','private','protected','public','static',
  'true','false','null','undefined','NaN','Infinity','arguments','eval',
  'console','window','document','global','globalThis','process','module','exports','require',
  'Buffer','Promise','Array','Object','String','Number','Boolean','Math','JSON','Date','Error',
  'Map','Set','WeakMap','WeakSet','Symbol','Proxy','Reflect','parseInt','parseFloat','isNaN',
  'isFinite','encodeURIComponent','decodeURIComponent','setTimeout','setInterval','clearTimeout',
  'clearInterval','fetch','atob','btoa','Uint8Array','Int8Array','DataView'
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
        // template with ${ } — keep as-is (skip encrypt)
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
    // line comment
    if (ch === '/' && code[i + 1] === '/') {
      while (i < code.length && code[i] !== '\n') i++;
      continue;
    }
    // block comment
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
  // simple identifiers declared with var/let/const/function
  const declRe = /\b(?:var|let|const|function)\s+([A-Za-z_$][\w$]*)/g;
  let m;
  while ((m = declRe.exec(code))) {
    const name = m[1];
    if (RESERVED.has(name) || map.has(name)) continue;
    map.set(name, rndId(8));
  }
  // function params in simple function foo(a,b)
  const paramRe = /\bfunction\s+[A-Za-z_$][\w$]*\s*\(([^)]*)\)/g;
  while ((m = paramRe.exec(code))) {
    const parts = m[1].split(',');
    for (const p of parts) {
      const name = p.trim().replace(/=.*/, '').trim();
      if (!name || RESERVED.has(name) || map.has(name)) continue;
      if (/^[A-Za-z_$][\w$]*$/.test(name)) map.set(name, rndId(8));
    }
  }

  if (map.size === 0) return code;

  // replace whole-word identifiers
  return code.replace(/\b[A-Za-z_$][\w$]*\b/g, (id) => {
    if (RESERVED.has(id)) return id;
    return map.has(id) ? map.get(id) : id;
  });
}

function buildStringDecoder(strings) {
  if (!strings.length) return { prelude: '', accessor: '' };
  const key = crypto.randomInt(1, 200);
  const encoded = strings.map((s) => b64(xorStr(s, key)));
  const arrName = rndId(6);
  const decName = rndId(6);
  const keyName = rndId(5);

  const prelude = [
    'var ' + keyName + '=' + key + ';',
    'var ' + arrName + '=' + JSON.stringify(encoded) + ';',
    'function ' + decName + '(i){',
    '  var s=atob(' + arrName + '[i]),o="",k=' + keyName + ';',
    '  for(var j=0;j<s.length;j++)o+=String.fromCharCode(s.charCodeAt(j)^k);',
    '  return o;',
    '}',
    'var __S=' + arrName + '.map(function(_,i){return ' + decName + '(i);});'
  ].join('');

  return { prelude, accessor: '__S' };
}

function injectAntiSandbox() {
  const n = rndId(5);
  return [
    '(function(){',
    '  try{',
    '    if(typeof window==="undefined"&&typeof process!=="undefined"&&process.versions){/*node ok*/}',
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
  const cases = rndId(5);
  // simple state machine wrapper
  return [
    '(function(){',
    '  var ' + st + '=0;',
    '  while(true){',
    '    switch(' + st + '){',
    '      case 0:',
    '        ' + st + '=1; break;',
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
  const a = rndId(4), b = rndId(4);
  return 'var ' + a + '=' + crypto.randomInt(1, 99) + ';var ' + b + '=' + a + '*' + crypto.randomInt(2, 9) + ';if(' + b + '<0){' + a + '++;}';
}

function obfuscate(source, opts = {}) {
  const {
    preset = 'Medium',
    stringEncryption = true,
    nameMangling = true,
    controlFlow = false,
    antiSandbox = false,
    compact = false,
    deadCode = true
  } = opts;

  let code = String(source || '');
  if (!code.trim()) throw new Error('Código vacío');

  const parts = [];

  if (antiSandbox || preset === 'High' || preset === 'Ultra') {
    parts.push(injectAntiSandbox());
  }

  if (deadCode) parts.push(deadJunk());

  let body = code;
  let strings = [];

  if (stringEncryption !== false) {
    const extracted = extractStrings(body);
    body = extracted.code;
    strings = extracted.strings;
    const dec = buildStringDecoder(strings);
    if (dec.prelude) parts.push(dec.prelude);
  }

  if (nameMangling !== false) {
    body = mangleNames(body);
  }

  if (controlFlow || preset === 'High' || preset === 'Ultra') {
    // only wrap if it looks like a script body (avoid breaking module syntax heavily)
    if (!/^\s*(import|export)\b/m.test(body)) {
      body = wrapControlFlow(body);
    }
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

// ===================== HTML UI =====================

const HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Qyrexobf</title>
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:#06070b;color:#f5f5f7;font:14px Inter,system-ui,sans-serif}
body:before{content:"";position:fixed;inset:-20%;pointer-events:none;background:radial-gradient(circle at 15% 10%,rgba(124,92,255,.28),transparent 30%),radial-gradient(circle at 90% 10%,rgba(49,215,255,.12),transparent 25%);filter:blur(12px)}
.shell{position:relative;max-width:1100px;margin:auto;padding:28px 18px 60px}
.nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;gap:12px;flex-wrap:wrap}
.brand{display:flex;gap:12px;align-items:center;font-weight:800;font-size:18px}
.mark{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,#7c5cff,#31d7ff);box-shadow:0 0 40px rgba(124,92,255,.35)}
.brand small{display:block;color:#77798a;font-size:10px;letter-spacing:.14em;text-transform:uppercase}
.badge{border:1px solid #2b2f3d;background:#0d0f15;border-radius:999px;padding:7px 12px;color:#adb2c5;font-size:11px;font-weight:700}
.panel{border:1px solid #282b38;background:rgba(13,14,20,.94);box-shadow:0 28px 100px rgba(0,0,0,.4);border-radius:22px;padding:20px;margin-bottom:14px}
.panel h2{margin:0 0 6px;font-size:15px}
.muted{color:#717489;font-size:12px;margin-bottom:12px;line-height:1.5}
textarea{width:100%;min-height:210px;border-radius:14px;border:1px solid #282c39;background:#080a0f;color:#e8e8f0;font:12px/1.5 ui-monospace,Consolas,monospace;padding:14px;resize:vertical}
.opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:12px 0}
label.check{display:flex;align-items:center;gap:8px;color:#a8abba;font-size:13px;cursor:pointer;border:1px solid #242836;background:#0b0d13;border-radius:12px;padding:10px 12px}
label.check input{accent-color:#7c5cff}
.field label{display:block;font-size:12px;color:#717489;margin-bottom:6px;font-weight:600}
select{border-radius:12px;border:1px solid #282c39;background:#0b0d13;color:#f5f5f7;padding:10px 12px;font-weight:600}
.row{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.btn{border:1px solid #292c39;background:#10121a;color:#f5f5f7;padding:11px 16px;border-radius:12px;font-weight:700;cursor:pointer}
.btn.primary{background:linear-gradient(135deg,#f4f5f7,#d9dbe3);color:#08090d;border-color:#fff}
.btn:disabled{opacity:.45;cursor:not-allowed}
.status{margin-top:10px;font-size:12px;color:#83d9b3;min-height:18px}
.status.err{color:#f87171}
.chip{display:inline-block;font-size:11px;font-weight:700;border-radius:999px;padding:6px 10px;border:1px solid #2b2f3d;background:#0d0f15;color:#adb2c5;margin:4px 4px 0 0}
.foot{text-align:center;color:#55596c;font-size:11px;margin-top:16px}
@media(max-width:640px){.row{flex-direction:column}.btn{width:100%}}
</style>
</head>
<body>
<main class="shell">
<nav class="nav">
  <div class="brand"><div class="mark">Q</div><div>Qyrexobf<small>all-in-one</small></div></div>
  <div class="badge">v2.1 · single file</div>
</nav>
<section class="panel">
  <h2>Código fuente</h2>
  <div class="muted">Pega JavaScript. Todo corre en este servidor.</div>
  <textarea id="input" placeholder="function hello(name){\n  console.log('hi ' + name);\n  return name.length;\n}"></textarea>
  <div class="field" style="margin-top:12px">
    <label>Preset</label>
    <select id="preset">
      <option>Low</option>
      <option selected>Medium</option>
      <option>High</option>
      <option>Ultra</option>
    </select>
  </div>
  <div class="opts">
    <label class="check"><input type="checkbox" id="stringEncryption" checked/> String encryption</label>
    <label class="check"><input type="checkbox" id="nameMangling" checked/> Name mangling</label>
    <label class="check"><input type="checkbox" id="controlFlow"/> Control flow</label>
    <label class="check"><input type="checkbox" id="antiSandbox"/> Anti-sandbox</label>
    <label class="check"><input type="checkbox" id="compact"/> Compact</label>
  </div>
  <div class="row">
    <button class="btn primary" id="btnObf">Ofuscar</button>
    <button class="btn" id="btnClear">Limpiar</button>
  </div>
  <div class="status" id="status"></div>
  <div id="stats"></div>
</section>
<section class="panel">
  <h2>Resultado</h2>
  <textarea id="output" readonly placeholder="Aquí sale el código ofuscado..."></textarea>
  <div class="row">
    <button class="btn primary" id="btnCopy">Copiar</button>
    <button class="btn" id="btnDownload">Descargar .js</button>
  </div>
</section>
<div class="foot">Qyrexobf · package.json + server.js nada más</div>
</main>
<script>
const $=id=>document.getElementById(id);
const PRE={
  Low:{stringEncryption:true,nameMangling:true,controlFlow:false,antiSandbox:false},
  Medium:{stringEncryption:true,nameMangling:true,controlFlow:false,antiSandbox:false},
  High:{stringEncryption:true,nameMangling:true,controlFlow:true,antiSandbox:true},
  Ultra:{stringEncryption:true,nameMangling:true,controlFlow:true,antiSandbox:true}
};
$('preset').onchange=()=>{
  const d=PRE[$('preset').value]||PRE.Medium;
  $('stringEncryption').checked=d.stringEncryption;
  $('nameMangling').checked=d.nameMangling;
  $('controlFlow').checked=d.controlFlow;
  $('antiSandbox').checked=d.antiSandbox;
};
function setStatus(m,err){$('status').textContent=m||'';$('status').className='status'+(err?' err':'')}
$('btnObf').onclick=async()=>{
  const code=$('input').value;
  if(!code.trim()){setStatus('Código vacío',true);return}
  $('btnObf').disabled=true;setStatus('Ofuscando...');
  try{
    const t0=performance.now();
    const res=await fetch('/api/obfuscate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      code,preset:$('preset').value,
      stringEncryption:$('stringEncryption').checked,
      nameMangling:$('nameMangling').checked,
      controlFlow:$('controlFlow').checked,
      antiSandbox:$('antiSandbox').checked,
      compact:$('compact').checked
    })});
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||('HTTP '+res.status));
    $('output').value=data.code||'';
    setStatus('OK · '+(data.code||'').length.toLocaleString()+' chars · '+Math.round(performance.now()-t0)+' ms');
    const s=data.summary||{};
    $('stats').innerHTML=[s.originalSize!=null?'in '+s.originalSize:'',s.obfuscatedSize!=null?'out '+s.obfuscatedSize:'',s.strings!=null?s.strings+' strings':'']
      .filter(Boolean).map(x=>'<span class="chip">'+x+'</span>').join('');
  }catch(e){setStatus(e.message||String(e),true)}
  finally{$('btnObf').disabled=false}
};
$('btnClear').onclick=()=>{$('input').value='';$('output').value='';setStatus('');$('stats').innerHTML=''};
$('btnCopy').onclick=async()=>{const t=$('output').value;if(!t)return;try{await navigator.clipboard.writeText(t);setStatus('Copiado')}catch{$('output').select();document.execCommand('copy');setStatus('Copiado')}};
$('btnDownload').onclick=()=>{const t=$('output').value;if(!t)return;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'text/javascript'}));a.download='qyrexobf_protected.js';a.click()};
</script>
</body>
</html>`;

// ===================== ROUTES =====================

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
      compact: !!body.compact,
      deadCode: true
    });
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Error' });
  }
});

app.get('*', (_req, res) => {
  res.type('html').send(HTML);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Qyrexobf listening on 0.0.0.0:' + PORT);
});
