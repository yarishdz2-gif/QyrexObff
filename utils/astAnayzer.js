// AST Analyzer - Debug and analysis tool for Qyrexobf
import * as Nodes from '../ast/nodes.js';

export class ASTAnalyzer {
  constructor(ast) {
    this.ast = ast;
    this.stats = {
      totalNodes: 0,
      nodeTypes: {},
      complexity: 0,
      depth: 0,
      functions: [],
      variables: [],
      strings: [],
      loops: 0,
      conditionals: 0,
    };
  }

  analyze() {
    this.stats = {
      totalNodes: 0,
      nodeTypes: {},
      complexity: 0,
      depth: 0,
      functions: [],
      variables: [],
      strings: [],
      loops: 0,
      conditionals: 0,
    };

    this.walk(this.ast, 0);
    return this.stats;
  }

  walk(node, depth = 0) {
    if (!node) return;

    this.stats.totalNodes++;
    this.stats.depth = Math.max(this.stats.depth, depth);

    const type = node.type || typeof node;
    this.stats.nodeTypes[type] = (this.stats.nodeTypes[type] || 0) + 1;

    // Complexity calculation
    if (node.type === Nodes.NodeTypes.FunctionDeclaration) {
      this.stats.complexity += 5;
      if (node.id) {
        this.stats.functions.push({
          name: node.id.name || 'anonymous',
          params: node.params.length,
        });
      }
    } else if (node.type === Nodes.NodeTypes.VariableDeclaration) {
      this.stats.complexity += 2;
      node.declarations.forEach(decl => {
        if (decl.id) {
          this.stats.variables.push(decl.id.name);
        }
      });
    } else if (node.type === Nodes.NodeTypes.StringLiteral) {
      this.stats.strings.push(node.value);
    } else if (node.type === Nodes.NodeTypes.WhileStatement || 
               node.type === Nodes.NodeTypes.ForStatement) {
      this.stats.loops++;
      this.stats.complexity += 10;
    } else if (node.type === Nodes.NodeTypes.IfStatement) {
      this.stats.conditionals++;
      this.stats.complexity += 3;
    }

    // Recursive walk
    if (typeof node === 'object') {
      for (const key in node) {
        if (Array.isArray(node[key])) {
          node[key].forEach(child => this.walk(child, depth + 1));
        } else if (typeof node[key] === 'object') {
          this.walk(node[key], depth + 1);
        }
      }
    }
  }

  getComplexityScore() {
    return {
      score: this.stats.complexity,
      level: this.stats.complexity < 20 ? 'Low' : 
             this.stats.complexity < 50 ? 'Medium' : 
             this.stats.complexity < 100 ? 'High' : 'Very High',
    };
  }

