// Anti-Sandbox Injector - Sandbox detection and evasion
import * as Nodes from '../ast/nodes.js';

export class AntiSandboxInjector {
  constructor(transformer) {
    this.transformer = transformer;
  }

  transform(ast) {
    // Inject detection logic at the beginning
    const detectionCode = this.generateDetectionCode();
    
    if (ast.type === Nodes.NodeTypes.Program) {
      ast.body.unshift(detectionCode);
    }

    return ast;
  }

  generateDetectionCode() {
    // Create an immediately invoked function that checks for sandboxes
    // and obfuscates the environment detection
    
    const checkCode = `
    (function() {
      var _i = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this;
      var _e = [
        'lune', 'lute', 'wally', 'rojo', 'selene', 'darklua', 'luau_lsp', 'remodel', 'tarmac',
        'stylua', 'lemur', 'busted', 'luaunit', 'telescope', 'plugin', 'fetch', 'console',
        'setTimeout', 'setInterval', 'Buffer', 'AbortController', 'AbortSignal', 'clearInterval',
        'clearTimeout', 'crypto', 'performance', 'Headers', 'Request', 'Response', 'TextDecoder',
        'TextEncoder', 'dofile', 'loadfile', 'atob', 'btoa', 'self', 'FormData', 'Blob', 'File',
        'URLSearchParams', 'Event', 'CustomEvent', 'structuredClone', '__dirname', '__filename',
        'alert', 'confirm', 'prompt', 'navigator', 'location', 'history', 'window', 'document',
        'XMLHttpRequest', 'WebSocket', 'EventTarget', 'MessageChannel', 'BroadcastChannel',
        'queueMicrotask', 'reportError', 'DOMException', 'requestAnimationFrame', 'cancelAnimationFrame',
        'matchMedia', 'postMessage', 'Worker', 'SharedWorker', 'ServiceWorker', 'IndexedDB',
        'localStorage', 'sessionStorage', 'caches', 'Cache', 'CacheStorage', 'globalThis',
        'URL', 'FileReader', 'FileList', 'FileSystem'
      ];
      
      var _d = false;
      for (var _j = 0; _j < _e.length; _j++) {
        if (_i[_e[_j]] !== undefined) {
          _d = true;
          break;
        }
      }
      
      // Alternative detection methods
      if (typeof _i.process !== 'undefined' && _i.process.env) { _d = true; }
      if (typeof _i.process !== 'undefined' && _i.process.platform) { _d = true; }
      
      // Obfuscate by storing detection result
      _i._obf_detect = _d;
      _i._obf_time = Date.now();
      _i._obf_entropy = Math.random();
    })();
    `;

    // Parse the check code and return as statements
    return Nodes.createExpressionStatement({
      type: Nodes.NodeTypes.FunctionCall,
      callee: {
        type: Nodes.NodeTypes.FunctionDeclaration,
        id: null,
        params: [],
        body: Nodes.createBlockStatement([
          Nodes.createExpressionStatement(Nodes.createStringLiteral(checkCode))
        ]),
      },
      arguments: [],
    });
  }

  // Alternative: More sophisticated detection obfuscation
  generateAdvancedDetection() {
    const detectionFunc = Nodes.createFunctionDeclaration(
      Nodes.createIdentifier('_detectSandbox'),
      [],
      Nodes.createBlockStatement([
        // Check for Node.js
        {
          type: Nodes.NodeTypes.VariableDeclaration,
          kind: 'var',
          declarations: [{
            id: Nodes.createIdentifier('_nodeCheck'),
            init: Nodes.createBinaryExpression(
              '!==',
              {
                type: Nodes.NodeTypes.UnaryExpression,
                operator: 'typeof',
                argument: Nodes.createIdentifier('require'),
              },
              Nodes.createStringLiteral('undefined')
            ),
          }],
        },
        // Check for browser APIs
        {
          type: Nodes.NodeTypes.VariableDeclaration,
          kind: 'var',
          declarations: [{
            id: Nodes.createIdentifier('_browserCheck'),
            init: Nodes.createBinaryExpression(
              '!==',
              {
                type: Nodes.NodeTypes.UnaryExpression,
                operator: 'typeof',
                argument: Nodes.createIdentifier('window'),
              },
              Nodes.createStringLiteral('undefined')
            ),
          }],
        },
        // Return detection result obfuscated
        Nodes.createReturnStatement(
          Nodes.createLogicalExpression(
            '||',
            Nodes.createIdentifier('_nodeCheck'),
            Nodes.createIdentifier('_browserCheck')
          )
        ),
      ])
    );

    return detectionFunc;
  }
}
