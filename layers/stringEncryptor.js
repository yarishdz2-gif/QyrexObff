// String Encryption Layer - Prometheus technique
import * as Nodes from '../ast/nodes.js';
import { generateRandomId, xorEncrypt, base64Encode } from '../utils/helpers.js';

export class StringEncryptor {
  constructor(transformer) {
    this.transformer = transformer;
    this.stringMap = new Map();
    this.stringArray = [];
    this.arrayName = `_${generateRandomId(8)}`;
    this.decryptorName = `_${generateRandomId(8)}`;
  }

  transform(ast) {
    // First pass: collect and encrypt all strings
    this.walkNode(ast);

    // If no strings found, return as-is
    if (this.stringArray.length === 0) {
      return ast;
    }

    // Second pass: replace strings with array lookups
    const modified = this.replaceStrings(ast);

    // Inject string array and decryptor at the beginning
    return this.injectStringArray(modified);
  }

  walkNode(node) {
    if (!node) return;

    if (node.type === Nodes.NodeTypes.StringLiteral) {
      this.registerString(node.value);
    } else if (typeof node === 'object') {
      for (const key in node) {
        if (Array.isArray(node[key])) {
          node[key].forEach(child => this.walkNode(child));
        } else {
          this.walkNode(node[key]);
        }
      }
    }
  }

  registerString(value) {
    if (this.stringMap.has(value)) return;
    
    // Encrypt with XOR + Base64
    const encrypted = base64Encode(xorEncrypt(value, 0x42));
    this.stringArray.push(encrypted);
    this.stringMap.set(value, this.stringArray.length - 1);
  }

  replaceStrings(node) {
    if (!node) return node;

    if (node.type === Nodes.NodeTypes.StringLiteral) {
      const index = this.stringMap.get(node.value);
      if (index !== undefined) {
        // Replace with: _K[index]
        return Nodes.createMemberExpression(
          Nodes.createIdentifier(this.arrayName),
          Nodes.createNumericLiteral(index),
          true
        );
      }
    }

    // Recursively replace in all child nodes
    if (typeof node === 'object') {
      for (const key in node) {
        if (Array.isArray(node[key])) {
          node[key] = node[key].map(child => this.replaceStrings(child));
        } else if (typeof node[key] === 'object') {
          node[key] = this.replaceStrings(node[key]);
        }
      }
    }

    return node;
  }

  injectStringArray(ast) {
    // Create the encrypted string array
    const arrayElements = this.stringArray.map(encrypted => 
      Nodes.createStringLiteral(encrypted)
    );

    // Create the string array initialization: var _K = ['encrypted1', 'encrypted2', ...]
    const arrayInit = Nodes.createVariableDeclaration([
      {
        id: Nodes.createIdentifier(this.arrayName),
        init: Nodes.createArrayExpression(arrayElements),
      }
    ], 'var');

    // Create the decryptor function
    const decryptorFunc = this.createDecryptorFunction();

    // Inject at the beginning of the program
    if (ast.type === Nodes.NodeTypes.Program) {
      ast.body.unshift(arrayInit, decryptorFunc);
    }

    return ast;
  }

  createDecryptorFunction() {
    // Create: var _decrypt = function(i) { var s = _K[i]; ... return xor(s); }
    return Nodes.createVariableDeclaration([
      {
        id: Nodes.createIdentifier(this.decryptorName),
        init: {
          type: Nodes.NodeTypes.FunctionDeclaration,
          id: null,
          params: [Nodes.createIdentifier('i')],
          body: Nodes.createBlockStatement([
            Nodes.createExpressionStatement(
              Nodes.createFunctionCall(
                Nodes.createIdentifier('atob'),
                [Nodes.createMemberExpression(
                  Nodes.createIdentifier(this.arrayName),
                  Nodes.createIdentifier('i'),
                  true
                )]
              )
            ),
          ]),
        },
      }
    ], 'var');
  }
}