  printReport() {
    const complexity = this.getComplexityScore();

    console.log('\n' + '='.repeat(60));
    console.log('AST Analysis Report');
    console.log('='.repeat(60));
    console.log('\nBasic Metrics:');
    console.log(`  Total Nodes: ${this.stats.totalNodes}`);
    console.log(`  Tree Depth: ${this.stats.depth}`);
    console.log(`  Unique Node Types: ${Object.keys(this.stats.nodeTypes).length}`);
    
    console.log('\nComplexity:');
    console.log(`  Score: ${complexity.score}`);
    console.log(`  Level: ${complexity.level}`);
    
    console.log('\nCode Structure:');
    console.log(`  Functions: ${this.stats.functions.length}`);
    console.log(`  Variables: ${this.stats.variables.length}`);
    console.log(`  Strings: ${this.stats.strings.length}`);
    console.log(`  Loops: ${this.stats.loops}`);
    console.log(`  Conditionals: ${this.stats.conditionals}`);

    if (this.stats.functions.length > 0) {
      console.log('\nFunctions:');
      this.stats.functions.forEach(fn => {
        console.log(`  - ${fn.name}(${fn.params})`);
      });
    }

    if (this.stats.variables.length > 0 && this.stats.variables.length <= 20) {
      console.log('\nVariables:');
      this.stats.variables.forEach(varName => {
        console.log(`  - ${varName}`);
      });
    }

    if (this.stats.strings.length > 0 && this.stats.strings.length <= 10) {
      console.log('\nString Literals:');
      this.stats.strings.forEach(str => {
        const display = str.length > 50 ? str.substring(0, 47) + '...' : str;
        console.log(`  - "${display}"`);
      });
    }

    console.log('\nNode Type Distribution:');
    const sorted = Object.entries(this.stats.nodeTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    sorted.forEach(([type, count]) => {
      const percentage = ((count / this.stats.totalNodes) * 100).toFixed(1);
      console.log(`  ${type}: ${count} (${percentage}%)`);
    });

    console.log('\n' + '='.repeat(60));
  }

  getDOMTree(depth = 0, maxDepth = 10) {
    if (depth > maxDepth) return '...';
    
    const walk = (node, currentDepth) => {
      if (!node || currentDepth > maxDepth) return '';
      
      const indent = '  '.repeat(currentDepth);
      const type = node.type || typeof node;
      let result = `${indent}${type}`;

      if (node.name) result += ` (${node.name})`;
      if (node.value !== undefined && typeof node.value === 'string') {
        const val = node.value.length > 30 ? 
          node.value.substring(0, 27) + '...' : node.value;
        result += ` = "${val}"`;
      }

      result += '\n';

      if (typeof node === 'object') {
        for (const key in node) {
          if (key !== 'type' && key !== 'name' && key !== 'value') {
            if (Array.isArray(node[key])) {
              node[key].forEach(child => {
                result += walk(child, currentDepth + 1);
              });
            } else if (typeof node[key] === 'object' && node[key] !== null) {
              result += walk(node[key], currentDepth + 1);
            }
          }
        }
      }

      return result;
    };

    return walk(this.ast, 0);
  }

  findIdentifiers() {
    const identifiers = new Set();

    const walk = (node) => {
      if (!node) return;

      if (node.type === Nodes.NodeTypes.Identifier) {
        identifiers.add(node.name);
      }

      if (typeof node === 'object') {
        for (const key in node) {
          if (Array.isArray(node[key])) {
            node[key].forEach(child => walk(child));
          } else if (typeof node[key] === 'object') {
            walk(node[key]);
          }
        }
      }
    };

    walk(this.ast);
    return Array.from(identifiers);
  }

  findStringLiterals() {
    const strings = [];

    const walk = (node) => {
      if (!node) return;

      if (node.type === Nodes.NodeTypes.StringLiteral) {
        strings.push({
          value: node.value,
          length: node.value.length,
        });
      }

      if (typeof node === 'object') {
        for (const key in node) {
          if (Array.isArray(node[key])) {
            node[key].forEach(child => walk(child));
          } else if (typeof node[key] === 'object') {
            walk(node[key]);
          }
        }
      }
    };

    walk(this.ast);
    return strings;
  }

  compareBefore(originalAST, obfuscatedAST) {
    const analyzerBefore = new ASTAnalyzer(originalAST);
    const analyzerAfter = new ASTAnalyzer(obfuscatedAST);

    const statsBefore = analyzerBefore.analyze();
    const statsAfter = analyzerAfter.analyze();

    console.log('\n' + '='.repeat(60));
    console.log('Obfuscation Impact Analysis');
    console.log('='.repeat(60));

    console.log('\nNode Statistics:');
    console.log(`  Before: ${statsBefore.totalNodes} nodes`);
    console.log(`  After: ${statsAfter.totalNodes} nodes`);
    console.log(`  Change: ${((statsAfter.totalNodes - statsBefore.totalNodes) / statsBefore.totalNodes * 100).toFixed(1)}%`);

    console.log('\nIdentifiers:');
    const idsBefore = analyzerBefore.findIdentifiers();
    const idsAfter = analyzerAfter.findIdentifiers();
    console.log(`  Before: ${idsBefore.length} unique identifiers`);
    console.log(`  After: ${idsAfter.length} unique identifiers`);

    console.log('\nString Literals:');
    const stringsBefore = analyzerBefore.findStringLiterals();
    const stringsAfter = analyzerAfter.findStringLiterals();
    console.log(`  Before: ${stringsBefore.length} strings`);
    console.log(`  After: ${stringsAfter.length} strings`);

    console.log('\nComplexity:');
    const complexBefore = analyzerBefore.getComplexityScore();
    const complexAfter = analyzerAfter.getComplexityScore();
    console.log(`  Before: ${complexBefore.score} (${complexBefore.level})`);
    console.log(`  After: ${complexAfter.score} (${complexAfter.level})`);

    console.log('\n' + '='.repeat(60));
  }
}

export function analyzeAST(ast) {
  const analyzer = new ASTAnalyzer(ast);
  return analyzer.analyze();
}
