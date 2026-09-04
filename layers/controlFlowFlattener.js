// Control Flow Flattening - IronBrew2 technique
import * as Nodes from '../ast/nodes.js';
import { generateRandomId } from '../utils/helpers.js';

export class ControlFlowFlattener {
  constructor(transformer) {
    this.transformer = transformer;
    this.stateCounter = 0;
  }

  transform(ast) {
    return this.transformNode(ast);
  }

  transformNode(node) {
    if (!node) return node;

    switch (node.type) {
      case Nodes.NodeTypes.Program:
        return {
          ...node,
          body: node.body.map(stmt => this.transformNode(stmt)),
        };

      case Nodes.NodeTypes.BlockStatement:
        return {
          ...node,
          body: this.flattenBlock(node.body),
        };

      case Nodes.NodeTypes.FunctionDeclaration:
        return {
          ...node,
          body: this.transformNode(node.body),
        };

      case Nodes.NodeTypes.IfStatement:
        return this.flattenIfStatement(node);

      case Nodes.NodeTypes.WhileStatement:
        return this.flattenWhileStatement(node);

      case Nodes.NodeTypes.ForStatement:
        return this.flattenForStatement(node);

      default:
        return this.transformer.transformNode(node);
    }
  }

  flattenBlock(statements) {
    const result = [];
    for (const stmt of statements) {
      const transformed = this.transformNode(stmt);
      if (transformed) result.push(transformed);
    }
    return result;
  }

  flattenIfStatement(ifStmt) {
    // Convert if statements to state machine with switch
    const stateVar = `_s${this.stateCounter++}`;
    const testVar = `_t${this.stateCounter}`;

    // Evaluate the condition
    const conditionEval = Nodes.createVariableDeclaration([
      {
        id: Nodes.createIdentifier(testVar),
        init: ifStmt.test,
      }
    ], 'var');

    // Create state switching logic
    const ifLogic = Nodes.createIfStatement(
      Nodes.createIdentifier(testVar),
      this.transformNode(ifStmt.consequent),
      ifStmt.alternate ? this.transformNode(ifStmt.alternate) : null
    );

    return Nodes.createBlockStatement([conditionEval, ifLogic]);
  }

  flattenWhileStatement(whileStmt) {
    // Convert while to do-while with condition check
    const condVar = `_c${this.stateCounter++}`;
    
    const conditionCheck = Nodes.createVariableDeclaration([
      {
        id: Nodes.createIdentifier(condVar),
        init: whileStmt.test,
      }
    ], 'var');

    return Nodes.createBlockStatement([
      conditionCheck,
      {
        type: Nodes.NodeTypes.WhileStatement,
        test: Nodes.createIdentifier(condVar),
        body: this.transformNode(whileStmt.body),
      }
    ]);
  }

  flattenForStatement(forStmt) {
    // Extract for loop components
    const block = [];

    if (forStmt.init) {
      block.push(forStmt.init);
    }

    const whileBody = [];
    if (forStmt.body.type === Nodes.NodeTypes.BlockStatement) {
      whileBody.push(...forStmt.body.body);
    } else {
      whileBody.push(forStmt.body);
    }

    if (forStmt.update) {
      whileBody.push(Nodes.createExpressionStatement(forStmt.update));
    }

    block.push({
      type: Nodes.NodeTypes.WhileStatement,
      test: forStmt.test || { type: Nodes.NodeTypes.BooleanLiteral, value: true },
      body: Nodes.createBlockStatement(whileBody),
    });

    return Nodes.createBlockStatement(block);
  }
}
