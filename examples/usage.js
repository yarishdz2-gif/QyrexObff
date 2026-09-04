// Examples - Uso de CypherShield

// Ejemplo 1: Ofuscación básica con preset Medium
import CypherShield from './core/index.js';

const example1 = () => {
  const obfuscator = new CypherShield({ preset: 'Medium' });
  
  const code = `
    function fibonacci(n) {
      if (n <= 1) return n;
      return fibonacci(n - 1) + fibonacci(n - 2);
    }
    
    console.log(fibonacci(10));
  `;

  const result = obfuscator.obfuscate(code);
  console.log('Example 1 - Basic Obfuscation:');
  console.log(result.code);
  console.log('Stats:', result.summary);
};

// Ejemplo 2: Máxima protección con preset Ultra
const example2 = () => {
  const obfuscator = new CypherShield({ 
    preset: 'Ultra',
    debugLogging: true 
  });

  const code = `
    const API_KEY = "sk_live_secret_key_123456";
    const API_URL = "https://api.example.com/v1";
    
    async function fetchUser(id) {
      const response = await fetch(API_URL + '/users/' + id, {
        headers: { 'Authorization': 'Bearer ' + API_KEY }
      });
      return await response.json();
    }
  `;

  const result = obfuscator.obfuscate(code);
  console.log('\nExample 2 - Ultra Protection:');
  console.log(result.code);
};

// Ejemplo 3: Ofuscación con opciones personalizadas
const example3 = () => {
  const obfuscator = new CypherShield({
    stringEncryption: true,
    controlFlowFlattening: true,
    nameMangling: true,
    antiSandbox: true,
    compact: true,
  });

  const code = `
    class DataProcessor {
      constructor(data) {
        this.data = data;
        this.processed = false;
      }
      
      process() {
        if (!this.data) return null;
        const result = this.data.map(x => x * 2);
        this.processed = true;
        return result;
      }
    }
  `;

  const result = obfuscator.obfuscate(code);
  console.log('\nExample 3 - Custom Configuration:');
  console.log(result.code);
};

// Ejemplo 4: Ofuscación de archivo único
const example4 = () => {
  const obfuscator = new CypherShield({ preset: 'High' });
  
  try {
    const result = obfuscator.obfuscateFile('input.js');
    console.log('\nExample 4 - File Obfuscation:');
    console.log('Output written to:', result.outputFile);
    console.log('Original size:', result.summary.originalSize);
    console.log('Obfuscated size:', result.summary.obfuscatedSize);
  } catch (error) {
    console.log('File not found - skipping example 4');
  }
};

// Ejemplo 5: Ofuscación de directorio
const example5 = () => {
  const obfuscator = new CypherShield({ preset: 'Medium' });
  
  try {
    const results = obfuscator.obfuscateDir('./src', './dist/obfuscated');
    console.log('\nExample 5 - Directory Obfuscation:');
    results.forEach(result => {
      console.log(`${result.input} -> ${result.output}`);
    });
  } catch (error) {
    console.log('Directory not found - skipping example 5');
  }
};

// Ejemplo 6: Comparación de presets
const example6 = () => {
  const testCode = `
    function encryptData(data, key) {
      let encrypted = '';
      for (let i = 0; i < data.length; i++) {
        encrypted += String.fromCharCode(data.charCodeAt(i) ^ key);
      }
      return encrypted;
    }
  `;

  console.log('\nExample 6 - Preset Comparison:');
  console.log('Original code size:', testCode.length, 'bytes\n');

  ['Low', 'Medium', 'High', 'Ultra'].forEach(preset => {
    const obfuscator = new CypherShield({ preset });
    const result = obfuscator.obfuscate(testCode);
    console.log(`${preset} Preset:`);
    console.log(`  Size: ${result.summary.obfuscatedSize} bytes`);
    console.log(`  Expansion: ${result.summary.expansionRatio}`);
  });
};

// Ejemplo 7: Detección de sandbox con anti-sandbox
const example7 = () => {
  const obfuscator = new CypherShield({
    antiSandbox: true,
    debugLogging: true,
  });

  const code = `
    const hasWindow = typeof window !== 'undefined';
    const hasProcess = typeof process !== 'undefined';
    
    if (hasWindow) {
      console.log('Running in browser');
    } else if (hasProcess) {
      console.log('Running in Node.js');
    }
  `;

  const result = obfuscator.obfuscate(code);
  console.log('\nExample 7 - Anti-Sandbox Detection:');
  console.log(result.code);
};

// Ejemplo 8: Ofuscación sin algunas capas
const example8 = () => {
  const obfuscator = new CypherShield({
    stringEncryption: false,     // Disable string encryption
    controlFlowFlattening: true,
    nameMangling: true,
    antiSandbox: false,
  });

  const code = `
    function validate(email) {
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      return emailRegex.test(email);
    }
  `;

  const result = obfuscator.obfuscate(code);
  console.log('\nExample 8 - Selective Obfuscation (no string encryption):');
  console.log(result.code);
};

// Ejecutar ejemplos
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('='.repeat(60));
  console.log('CypherShield - Obfuscation Examples');
  console.log('='.repeat(60));
  
  try {
    example1();
    example2();
    example3();
    example6();
    example7();
    example8();
  } catch (error) {
    console.error('Error running examples:', error.message);
  }
}

export { example1, example2, example3, example4, example5, example6, example7, example8 };
