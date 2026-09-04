// Transformer - Applies all obfuscation layers
import * as Nodes from '../ast/nodes.js';
import { StringEncryptor } from './stringEncryptor.js';
import { ControlFlowFlattener } from './controlFlowFlattener.js';
import { NameMangler } from './nameMangler.js';
import { AntiSandboxInjector } from '../evasion/antiSandboxInjector.js';

export class Transformer {
  constructor(ast, config = {}) {
    this.ast = ast;
    this.config = {
      stringEncryption: true,
      controlFlowFlattening: true,
      nameMangling: true,
      antiSandbox: false,
      debugLogging: false,
      ...config,
    };
    
    this.stringEncryptor = new StringEncryptor(this);
    this.controlFlowFlattener = new ControlFlowFlattener(this);
    this.nameMangler = new NameMangler(this);
    this.antiSandboxInjector = new AntiSandboxInjector(this);
  }

  transform() {
    if (this.config.debugLogging) {
      console.log('[CypherShield] Starting transformation pipeline...');
    }

    let transformed = this.ast;

    // Phase 1: Name Mangling - Must come first
    if (this.config.nameMangling) {
      if (this.config.debugLogging) console.log('[CypherShield] Applying name mangling...');
      transformed = this.nameMangler.transform(transformed);
    }

    // Phase 2: String Encryption - Prometheus technique
    if (this.config.stringEncryption) {
      if (this.config.debugLogging) console.log('[CypherShield] Applying string encryption...');
      transformed = this.stringEncryptor.transform(transformed);
    }

    // Phase 3: Control Flow Flattening - IronBrew2 technique
    if (this.config.controlFlowFlattening) {
      if (this.config.debugLogging) console.log('[CypherShield] Applying control flow flattening...');
      transformed = this.controlFlowFlattener.transform(transformed);
    }

    // Phase 4: Anti-Sandbox Injection
    if (this.config.antiSandbox) {
      if (this.config.debugLogging) console.log('[CypherShield] Injecting anti-sandbox evasion...');
      transformed = this.antiSandboxInjector.transform(transformed);
    }

    if (this.config.debugLogging) {
      console.log('[CypherShield] Transformation complete');
    }

    return transformed;
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
          body: node.body.map(stmt => this.transformNode(stmt)),
        };

      case Nodes.NodeTypes.ExpressionStatement:
        return {
          ...node,
          expression: this.transformNode(node.expression),
        };

      case Nodes.NodeTypes.VariableDeclaration:
        return {
          ...node,
          declarations: node.declarations.map(decl => ({
            ...decl,
            id: this.transformNode(decl.id),
            init: decl.init ? this.transformNode(decl.init) : null,
          })),
        };

      case Nodes.NodeTypes.FunctionDeclaration:
        return {
          ...node,
          id: node.id ? this.transformNode(node.id) : null,
          params: node.params.map(p => this.transformNode(p)),
          body: this.transformNode(node.body),
        };

      case Nodes.NodeTypes.IfStatement:
        return {
          ...node,
          test: this.transformNode(node.test),
          consequent: this.transformNode(node.consequent),
          alternate: node.alternate ? this.transformNode(node.alternate) : null,
        };

      case Nodes.NodeTypes.WhileStatement:
        return {
          ...node,
          test: this.transformNode(node.test),
          body: this.transformNode(node.body),
        };

      case Nodes.NodeTypes.ForStatement:
        return {
          ...node,
          init: node.init ? this.transformNode(node.init) : null,
          test: node.test ? this.transformNode(node.test) : null,
          update: node.update ? this.transformNode(node.update) : null,
          body: this.transformNode(node.body),
        };

      case Nodes.NodeTypes.FunctionCall:
        return {
          ...node,
          callee: this.transformNode(node.callee),
          arguments: node.arguments.map(arg => this.transformNode(arg)),
        };

      case Nodes.NodeTypes.MemberExpression:
        return {
          ...node,
          object: this.transformNode(node.object),
          property: this.transformNode(node.property),
        };

      case Nodes.NodeTypes.BinaryExpression:
        return {
          ...node,
          left: this.transformNode(node.left),
          right: this.transformNode(node.right),
        };

      case Nodes.NodeTypes.LogicalExpression:
        return {
          ...node,
          left: this.transformNode(node.left),
          right: this.transformNode(node.right),
        };

      case Nodes.NodeTypes.ConditionalExpression:
        return {
          ...node,
          test: this.transformNode(node.test),
          consequent: this.transformNode(node.consequent),
          alternate: this.transformNode(node.alternate),
        };

      case Nodes.NodeTypes.ArrayExpression:
        return {
          ...node,
          elements: node.elements.map(el => this.transformNode(el)),
        };

      case Nodes.NodeTypes.ObjectExpression:
        return {
          ...node,
          properties: node.properties.map(prop => ({
            key: this.transformNode(prop.key),
            value: this.transformNode(prop.value),
          })),
        };

      case Nodes.NodeTypes.ReturnStatement:
        return {
          ...node,
          argument: node.argument ? this.transformNode(node.argument) : null,
        };

      case Nodes.NodeTypes.ThrowStatement:
        return {
          ...node,
          argument: this.transformNode(node.argument),
        };

      case Nodes.NodeTypes.TryStatement:
        return {
          ...node,
          block: this.transformNode(node.block),
          handler: node.handler ? {
            param: this.transformNode(node.handler.param),
            body: this.transformNode(node.handler.body),
          } : null,
          finalizer: node.finalizer ? this.transformNode(node.finalizer) : null,
        };

      case Nodes.NodeTypes.AssignmentExpression:
        return {
          ...node,
          left: this.transformNode(node.left),
          right: this.transformNode(node.right),
        };

      default:
        return node;
    }
  }
}

export function transform(ast, config = {}) {
  const transformer = new Transformer(ast, config);
  return transformer.transform();
}
