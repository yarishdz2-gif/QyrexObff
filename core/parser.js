// Parser - Syntax analysis phase
import { TokenTypes } from './tokenizer.js';
import * as Nodes from '../ast/nodes.js';

export class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.position = 0;
  }

  parse() {
    const statements = [];
    while (!this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
    }
    return Nodes.createProgram(statements);
  }

  parseStatement() {
    const token = this.peek();
    if (!token || token.type === TokenTypes.EOF) return null;

    switch (token.value) {
      case 'var':
      case 'let':
      case 'const':
        return this.parseVariableDeclaration();
      case 'function':
        return this.parseFunctionDeclaration();
      case 'if':
        return this.parseIfStatement();
      case 'while':
        return this.parseWhileStatement();
      case 'for':
        return this.parseForStatement();
      case 'return':
        return this.parseReturnStatement();
      case 'throw':
        return this.parseThrowStatement();
      case 'try':
        return this.parseTryStatement();
      case '{':
        return this.parseBlockStatement();
      case 'break':
        this.advance();
        this.consumePunctuation(';');
        return { type: Nodes.NodeTypes.BreakStatement };
      case 'continue':
        this.advance();
        this.consumePunctuation(';');
        return { type: Nodes.NodeTypes.ContinueStatement };
      default:
        return this.parseExpressionStatement();
    }
  }

  parseVariableDeclaration() {
    const kind = this.advance().value;
    const declarations = [];

    do {
      const name = this.advance().value;
      let init = null;

      if (this.peek() && this.peek().value === '=') {
        this.advance();
        init = this.parseExpression();
      }

      declarations.push({
        id: Nodes.createIdentifier(name),
        init,
      });

      if (this.peek() && this.peek().value !== ',') break;
      if (this.peek() && this.peek().value === ',') this.advance();
    } while (this.peek() && this.peek().value !== ';');

    this.consumePunctuation(';');
    return Nodes.createVariableDeclaration(declarations, kind);
  }

  parseFunctionDeclaration() {
    this.advance(); // consume 'function'
    const id = Nodes.createIdentifier(this.advance().value);

    this.consumePunctuation('(');
    const params = [];
    if (this.peek() && this.peek().value !== ')') {
      do {
        params.push(Nodes.createIdentifier(this.advance().value));
        if (this.peek() && this.peek().value !== ',') break;
        if (this.peek() && this.peek().value === ',') this.advance();
      } while (true);
    }
    this.consumePunctuation(')');

    const body = this.parseBlockStatement();
    return Nodes.createFunctionDeclaration(id, params, body);
  }

  parseBlockStatement() {
    this.consumePunctuation('{');
    const statements = [];

    while (this.peek() && this.peek().value !== '}') {
      const stmt = this.parseStatement();
      if (stmt) statements.push(stmt);
    }

    this.consumePunctuation('}');
    return Nodes.createBlockStatement(statements);
  }

  parseIfStatement() {
    this.advance(); // consume 'if'
    this.consumePunctuation('(');
    const test = this.parseExpression();
    this.consumePunctuation(')');

    const consequent = this.parseStatement();
    let alternate = null;

    if (this.peek() && this.peek().value === 'else') {
      this.advance();
      alternate = this.parseStatement();
    }

    return Nodes.createIfStatement(test, consequent, alternate);
  }

  parseWhileStatement() {
    this.advance(); // consume 'while'
    this.consumePunctuation('(');
    const test = this.parseExpression();
    this.consumePunctuation(')');

    const body = this.parseStatement();
    return Nodes.createWhileStatement(test, body);
  }

  parseForStatement() {
    this.advance(); // consume 'for'
    this.consumePunctuation('(');

    let init = null;
    if (this.peek() && this.peek().value !== ';') {
      if (['var', 'let', 'const'].includes(this.peek().value)) {
        init = this.parseVariableDeclaration();
      } else {
        init = this.parseExpression();
        this.consumePunctuation(';');
      }
    } else {
      this.consumePunctuation(';');
    }

    let test = null;
    if (this.peek() && this.peek().value !== ';') {
      test = this.parseExpression();
    }
    this.consumePunctuation(';');

    let update = null;
    if (this.peek() && this.peek().value !== ')') {
      update = this.parseExpression();
    }
    this.consumePunctuation(')');

    const body = this.parseStatement();
    return Nodes.createForStatement(init, test, update, body);
  }

  parseReturnStatement() {
    this.advance(); // consume 'return'
    let argument = null;

    if (this.peek() && this.peek().value !== ';') {
      argument = this.parseExpression();
    }

    this.consumePunctuation(';');
    return Nodes.createReturnStatement(argument);
  }

  parseThrowStatement() {
    this.advance(); // consume 'throw'
    const argument = this.parseExpression();
    this.consumePunctuation(';');
    return Nodes.createThrowStatement(argument);
  }

  parseTryStatement() {
    this.advance(); // consume 'try'
    const block = this.parseBlockStatement();

    let handler = null;
    if (this.peek() && this.peek().value === 'catch') {
      this.advance();
      this.consumePunctuation('(');
      const param = this.advance().value;
      this.consumePunctuation(')');
      const body = this.parseBlockStatement();
      handler = Nodes.createCatchClause(Nodes.createIdentifier(param), body);
    }

    let finalizer = null;
    if (this.peek() && this.peek().value === 'finally') {
      this.advance();
      finalizer = this.parseBlockStatement();
    }

    return Nodes.createTryStatement(block, handler, finalizer);
  }

  parseExpressionStatement() {
    const expression = this.parseExpression();
    this.consumePunctuation(';');
    return Nodes.createExpressionStatement(expression);
  }

  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    let expr = this.parseConditional();

    if (this.peek() && ['=', '+=', '-=', '*=', '/=', '%='].includes(this.peek().value)) {
      const operator = this.advance().value;
      const right = this.parseAssignment();
      expr = Nodes.createAssignmentExpression(operator, expr, right);
    }

    return expr;
  }

  parseConditional() {
    let expr = this.parseLogicalOr();

    if (this.peek() && this.peek().value === '?') {
      this.advance();
      const consequent = this.parseExpression();
      this.consumePunctuation(':');
      const alternate = this.parseConditional();
      expr = Nodes.createConditionalExpression(expr, consequent, alternate);
    }

    return expr;
  }

  parseLogicalOr() {
    let expr = this.parseLogicalAnd();

    while (this.peek() && this.peek().value === '||') {
      const operator = this.advance().value;
      const right = this.parseLogicalAnd();
      expr = Nodes.createLogicalExpression(operator, expr, right);
    }

    return expr;
  }

  parseLogicalAnd() {
    let expr = this.parseBitwiseOr();

    while (this.peek() && this.peek().value === '&&') {
      const operator = this.advance().value;
      const right = this.parseBitwiseOr();
      expr = Nodes.createLogicalExpression(operator, expr, right);
    }

    return expr;
  }

  parseBitwiseOr() {
    let expr = this.parseBitwiseXor();

    while (this.peek() && this.peek().value === '|' && this.peek(1)?.value !== '|') {
      const operator = this.advance().value;
      const right = this.parseBitwiseXor();
      expr = Nodes.createBinaryExpression(operator, expr, right);
    }

    return expr;
  }

  parseBitwiseXor() {
    let expr = this.parseBitwiseAnd();

    while (this.peek() && this.peek().value === '^') {
      const operator = this.advance().value;
      const right = this.parseBitwiseAnd();
      expr = Nodes.createBinaryExpression(operator, expr, right);
    }

    return expr;
  }

  parseBitwiseAnd() {
    let expr = this.parseEquality();

    while (this.peek() && this.peek().value === '&' && this.peek(1)?.value !== '&') {
      const operator = this.advance().value;
      const right = this.parseEquality();
      expr = Nodes.createBinaryExpression(operator, expr, right);
    }

    return expr;
  }

  parseEquality() {
    let expr = this.parseRelational();

    while (this.peek() && ['==', '!=', '===', '!=='].includes(this.peek().value)) {
      const operator = this.advance().value;
      const right = this.parseRelational();
      expr = Nodes.createBinaryExpression(operator, expr, right);
    }

    return expr;
  }

  parseRelational() {
    let expr = this.parseShift();

    while (this.peek() && ['<', '>', '<=', '>=', 'instanceof', 'in'].includes(this.peek().value)) {
      const operator = this.advance().value;
      const right = this.parseShift();
      expr = Nodes.createBinaryExpression(operator, expr, right);
    }

    return expr;
  }

  parseShift() {
    let expr = this.parseAdditive();

    while (this.peek() && ['<<', '>>', '>>>'].includes(this.peek().value)) {
      const operator = this.advance().value;
      const right = this.parseAdditive();
      expr = Nodes.createBinaryExpression(operator, expr, right);
    }

    return expr;
  }

  parseAdditive() {
    let expr = this.parseMultiplicative();

    while (this.peek() && ['+', '-'].includes(this.peek().value)) {
      const operator = this.advance().value;
      const right = this.parseMultiplicative();
      expr = Nodes.createBinaryExpression(operator, expr, right);
    }

    return expr;
  }

  parseMultiplicative() {
    let expr = this.parseUnary();

    while (this.peek() && ['*', '/', '%'].includes(this.peek().value)) {
      const operator = this.advance().value;
      const right = this.parseUnary();
      expr = Nodes.createBinaryExpression(operator, expr, right);
    }

    return expr;
  }

  parseUnary() {
    if (this.peek() && ['!', '~', '-', '+', 'typeof', 'void', 'delete'].includes(this.peek().value)) {
      const operator = this.advance().value;
      const argument = this.parseUnary();
      return {
        type: Nodes.NodeTypes.UnaryExpression,
        operator,
        argument,
      };
    }

    return this.parsePostfix();
  }

  parsePostfix() {
    let expr = this.parsePrimary();

    while (true) {
      if (this.peek() && this.peek().value === '[') {
        this.advance();
        const property = this.parseExpression();
        this.consumePunctuation(']');
        expr = Nodes.createMemberExpression(expr, property, true);
      } else if (this.peek() && this.peek().value === '.') {
        this.advance();
        const property = Nodes.createIdentifier(this.advance().value);
        expr = Nodes.createMemberExpression(expr, property, false);
      } else if (this.peek() && this.peek().value === '(') {
        this.advance();
        const args = [];
        if (this.peek() && this.peek().value !== ')') {
          do {
            args.push(this.parseExpression());
            if (this.peek() && this.peek().value !== ',') break;
            if (this.peek() && this.peek().value === ',') this.advance();
          } while (true);
        }
        this.consumePunctuation(')');
        expr = Nodes.createFunctionCall(expr, args);
      } else {
        break;
      }
    }

    return expr;
  }

  parsePrimary() {
    const token = this.peek();

    if (!token) return null;

    if (token.type === TokenTypes.String) {
      this.advance();
      return Nodes.createStringLiteral(token.value);
    }

    if (token.type === TokenTypes.Number) {
      this.advance();
      return Nodes.createNumericLiteral(token.value);
    }

    if (token.value === 'true') {
      this.advance();
      return { type: Nodes.NodeTypes.BooleanLiteral, value: true };
    }

    if (token.value === 'false') {
      this.advance();
      return { type: Nodes.NodeTypes.BooleanLiteral, value: false };
    }

    if (token.value === 'null') {
      this.advance();
      return { type: Nodes.NodeTypes.Identifier, name: 'null' };
    }

    if (token.value === 'undefined') {
      this.advance();
      return { type: Nodes.NodeTypes.Identifier, name: 'undefined' };
    }

    if (token.type === TokenTypes.Identifier) {
      this.advance();
      return Nodes.createIdentifier(token.value);
    }

    if (token.value === '(') {
      this.advance();
      const expr = this.parseExpression();
      this.consumePunctuation(')');
      return expr;
    }

    if (token.value === '[') {
      this.advance();
      const elements = [];
      if (this.peek() && this.peek().value !== ']') {
        do {
          elements.push(this.parseExpression());
          if (this.peek() && this.peek().value !== ',') break;
          if (this.peek() && this.peek().value === ',') this.advance();
        } while (true);
      }
      this.consumePunctuation(']');
      return Nodes.createArrayExpression(elements);
    }

    if (token.value === '{') {
      this.advance();
      const properties = [];
      if (this.peek() && this.peek().value !== '}') {
        do {
          const key = this.advance().value;
          this.consumePunctuation(':');
          const value = this.parseExpression();
          properties.push({ key: Nodes.createIdentifier(key), value });
          if (this.peek() && this.peek().value !== ',') break;
          if (this.peek() && this.peek().value === ',') this.advance();
        } while (true);
      }
      this.consumePunctuation('}');
      return Nodes.createObjectExpression(properties);
    }

    if (token.value === 'function') {
      this.advance();
      const id = this.peek().type === TokenTypes.Identifier ? Nodes.createIdentifier(this.advance().value) : null;
      this.consumePunctuation('(');
      const params = [];
      if (this.peek() && this.peek().value !== ')') {
        do {
          params.push(Nodes.createIdentifier(this.advance().value));
          if (this.peek() && this.peek().value !== ',') break;
          if (this.peek() && this.peek().value === ',') this.advance();
        } while (true);
      }
      this.consumePunctuation(')');
      const body = this.parseBlockStatement();
      return { type: Nodes.NodeTypes.FunctionDeclaration, id, params, body };
    }

    this.advance();
    return null;
  }

  peek(offset = 0) {
    return this.tokens[this.position + offset];
  }

  advance() {
    return this.tokens[this.position++];
  }

  consumePunctuation(char) {
    const token = this.peek();
    if (token && token.value === char) {
      this.advance();
      return token;
    }
    throw new Error(`Expected '${char}' but got '${token?.value}'`);
  }

  isAtEnd() {
    const token = this.peek();
    return !token || token.type === TokenTypes.EOF;
  }
}

export function parse(tokens) {
  const parser = new Parser(tokens);
  return parser.parse();
}
