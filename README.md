# Qyrexobf v2.0.0

**Advanced Multi-Layer JavaScript Obfuscator** — Fusion de Prometheus + IronBrew2 + Anti-Sandbox Evasion

## Features

### Core Obfuscation Layers
- **Name Mangling** — Renombra variables, funciones y parámetros automáticamente
- **String Encryption** — Encripta strings con XOR + Base64 (técnica Prometheus)
- **Control Flow Flattening** — Aplana estructura de control (técnica IronBrew2)
- **Anti-Sandbox Detection** — Inyecta detección de entornos de análisis
- **Dead Code Injection** — Agrega código muerto para confundir análisis estático

### Características Adicionales
- Soporte para múltiples presets (Low, Medium, High, Ultra)
- CLI integrada para procesamiento de archivos
- Análisis de complejidad y estadísticas
- Modo debug con logging detallado
- Minificación opcional
- Procesamiento recursivo de directorios

## Installation

```bash
npm install -g qyrexobf
# o
npm install qyrexobf --save-dev
```

## Quick Start

### CLI Usage

```bash
# Ofuscación básica (preset Medium)
qyrexobf input.js

# Con preset específico
qyrexobf -p High input.js

# Salida personalizada
qyrexobf -o protected.js input.js

# Con todas las opciones
qyrexobf -p Ultra --anti-sandbox --debug --compact input.js
```

### Programmatic Usage

```javascript
import Qyrexobf from 'qyrexobf';

const obfuscator = new Qyrexobf({
  preset: 'High',
  stringEncryption: true,
  controlFlowFlattening: true,
  nameMangling: true,
  antiSandbox: true,
  debugLogging: true,
});

const sourceCode = `
function calculateHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
  }
  return hash;
}
`;

const result = obfuscator.obfuscate(sourceCode);
console.log(result.code);       // Obfuscated code
console.log(result.summary);    // Statistics
```

## Presets

### Low
- ✅ Name Mangling
- ✅ String Encryption
- ❌ Control Flow Flattening
- ❌ Anti-Sandbox

**Uso:** Ofuscación rápida con overhead mínimo.

### Medium (Default)
- ✅ Name Mangling
- ✅ String Encryption
- ✅ Control Flow Flattening
- ❌ Anti-Sandbox

**Uso:** Balance entre protección y rendimiento.

### High
- ✅ Name Mangling
- ✅ String Encryption
- ✅ Control Flow Flattening
- ✅ Anti-Sandbox

**Uso:** Máxima protección contra análisis estático.

### Ultra
- ✅ Name Mangling
- ✅ String Encryption
- ✅ Control Flow Flattening
- ✅ Anti-Sandbox
- ✅ Dead Code Injection (futuro)
- ✅ Constant Obfuscation (futuro)

**Uso:** Protección maximal contra análisis dinámico.

## API Reference

### Qyrexobf(config)

Constructor que inicializa el obfuscador.

**Parámetros:**
```javascript
{
  preset: 'Medium',              // Preset: Low, Medium, High, Ultra
  stringEncryption: true,        // Encriptar strings
  controlFlowFlattening: true,   // Aplanar control flow
  nameMangling: true,            // Renombrar variables
  antiSandbox: false,            // Inyectar detección de sandbox
  debugLogging: false,           // Mostrar logs detallados
  minify: false,                 // Minificar salida
  compact: false,                // Formato compacto
}
```

### obfuscate(sourceCode)

Ofusca código JavaScript.

**Retorna:**
```javascript
{
  code: string,           // Código ofuscado
  ast: AST,              // AST transformado
  summary: {
    originalSize: number,
    obfuscatedSize: number,
    compressionRatio: string,
    expansionRatio: string,
  }
}
```

**Ejemplo:**
```javascript
const result = obfuscator.obfuscate('const x = 42;');
console.log(result.code);
```

### obfuscateFile(filePath)

Ofusca archivo y guarda resultado.

