// Constant Obfuscator - Transforms numeric constants into complex expressions
import * as Nodes from '../ast/nodes.js';

export class ConstantObfuscator {
  constructor(transformer) {
    this.transformer = transformer;
    this.constantMap = new Map();
  }

  transform(ast) {
    return this.transformNode(ast);
  }

  transformNode(node) {
    if (!node) return node;

    if (node.type === Nodes.NodeTypes.NumericLiteral) {
      return this.obfuscateNumber(node.value);
    }

    // Recursively transform all child nodes
    if (typeof node === 'object') {
      for (const key in node) {
        if (Array.isArray(node[key])) {
          node[key] = node[key].map(child => this.transformNode(child));
        } else if (typeof node[key] === 'object') {
          node[key] = this.transformNode(node[key]);
        }
      }
    }

    return node;
  }

  obfuscateNumber(value) {
    if (this.constantMap.has(value)) {
      return this.constantMap.get(value);
    }

    const obfuscated = this.generateObfuscatedExpression(value);
    this.constantMap.set(value, obfuscated);
    return obfuscated;
  }

  generateObfuscatedExpression(value) {
    // For small numbers, use simple bitwise operations
    if (value >= 0 && value <= 255) {
      return this.obfuscateSmallNumber(value);
    }

    // For larger numbers, use mathematical expressions
    return this.obfuscateLargeNumber(value);
  }

  obfuscateSmallNumber(value) {
    const methods = [
      () => Nodes.createBinaryExpression('+', Nodes.createNumericLiteral(value), Nodes.createNumericLiteral(0)),
      () => Nodes.createBinaryExpression('|', Nodes.createNumericLiteral(value), Nodes.createNumericLiteral(0)),
      () => Nodes.createBinaryExpression('&', Nodes.createNumericLiteral(value | 0), Nodes.createNumericLiteral(-1)),
      () => Nodes.createBinaryExpression('^', Nodes.createNumericLiteral(value ^ 0), Nodes.createNumericLiteral(0)),
      () => this.createSumExpression(value),
      () => this.createProductExpression(value),
    ];

    return methods[Math.floor(Math.random() * methods.length)]();
  }

  obfuscateLargeNumber(value) {
    const factors = this.factorize(Math.abs(value));

    if (factors.length > 1) {
      let expr = Nodes.createNumericLiteral(factors[0]);
      for (let i = 1; i < factors.length; i++) {
        expr = Nodes.createBinaryExpression(
          '*',
          expr,
          Nodes.createNumericLiteral(factors[i])
        );
      }

      if (value < 0) {
        expr = Nodes.createBinaryExpression(
          '*',
          expr,
          Nodes.createNumericLiteral(-1)
        );
      }

      return expr;
    }

    // If prime, use addition/subtraction from nearby numbers
    return this.createNearbyExpression(value);
  }

  createSumExpression(value) {
    const parts = [];
    let remaining = value;

    while (remaining > 0) {
      const part = Math.floor(Math.random() * remaining) + 1;
      parts.push(part);
      remaining -= part;
    }

    if (parts.length === 0) parts.push(0);

    let expr = Nodes.createNumericLiteral(parts[0]);
    for (let i = 1; i < parts.length; i++) {
      expr = Nodes.createBinaryExpression(
        '+',
        expr,
        Nodes.createNumericLiteral(parts[i])
      );
    }

    return expr;
  }

  createProductExpression(value) {
    if (value === 0) {
      return Nodes.createBinaryExpression(
        '*',
        Nodes.createNumericLiteral(Math.random() * 1000),
        Nodes.createNumericLiteral(0)
      );
    }

    const factors = [1, value];
    for (let i = 2; i <= Math.sqrt(value); i++) {
      if (value % i === 0) {
        factors.push(i);
        factors.push(value / i);
      }
    }

    if (factors.length > 2) {
      const f1 = factors[Math.floor(Math.random() * factors.length)];
      const f2 = value / f1;

      return Nodes.createBinaryExpression(
        '*',
        Nodes.createNumericLiteral(f1),
        Nodes.createNumericLiteral(f2)
      );
    }

    return Nodes.createNumericLiteral(value);
  }

  createNearbyExpression(value) {
    const base = Math.floor(value / 100) * 100;
    const offset = value - base;

    if (offset === 0) {
      return Nodes.createNumericLiteral(base);
    }

    return Nodes.createBinaryExpression(
      '+',
      Nodes.createNumericLiteral(base),
      Nodes.createNumericLiteral(offset)
    );
  }

  factorize(n) {
    const factors = [];
    let divisor = 2;

    while (divisor * divisor <= n) {
      while (n % divisor === 0) {
        factors.push(divisor);
        n /= divisor;
      }
      divisor++;
    }

    if (n > 1) {
      factors.push(n);
    }

    return factors.length > 0 ? factors : [n];
  }
}
