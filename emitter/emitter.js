// Emitter - Code generation from transformed AST
import * as Nodes from '../ast/nodes.js';

export class Emitter {
  constructor(indentSize = 2) {
    this.indent = 0;
    this.indentSize = indentSize;
    this.output = '';
  }

  emit(ast) {
    this.output = '';
    this.indent = 0;
    this.emitNode(ast);
    return this.output;
  }

  emitNode(node) {
    if (!node) return;

    switch (node.type) {
      case Nodes.NodeTypes.Program:
        this.emitProgram(node);
        break;
      case Nodes.NodeTypes.BlockStatement:
        this.emitBlockStatement(node);
        break;
      case Nodes.NodeTypes.ExpressionStatement:
        this.emitExpressionStatement(node);
        break;
      case Nodes.NodeTypes.VariableDeclaration:
        this.emitVariableDeclaration(node);
        break;
      case Nodes.NodeTypes.FunctionDeclaration:
        this.emitFunctionDeclaration(node);
        break;
      case Nodes.NodeTypes.ReturnStatement:
        this.emitReturnStatement(node);
        break;
      case Nodes.NodeTypes.IfStatement:
        this.emitIfStatement(node);
        break;
      case Nodes.NodeTypes.WhileStatement:
        this.emitWhileStatement(node);
        break;
      case Nodes.NodeTypes.ForStatement:
        this.emitForStatement(node);
        break;
      case Nodes.NodeTypes.ThrowStatement:
        this.emitThrowStatement(node);
        break;
      case Nodes.NodeTypes.TryStatement:
        this.emitTryStatement(node);
        break;
      case Nodes.NodeTypes.BreakStatement:
        this.write('break;');
        this.newline();
        break;
      case Nodes.NodeTypes.ContinueStatement:
        this.write('continue;');
        this.newline();
        break;
      default:
        this.emitExpression(node);
    }
  }

  emitProgram(node) {
    for (const stmt of node.body) {
      this.emitNode(stmt);
    }
  }

  emitBlockStatement(node) {
    this.write('{');
    this.newline();
    this.indent++;
    for (const stmt of node.body) {
      this.emitNode(stmt);
    }
    this.indent--;
    this.writeIndent();
    this.write('}');
    this.newline();
  }

  emitExpressionStatement(node) {
    this.writeIndent();
    this.emitExpression(node.expression);
    this.write(';');
    this.newline();
  }

  emitVariableDeclaration(node) {
    this.writeIndent();
    this.write(node.kind);
    this.write(' ');
    for (let i = 0; i < node.declarations.length; i++) {
      const decl = node.declarations[i];
      this.emitExpression(decl.id);
      if (decl.init) {
        this.write(' = ');
        this.emitExpression(decl.init);
      }
      if (i < node.declarations.length - 1) {
        this.write(', ');
      }
    }
    this.write(';');
    this.newline();
  }

  emitFunctionDeclaration(node) {
    this.writeIndent();
    this.write('function ');
    if (node.id) {
      this.emitExpression(node.id);
    }
    this.write('(');
    for (let i = 0; i < node.params.length; i++) {
      this.emitExpression(node.params[i]);
      if (i < node.params.length - 1) {
        this.write(', ');
      }
    }
    this.write(') ');
    this.emitNode(node.body);
  }

  emitReturnStatement(node) {
    this.writeIndent();
    this.write('return');
    if (node.argument) {
      this.write(' ');
      this.emitExpression(node.argument);
    }
    this.write(';');
    this.newline();
  }

  emitIfStatement(node) {
    this.writeIndent();
    this.write('if (');
    this.emitExpression(node.test);
    this.write(') ');
    if (node.consequent.type === Nodes.NodeTypes.BlockStatement) {
      this.emitNode(node.consequent);
    } else {
      this.newline();
      this.indent++;
      this.emitNode(node.consequent);
      this.indent--;
    }
    if (node.alternate) {
      this.writeIndent();
      this.write('else ');
      if (node.alternate.type === Nodes.NodeTypes.BlockStatement) {
        this.emitNode(node.alternate);
      } else if (node.alternate.type === Nodes.NodeTypes.IfStatement) {
        this.emitIfStatement(node.alternate);
      } else {
        this.newline();
        this.indent++;
        this.emitNode(node.alternate);
        this.indent--;
      }
    }
  }

  emitWhileStatement(node) {
    this.writeIndent();
    this.write('while (');
    this.emitExpression(node.test);
    this.write(') ');
    if (node.body.type === Nodes.NodeTypes.BlockStatement) {
      this.emitNode(node.body);
    } else {
      this.newline();
      this.indent++;
      this.emitNode(node.body);
      this.indent--;
    }
  }