```javascript
const result = obfuscator.obfuscateFile('input.js');
// Salida: input.obf.js
```

### obfuscateDir(dirPath, outputDir)

Ofusca todos los archivos .js en un directorio recursivamente.

```javascript
const results = obfuscator.obfuscateDir('./src', './dist');
results.forEach(r => console.log(r.input, '->', r.output));
```

## Architecture

```
Qyrexobf/
├── core/
│   ├── index.js            # Main orchestrator
│   ├── tokenizer.js        # Lexical analysis
│   └── parser.js           # Syntax analysis
├── layers/
│   ├── transformer.js      # Transformation pipeline
│   ├── stringEncryptor.js  # String encryption (Prometheus)
│   ├── controlFlowFlattener.js  # CFG flattening (IronBrew2)
│   └── nameMangler.js      # Variable/function renaming
├── evasion/
│   └── antiSandboxInjector.js   # Sandbox detection
├── emitter/
│   └── emitter.js          # Code generation
├── ast/
│   └── nodes.js            # AST node definitions
├── utils/
│   └── helpers.js          # Utility functions
└── cli/
    └── index.js            # Command-line interface
```

## Pipeline

```
Source Code
    ↓
[Tokenizer] → Tokens
    ↓
[Parser] → AST
    ↓
[Transformer] → Phases:
    ├── Name Mangling
    ├── String Encryption
    ├── Control Flow Flattening
    └── Anti-Sandbox Injection
    ↓
[Emitter] → Obfuscated Code
```

## Example Transformation

**Input:**
```javascript
function greet(name) {
  const message = "Hello, " + name;
  console.log(message);
  return message;
}

greet("World");
```

**Output (Medium preset):**
```javascript
var _K = ['SGVs...', 'Y29u...', ...];  // Encrypted strings
function _aB1kLm(_p2nQ) {
  const _x8yZ = _K[0] + _p2nQ;
  _K[1](_x8yZ);
  return _x8yZ;
}
_aB1kLm(_K[2]);
```

## CLI Options

```
-h, --help                   Help
-o, --output <file>         Output file
-p, --preset <preset>       Preset: Low, Medium, High, Ultra
-d, --debug                 Debug logging
-c, --compact               Minify output
--anti-sandbox              Enable anti-sandbox
--no-string-encryption      Disable string encryption
--no-control-flow           Disable control flow flattening
--no-name-mangling          Disable name mangling
```

## Performance

| Preset | Speed | Protection | Output Size |
|--------|-------|-----------|-------------|
| Low | ⚡⚡⚡ | ⭐⭐ | +10% |
| Medium | ⚡⚡ | ⭐⭐⭐ | +25% |
| High | ⚡ | ⭐⭐⭐⭐ | +40% |
| Ultra | 🐌 | ⭐⭐⭐⭐⭐ | +60% |

## Security Notes

⚠️ **Obfuscation ≠ Encryption**

- Obfuscation ralentiza el análisis pero no lo previene completamente
- Código obfuscado puede ser revertido con herramientas avanzadas
- No protege contra acceso directo al runtime
- Úsalo como primera línea de defensa, no como única protección

## Limitations

- No soporta AST extendido (getters/setters, decoradores, etc.)
- Algunos patrones complejos pueden no ofuscarse correctamente
- El rendimiento se degrada con código muy grande
- Algunos frameworks pueden requerir configuración especial

## Roadmap

- [x] Name Mangling
- [x] String Encryption
- [x] Control Flow Flattening
- [x] Anti-Sandbox Detection
- [ ] Dead Code Injection
- [ ] Constant Pool Obfuscation
- [ ] Proxy Object Wrapping
- [ ] VirtualMachine bytecode generation
- [ ] WebAssembly integration
- [ ] Multi-threading support

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Debug mode
npm run debug
```

## License

MIT

## Author

Qyrex — Advanced Security Research

---

**Qyrexobf** — Where code protection meets obfuscation science.
