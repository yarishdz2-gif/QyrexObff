// Name Mangler - Obfuscates variable and function names
import * as Nodes from '../ast/nodes.js';
import { generateRandomId } from '../utils/helpers.js';

export class NameMangler {
  constructor(transformer) {
    this.transformer = transformer;
    this.nameMap = new Map();
    this.scopeStack = [new Map()]; // Stack of scopes
    this.excludedNames = new Set([
      'constructor', 'prototype', 'length', 'name', 'toString', 'valueOf',
      'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',
      '__proto__', 'get', 'set', 'call', 'apply', 'bind',
      'arguments', 'eval', 'window', 'document', 'console',
      'Math', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Date',
      'RegExp', 'Error', 'Function', 'JSON', 'Promise', 'Symbol',
    ]);
  }

  transform(ast) {
    return this.processNode(ast);
  }

  processNode(node) {
    if (!node) return node;

    switch (node.type) {
      case Nodes.NodeTypes.Program:
        return {
          ...node,
          body: node.body.map(stmt => this.processNode(stmt)),
        };

      case Nodes.NodeTypes.BlockStatement:
        this.pushScope();
        const result = {
          ...node,
          body: node.body.map(stmt => this.processNode(stmt)),
        };
        this.popScope();
        return result;

      case Nodes.NodeTypes.FunctionDeclaration:
        this.pushScope();
        const funcResult = {
          ...node,
          id: node.id ? this.mangleName(node.id) : null,
          params: node.params.map(p => this.registerParameter(p)),
          body: this.processNode(node.body),
        };
        this.popScope();
        return funcResult;

      case Nodes.NodeTypes.VariableDeclaration:
        return {
          ...node,
          declarations: node.declarations.map(decl => ({
            ...decl,
            id: this.registerVariable(decl.id),
            init: decl.init ? this.processNode(decl.init) : null,
          })),
        };

      case Nodes.NodeTypes.Identifier:
        return this.lookupOrCreateName(node);

      case Nodes.NodeTypes.MemberExpression:
        // Only mangle the object, not the property (unless computed)
        return {
          ...node,
          object: this.processNode(node.object),
          property: node.computed ? this.processNode(node.property) : node.property,
        };

      case Nodes.NodeTypes.FunctionCall:
        return {
          ...node,
          callee: this.processNode(node.callee),
          arguments: node.arguments.map(arg => this.processNode(arg)),
        };

      case Nodes.NodeTypes.BinaryExpression:
      case Nodes.NodeTypes.LogicalExpression:
        return {
          ...node,
          left: this.processNode(node.left),
          right: this.processNode(node.right),
        };

      case Nodes.NodeTypes.UnaryExpression:
        return {
          ...node,
          argument: this.processNode(node.argument),
        };

      case Nodes.NodeTypes.ConditionalExpression:
        return {
          ...node,
          test: this.processNode(node.test),
          consequent: this.processNode(node.consequent),
          alternate: this.processNode(node.alternate),
        };

      case Nodes.NodeTypes.AssignmentExpression:
        return {
          ...node,
          left: this.processNode(node.left),
          right: this.processNode(node.right),
        };

      case Nodes.NodeTypes.ArrayExpression:
        return {
          ...node,
          elements: node.elements.map(el => this.processNode(el)),
        };

      case Nodes.NodeTypes.ObjectExpression:
        return {
          ...node,
          properties: node.properties.map(prop => ({
            key: prop.key,
            value: this.processNode(prop.value),
          })),
        };

      case Nodes.NodeTypes.IfStatement:
        return {
          ...node,
          test: this.processNode(node.test),
          consequent: this.processNode(node.consequent),
          alternate: node.alternate ? this.processNode(node.alternate) : null,
        };

      case Nodes.NodeTypes.WhileStatement:
        return {
          ...node,
          test: this.processNode(node.test),
          body: this.processNode(node.body),
        };

      case Nodes.NodeTypes.ForStatement:
        this.pushScope();
        const forResult = {
          ...node,
          init: node.init ? this.processNode(node.init) : null,
          test: node.test ? this.processNode(node.test) : null,
          update: node.update ? this.processNode(node.update) : null,
          body: this.processNode(node.body),
        };
        this.popScope();
        return forResult;

      case Nodes.NodeTypes.ReturnStatement:
        return {
          ...node,
          argument: node.argument ? this.processNode(node.argument) : null,
        };

      case Nodes.NodeTypes.ThrowStatement:
        return {
          ...node,
          argument: this.processNode(node.argument),
        };

      case Nodes.NodeTypes.TryStatement:
        return {
          ...node,
          block: this.processNode(node.block),
          handler: node.handler ? {
            param: this.registerParameter(node.handler.param),
            body: this.processNode(node.handler.body),
          } : null,
          finalizer: node.finalizer ? this.processNode(node.finalizer) : null,
        };

      default:
        return this.transformer.transformNode(node);
    }
  }

  registerVariable(idNode) {
    if (idNode.type !== Nodes.NodeTypes.Identifier) return idNode;
    
    const originalName = idNode.name;
    if (this.excludedNames.has(originalName)) return idNode;

    const mangledName = this.getOrCreateMangledName(originalName);
    return Nodes.createIdentifier(mangledName);
  }

  registerParameter(paramNode) {
    if (paramNode.type !== Nodes.NodeTypes.Identifier) return paramNode;
    
    const originalName = paramNode.name;
    if (this.excludedNames.has(originalName)) return paramNode;

    const mangledName = this.getOrCreateMangledName(originalName);
    return Nodes.createIdentifier(mangledName);
  }

  mangleName(idNode) {
    if (idNode.type !== Nodes.NodeTypes.Identifier) return idNode;
    return this.registerVariable(idNode);
  }

  lookupOrCreateName(idNode) {
    const originalName = idNode.name;
    
    // Check if this is a built-in or excluded name
    if (this.excludedNames.has(originalName)) {
      return idNode;
    }

    // Check if we've already mangled this name
    if (this.nameMap.has(originalName)) {
      return Nodes.createIdentifier(this.nameMap.get(originalName));
    }

    // If not found in current scope, check parent scopes
    for (let i = this.scopeStack.length - 1; i >= 0; i--) {
      if (this.scopeStack[i].has(originalName)) {
        return Nodes.createIdentifier(this.scopeStack[i].get(originalName));
      }
    }

    // Not found, return as-is (global)
    return idNode;
  }

  getOrCreateMangledName(originalName) {
    if (this.nameMap.has(originalName)) {
      return this.nameMap.get(originalName);
    }

    const mangledName = `_${generateRandomId(8)}`;
    this.nameMap.set(originalName, mangledName);
    
    // Also register in current scope
    const currentScope = this.scopeStack[this.scopeStack.length - 1];
    currentScope.set(originalName, mangledName);

    return mangledName;
  }

  pushScope() {
    this.scopeStack.push(new Map());
  }

  popScope() {
    this.scopeStack.pop();
  }
}
