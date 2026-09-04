#!/usr/bin/env node

// CLI Interface for CypherShield
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import CypherShield from '../core/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CypherShieldCLI {
  constructor(argv) {
    this.argv = argv.slice(2);
    this.config = {
      preset: 'Medium',
      debugLogging: false,
      output: null,
      compact: false,
    };
  }

  run() {
    if (this.argv.length === 0) {
      this.showHelp();
      return;
    }

    this.parseArgs();

    if (!this.inputFile) {
      console.error('[CypherShield] Error: No input file specified');
      process.exit(1);
    }

    if (!fs.existsSync(this.inputFile)) {
      console.error(`[CypherShield] Error: File not found: ${this.inputFile}`);
      process.exit(1);
    }

    this.obfuscate();
  }

  parseArgs() {
    for (let i = 0; i < this.argv.length; i++) {
      const arg = this.argv[i];

      if (arg === '-h' || arg === '--help') {
        this.showHelp();
        process.exit(0);
      }

      if (arg === '-p' || arg === '--preset') {
        this.config.preset = this.argv[++i];
      } else if (arg === '-o' || arg === '--output') {
        this.config.output = this.argv[++i];
      } else if (arg === '-d' || arg === '--debug') {
        this.config.debugLogging = true;
      } else if (arg === '-c' || arg === '--compact') {
        this.config.compact = true;
      } else if (arg === '--no-string-encryption') {
        this.config.stringEncryption = false;
      } else if (arg === '--no-control-flow') {
        this.config.controlFlowFlattening = false;
      } else if (arg === '--no-name-mangling') {
        this.config.nameMangling = false;
      } else if (arg === '--anti-sandbox') {
        this.config.antiSandbox = true;
      } else if (!this.inputFile) {
        this.inputFile = arg;
      }
    }
  }

  obfuscate() {
    console.log('[CypherShield] Starting obfuscation...');
    console.log(`[CypherShield] Input: ${this.inputFile}`);
    console.log(`[CypherShield] Preset: ${this.config.preset}`);

    const sourceCode = fs.readFileSync(this.inputFile, 'utf-8');
    const obfuscator = new CypherShield(this.config);

    try {
      const result = obfuscator.obfuscate(sourceCode);

      const outputFile = this.config.output || this.inputFile.replace(/\.js$/, '.obf.js');
      fs.writeFileSync(outputFile, result.code, 'utf-8');

      console.log(`[CypherShield] Output: ${outputFile}`);
      console.log(`[CypherShield] Original size: ${result.summary.originalSize} bytes`);
      console.log(`[CypherShield] Obfuscated size: ${result.summary.obfuscatedSize} bytes`);
      console.log(`[CypherShield] Size change: ${result.summary.expansionRatio}`);
      console.log('[CypherShield] Obfuscation complete');
    } catch (error) {
      console.error(`[CypherShield] Error: ${error.message}`);
      process.exit(1);
    }
  }

  showHelp() {
    console.log(`
CypherShield - Multi-Layer JavaScript Obfuscator v2.0.0

Usage:
  cyphershield [options] <input-file>

Options:
  -h, --help                    Show this help message
  -o, --output <file>          Specify output file path
  -p, --preset <preset>        Obfuscation preset: Low, Medium, High, Ultra (default: Medium)
  -d, --debug                  Enable debug logging
  -c, --compact                Minify the output
  --anti-sandbox               Enable anti-sandbox detection injection
  --no-string-encryption       Disable string encryption
  --no-control-flow            Disable control flow flattening
  --no-name-mangling           Disable name mangling

Presets:
  Low       - Name mangling + string encryption
  Medium    - Name mangling + string encryption + control flow flattening
  High      - All transformations + anti-sandbox injection
  Ultra     - All transformations + anti-sandbox + additional hardening

Examples:
  cyphershield app.js
  cyphershield -p High -o app.protected.js app.js
  cyphershield --anti-sandbox --debug malware.js
    `);
  }
}

const cli = new CypherShieldCLI(process.argv);
cli.run();
