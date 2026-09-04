// Dead Code Injection - Adds unreachable code for obfuscation
import * as Nodes from '../ast/nodes.js';
import { generateRandomId, generateRandomString } from '../utils/helpers.js';

export class DeadCodeInjector {
  constructor(transformer) {
    this.transformer = transformer;
    this.injectionCount = 0;
  }

  transform(ast) {
    if (ast.type === Nodes.NodeTypes.Program) {
      return {
        ...ast,
        body: this.injectDeadCode(ast.body),
      };
    }
    return ast;
  }

  injectDeadCode(statements) {
    const result = [];
    const injectionRate = 0.3; // Inyecta código muerto cada 3 statements

    for (let i = 0; i < statements.length; i++) {
      result.push(statements[i]);

      // Randomly inject dead code
      if (Math.random() < injectionRate) {
        result.push(this.generateDeadCodeBlock());
      }
    }

    return result;
  }

  generateDeadCodeBlock() {
    const type = Math.floor(Math.random() * 5);

    switch (type) {
      case 0:
        return this.generateUnreachableIfBlock();
      case 1:
        return this.generateUnusedVariable();
      case 2:
        return this.generateFakeLoop();
      case 3:
        return this.generateDeadFunctionCall();
      case 4:
        return this.generateComplexExpression();
      default:
        return this.generateUnusedVariable();
    }
  }

  generateUnreachableIfBlock() {
    const varName = generateRandomId(8);
    return Nodes.createIfStatement(
      Nodes.createBinaryExpression(
        '===',
        Nodes.createNumericLiteral(Math.random()),
        Nodes.createNumericLiteral(Math.random() + 1)
      ),
      Nodes.createBlockStatement([
        Nodes.createExpressionStatement(
          Nodes.createFunctionCall(
            Nodes.createIdentifier('unreachable'),
            [Nodes.createStringLiteral(generateRandomString(32))]
          )
        ),
      ])
    );
  }

  generateUnusedVariable() {
    const varName = generateRandomId(8);
    return Nodes.createVariableDeclaration([
      {
        id: Nodes.createIdentifier(varName),
        init: Nodes.createBinaryExpression(
          '+',
          Nodes.createNumericLiteral(Math.floor(Math.random() * 1000)),
          Nodes.createNumericLiteral(Math.floor(Math.random() * 1000))
        ),
      }
    ], 'var');
  }

  generateFakeLoop() {
    return Nodes.createForStatement(
      Nodes.createVariableDeclaration([
        {
          id: Nodes.createIdentifier(`_i${this.injectionCount++}`),
          init: Nodes.createNumericLiteral(0),
        }
      ], 'var'),
      Nodes.createBinaryExpression(
        '<',
        Nodes.createIdentifier(`_i${this.injectionCount - 1}`),
        Nodes.createNumericLiteral(0) // Never executes
      ),
      null,
      Nodes.createBlockStatement([
        Nodes.createExpressionStatement(
          Nodes.createFunctionCall(
            Nodes.createIdentifier('void'),
            [Nodes.createNumericLiteral(0)]
          )
        ),
      ])
    );
  }

  generateDeadFunctionCall() {
    const funcNames = [
      'eval', 'Function', 'setTimeout', 'setInterval', 'Promise',
      'async', 'await', 'Symbol', 'Proxy', 'Reflect'
    ];
    const randomFunc = funcNames[Math.floor(Math.random() * funcNames.length)];

    return Nodes.createExpressionStatement(
      Nodes.createFunctionCall(
        Nodes.createIdentifier(randomFunc),
        [Nodes.createStringLiteral(generateRandomString(64))]
      )
    );
  }

  generateComplexExpression() {
    const operators = ['+', '-', '*', '/', '%', '&', '|', '^', '<<', '>>', '>>>'];
    const operator = operators[Math.floor(Math.random() * operators.length)];

    let expr = Nodes.createNumericLiteral(Math.floor(Math.random() * 1000));

    for (let i = 0; i < 3; i++) {
      expr = Nodes.createBinaryExpression(
        operator,
        expr,
        Nodes.createNumericLiteral(Math.floor(Math.random() * 1000))
      );
    }

    return Nodes.createExpressionStatement(expr);
  }
}
