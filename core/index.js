// Main entry point - Orchestrates the obfuscation pipeline
import { tokenize, Tokenizer } from './tokenizer.js';
import { parse, Parser } from './parser.js';
import { transform, Transformer } from '../layers/transformer.js';
import { emit, Emitter } from '../emitter/emitter.js';
import { presets, getObfuscationSummary, measureComplexity } from '../utils/helpers.js';

export class CypherShield {
  constructor(config = {}) {
    this.config = {
      preset: 'Medium',
      stringEncryption: true,
      controlFlowFlattening: true,
      nameMangling: true,
      antiSandbox: false,
      debugLogging: false,
      minify: false,
      compact: false,
      ...config,
    };

    // Apply preset if specified
    if (this.config.preset && presets[this.config.preset]) {
      const presetConfig = presets[this.config.preset];
      this.config = { ...this.config, ...presetConfig };
    }
  }

  obfuscate(sourceCode) {
    try {
      // Phase 1: Tokenization
      if (this.config.debugLogging) {
        console.log('[CypherShield] Phase 1: Tokenization...');
      }
      const tokens = tokenize(sourceCode);

      // Phase 2: Parsing
      if (this.config.debugLogging) {
        console.log('[CypherShield] Phase 2: Parsing...');
      }
      const ast = parse(tokens);

      // Phase 3: Transformation
      if (this.config.debugLogging) {
        console.log('[CypherShield] Phase 3: Transformation...');
      }
      const transformedAst = transform(ast, this.config);

      // Phase 4: Code Generation
      if (this.config.debugLogging) {
        console.log('[CypherShield] Phase 4: Code Generation...');
      }
      let obfuscatedCode = emit(transformedAst);

      // Phase 5: Post-processing
      if (this.config.minify || this.config.compact) {
        obfuscatedCode = this.minify(obfuscatedCode);
      }

      if (this.config.debugLogging) {
        console.log('[CypherShield] Obfuscation complete');
        console.log(getObfuscationSummary(sourceCode, obfuscatedCode));
      }

      return {
        code: obfuscatedCode,
        ast: transformedAst,
        summary: getObfuscationSummary(sourceCode, obfuscatedCode),
      };
    } catch (error) {
      throw new Error(`[CypherShield] Obfuscation failed: ${error.message}`);
    }
  }

  minify(code) {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*/g, '') // Remove line comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/\s*([{}();:,=\[\]])\s*/g, '$1') // Remove spaces around punctuation
      .trim();
  }

  obfuscateFile(filePath) {
    const fs = require('fs');
    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const result = this.obfuscate(sourceCode);
    
    const outputPath = filePath.replace(/\.js$/, '.obf.js');
    fs.writeFileSync(outputPath, result.code, 'utf-8');
    
    if (this.config.debugLogging) {
      console.log(`[CypherShield] Output written to: ${outputPath}`);
    }
    
    return result;
  }

  obfuscateDir(dirPath, outputDir = null) {
    const fs = require('fs');
    const path = require('path');
    
    outputDir = outputDir || path.join(dirPath, 'obfuscated');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const results = [];

    function walkDir(currentPath, relativePath = '') {
      const files = fs.readdirSync(currentPath);

      files.forEach(file => {
        const fullPath = path.join(currentPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          walkDir(fullPath, path.join(relativePath, file));
        } else if (file.endsWith('.js')) {
          const sourceCode = fs.readFileSync(fullPath, 'utf-8');
          const result = this.obfuscate(sourceCode);
          
          const outDir = path.join(outputDir, relativePath);
          if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
          }

          const outPath = path.join(outDir, file.replace(/\.js$/, '.obf.js'));
          fs.writeFileSync(outPath, result.code, 'utf-8');
          
          results.push({
            input: fullPath,
            output: outPath,
            ...result.summary,
          });
        }
      });
    }

    walkDir(dirPath);
    return results;
  }
}

export function createObfuscator(config = {}) {
  return new CypherShield(config);
}

export default CypherShield;
