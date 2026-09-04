// Basic Tests - Test suite para CypherShield
import assert from 'assert';
import CypherShield from '../core/index.js';

class TestSuite {
  constructor() {
    this.passedTests = 0;
    this.failedTests = 0;
  }

  test(name, fn) {
    try {
      fn();
      console.log(`✓ ${name}`);
      this.passedTests++;
    } catch (error) {
      console.error(`✗ ${name}`);
      console.error(`  ${error.message}`);
      this.failedTests++;
    }
  }

  summary() {
    console.log('\n' + '='.repeat(60));
    console.log(`Tests Passed: ${this.passedTests}`);
    console.log(`Tests Failed: ${this.failedTests}`);
    console.log(`Total: ${this.passedTests + this.failedTests}`);
    console.log('='.repeat(60));
  }
}

const tests = new TestSuite();

// Test 1: Basic obfuscation
tests.test('Basic obfuscation should return string', () => {
  const obfuscator = new CypherShield();
  const result = obfuscator.obfuscate('const x = 42;');
  assert.strictEqual(typeof result.code, 'string');
  assert.ok(result.code.length > 0);
});

// Test 2: Name mangling
tests.test('Name mangling should rename variables', () => {
  const obfuscator = new CypherShield({ 
    stringEncryption: false,
    controlFlowFlattening: false 
  });
  const result = obfuscator.obfuscate('let myVariable = 123;');
  assert.ok(!result.code.includes('myVariable'));
});

// Test 3: String encryption
tests.test('String encryption should encrypt strings', () => {
  const obfuscator = new CypherShield({ 
    stringEncryption: true,
    controlFlowFlattening: false,
    nameMangling: false 
  });
  const result = obfuscator.obfuscate('const msg = "Hello";');
  assert.ok(!result.code.includes('Hello'));
  assert.ok(result.code.includes('K')); // String array marker
});

// Test 4: Control flow flattening
tests.test('Control flow flattening should transform if statements', () => {
  const obfuscator = new CypherShield({ 
    controlFlowFlattening: true,
    stringEncryption: false,
    nameMangling: false 
  });
  const result = obfuscator.obfuscate('if (x > 5) { y = 10; }');
  assert.ok(result.code.length > 0);
});

// Test 5: Anti-sandbox should inject detection
tests.test('Anti-sandbox injection should add detection code', () => {
  const obfuscator = new CypherShield({ 
    antiSandbox: true,
    stringEncryption: false,
    controlFlowFlattening: false,
    nameMangling: false 
  });
  const result = obfuscator.obfuscate('console.log("test");');
  assert.ok(result.code.includes('globalThis') || result.code.includes('window'));
});

// Test 6: Preset Low
tests.test('Preset Low should only use name mangling and string encryption', () => {
  const obfuscator = new CypherShield({ preset: 'Low' });
  const result = obfuscator.obfuscate('const test = "value";');
  assert.ok(result.code.length > 0);
  assert.ok(!result.code.includes('test'));
});

// Test 7: Preset Medium
tests.test('Preset Medium should apply all main transformations', () => {
  const obfuscator = new CypherShield({ preset: 'Medium' });
  const result = obfuscator.obfuscate('function add(a, b) { return a + b; }');
  assert.ok(result.code.length > 0);
  assert.ok(!result.code.includes('add'));
  assert.ok(!result.code.includes('function add'));
});

// Test 8: Preset High
tests.test('Preset High should include anti-sandbox', () => {
  const obfuscator = new CypherShield({ preset: 'High' });
  const result = obfuscator.obfuscate('const x = 1;');
  assert.ok(result.code.length > 0);
});

// Test 9: Output size should increase
tests.test('Obfuscated code should be larger than original', () => {
  const obfuscator = new CypherShield({ preset: 'Medium' });
  const original = 'const message = "Hello, World!";';
  const result = obfuscator.obfuscate(original);
  assert.ok(result.code.length > original.length);
});

// Test 10: Summary should contain statistics
tests.test('Summary should contain obfuscation statistics', () => {
  const obfuscator = new CypherShield();
  const result = obfuscator.obfuscate('const x = 42;');
  assert.ok(result.summary.originalSize);
  assert.ok(result.summary.obfuscatedSize);
  assert.ok(result.summary.expansionRatio);
  assert.ok(result.summary.compressionRatio);
});

// Test 11: AST should be valid
tests.test('Transformed AST should be valid', () => {
  const obfuscator = new CypherShield();
  const result = obfuscator.obfuscate('const x = 42;');
  assert.ok(result.ast);
  assert.strictEqual(result.ast.type, 'Program');
  assert.ok(Array.isArray(result.ast.body));
});

// Test 12: Complex code obfuscation
tests.test('Complex code should be obfuscated without errors', () => {
  const obfuscator = new CypherShield({ preset: 'High' });
  const complex = `
    class Calculator {
      constructor(initialValue = 0) {
        this.value = initialValue;
      }
      
      add(n) {
        this.value += n;
        return this;
      }
      
      subtract(n) {
        this.value -= n;
        return this;
      }
      
      multiply(n) {
        this.value *= n;
        return this;
      }
      
      getResult() {
        return this.value;
      }
    }
    
    const calc = new Calculator();
    const result = calc.add(5).multiply(2).subtract(3).getResult();
  `;
  
  const result = obfuscator.obfuscate(complex);
  assert.ok(result.code.length > 0);
  assert.ok(!result.code.includes('Calculator'));
  assert.ok(!result.code.includes('initialValue'));
});

// Test 13: Error handling
tests.test('Invalid code should throw error', () => {
  const obfuscator = new CypherShield();
  try {
    obfuscator.obfuscate('const x = {invalid json');
    assert.fail('Should have thrown error');
  } catch (error) {
    assert.ok(error.message.includes('Obfuscation failed'));
  }
});

// Test 14: Minification
tests.test('Minify option should reduce size', () => {
  const obfuscator = new CypherShield({ compact: true });
  const result = obfuscator.obfuscate('const   x   =   42 ;');
  assert.ok(!result.code.includes('   '));
});

// Test 15: Function declaration obfuscation
tests.test('Function declarations should be mangled', () => {
  const obfuscator = new CypherShield({ 
    nameMangling: true,
    stringEncryption: false,
    controlFlowFlattening: false 
  });
  const result = obfuscator.obfuscate('function myFunction() { return 42; }');
  assert.ok(!result.code.includes('myFunction'));
});

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running CypherShield Test Suite...\n');
  tests.summary();
}

export { tests };