  emitForStatement(node) {
    this.writeIndent();
    this.write('for (');
    if (node.init) {
      if (node.init.type === Nodes.NodeTypes.VariableDeclaration) {
        this.write(node.init.kind);
        this.write(' ');
        for (let i = 0; i < node.init.declarations.length; i++) {
          const decl = node.init.declarations[i];
          this.emitExpression(decl.id);
          if (decl.init) {
            this.write(' = ');
            this.emitExpression(decl.init);
          }
          if (i < node.init.declarations.length - 1) {
            this.write(', ');
          }
        }
      } else {
        this.emitExpression(node.init);
      }
    }
    this.write('; ');
    if (node.test) {
      this.emitExpression(node.test);
    }
    this.write('; ');
    if (node.update) {
      this.emitExpression(node.update);
    }
    this.write(') ');
    if (node.body.type === Nodes.NodeTypes.BlockStatement) {
      this.emitNode(node.body);
    } else {
      this.newline();
      this.indent++;
      this.emitNode(node.body);
      this.indent--;
    }
  }

  emitThrowStatement(node) {
    this.writeIndent();
    this.write('throw ');
    this.emitExpression(node.argument);
    this.write(';');
    this.newline();
  }

  emitTryStatement(node) {
    this.writeIndent();
    this.write('try ');
    this.emitNode(node.block);
    if (node.handler) {
      this.writeIndent();
      this.write('catch (');
      this.emitExpression(node.handler.param);
      this.write(') ');
      this.emitNode(node.handler.body);
    }
    if (node.finalizer) {
      this.writeIndent();
      this.write('finally ');
      this.emitNode(node.finalizer);
    }
  }

  emitExpression(node) {
    if (!node) return;

    switch (node.type) {
      case Nodes.NodeTypes.Identifier:
        this.write(node.name);
        break;
      case Nodes.NodeTypes.StringLiteral:
        this.write(JSON.stringify(node.value));
        break;
      case Nodes.NodeTypes.NumericLiteral:
        this.write(String(node.value));
        break;
      case Nodes.NodeTypes.BooleanLiteral:
        this.write(node.value ? 'true' : 'false');
        break;
      case Nodes.NodeTypes.ArrayExpression:
        this.write('[');
        for (let i = 0; i < node.elements.length; i++) {
          this.emitExpression(node.elements[i]);
          if (i < node.elements.length - 1) {
            this.write(', ');
          }
        }
        this.write(']');
        break;
      case Nodes.NodeTypes.ObjectExpression:
        this.write('{');
        for (let i = 0; i < node.properties.length; i++) {
          const prop = node.properties[i];
          this.emitExpression(prop.key);
          this.write(': ');
          this.emitExpression(prop.value);
          if (i < node.properties.length - 1) {
            this.write(', ');
          }
        }
        this.write('}');
        break;
      case Nodes.NodeTypes.MemberExpression:
        this.emitExpression(node.object);
        if (node.computed) {
          this.write('[');
          this.emitExpression(node.property);
          this.write(']');
        } else {
          this.write('.');
          this.emitExpression(node.property);
        }
        break;
      case Nodes.NodeTypes.FunctionCall:
        this.emitExpression(node.callee);
        this.write('(');
        for (let i = 0; i < node.arguments.length; i++) {
          this.emitExpression(node.arguments[i]);
          if (i < node.arguments.length - 1) {
            this.write(', ');
          }
        }
        this.write(')');
        break;
      case Nodes.NodeTypes.BinaryExpression:
      case Nodes.NodeTypes.LogicalExpression:
        this.write('(');
        this.emitExpression(node.left);
        this.write(` ${node.operator} `);
        this.emitExpression(node.right);
        this.write(')');
        break;
      case Nodes.NodeTypes.UnaryExpression:
        this.write(node.operator);
        if (/[a-zA-Z_$]/.test(node.operator.slice(-1))) {
          this.write(' ');
        }
        this.emitExpression(node.argument);
        break;
      case Nodes.NodeTypes.ConditionalExpression:
        this.emitExpression(node.test);
        this.write(' ? ');
        this.emitExpression(node.consequent);
        this.write(' : ');
        this.emitExpression(node.alternate);
        break;
      case Nodes.NodeTypes.AssignmentExpression:
        this.emitExpression(node.left);
        this.write(` ${node.operator} `);
        this.emitExpression(node.right);
        break;
      case Nodes.NodeTypes.FunctionDeclaration:
        this.write('function');
        if (node.id) {
          this.write(' ');
          this.emitExpression(node.id);
        }
        this.write('(');
        for (let i = 0; i < node.params.length; i++) {
          this.emitExpression(node.params[i]);
          if (i < node.params.length - 1) {
            this.write(', ');
          }
        }
        this.write(') ');
        this.emitNode(node.body);
        break;
      default:
        this.emitNode(node);
    }
  }

  write(str) {
    this.output += str;
  }

  writeIndent() {
    this.write(' '.repeat(this.indent * this.indentSize));
  }

  newline() {
    this.write('\n');
  }
}

export function emit(ast) {
  const emitter = new Emitter(2);
  return emitter.emit(ast);
}
