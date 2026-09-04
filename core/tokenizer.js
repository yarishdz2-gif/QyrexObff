// Tokenizer - Lexical analysis phase
export const TokenTypes = {
  Keyword: 'Keyword',
  Identifier: 'Identifier',
  String: 'String',
  Number: 'Number',
  Operator: 'Operator',
  Punctuation: 'Punctuation',
  Whitespace: 'Whitespace',
  Comment: 'Comment',
  LineComment: 'LineComment',
  Regex: 'Regex',
  Template: 'Template',
  EOF: 'EOF',
};

const KEYWORDS = new Set([
  'abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class',
  'const', 'continue', 'debugger', 'default', 'delete', 'do', 'double', 'else', 'enum', 'eval',
  'export', 'extends', 'false', 'final', 'finally', 'float', 'for', 'function', 'goto', 'if',
  'implements', 'import', 'in', 'instanceof', 'int', 'interface', 'let', 'long', 'native', 'new',
  'null', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'super',
  'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'true', 'try', 'typeof',
  'var', 'void', 'volatile', 'while', 'with', 'yield', 'async', 'of',
]);

const OPERATORS = /^(===|!==|>>>=|>>>|>>=|<<=|==|!=|<=|>=|&&|\|\||>>|<<|\+\+|--|->|=>|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|\.\.\.|[+\-*/%&|^!~<>=.?:,])/;

export class Tokenizer {
  constructor(source) {
    this.source = source;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
  }

  tokenize() {
    while (this.position < this.source.length) {
      this.skipWhitespaceAndComments();
      if (this.position >= this.source.length) break;

      const char = this.source[this.position];

      if (this.isStringDelimiter(char)) {
        this.tokens.push(this.readString());
      } else if (this.isRegexStart()) {
        this.tokens.push(this.readRegex());
      } else if (this.isTemplateLiteral()) {
        this.tokens.push(this.readTemplate());
      } else if (/\d/.test(char)) {
        this.tokens.push(this.readNumber());
      } else if (this.isIdentifierStart(char)) {
        this.tokens.push(this.readIdentifier());
      } else if (OPERATORS.test(this.source.slice(this.position))) {
        this.tokens.push(this.readOperator());
      } else if (/[{}()\[\];,.]/.test(char)) {
        this.tokens.push(this.readPunctuation());
      } else {
        this.advance();
      }
    }

    this.tokens.push({
      type: TokenTypes.EOF,
      value: null,
      line: this.line,
      column: this.column,
    });

    return this.tokens;
  }

  isStringDelimiter(char) {
    return char === '"' || char === "'" || char === '`';
  }

  isRegexStart() {
    if (this.source[this.position] !== '/') return false;
    const lastToken = this.tokens[this.tokens.length - 1];
    if (!lastToken) return false;
    return [
      TokenTypes.Operator, TokenTypes.Punctuation, TokenTypes.Keyword,
      TokenTypes.LineComment, TokenTypes.Comment
    ].includes(lastToken.type) || ['=', '(', ',', ':', ';', '!', '&', '|', '?', '+', '-', '*', '%', '^', '~', 'return'].includes(lastToken.value);
  }

  isTemplateLiteral() {
    return this.source[this.position] === '`';
  }

  isIdentifierStart(char) {
    return /[a-zA-Z_$]/.test(char);
  }

  skipWhitespaceAndComments() {
    while (this.position < this.source.length) {
      const char = this.source[this.position];
      const next = this.source[this.position + 1];

      if (/\s/.test(char)) {
        if (char === '\n') {
          this.line++;
          this.column = 0;
        }
        this.advance();
      } else if (char === '/' && next === '/') {
        this.position += 2;
        while (this.position < this.source.length && this.source[this.position] !== '\n') {
          this.advance();
        }
      } else if (char === '/' && next === '*') {
        this.position += 2;
        while (this.position < this.source.length - 1) {
          if (this.source[this.position] === '*' && this.source[this.position + 1] === '/') {
            this.position += 2;
            break;
          }
          if (this.source[this.position] === '\n') {
            this.line++;
            this.column = 0;
          }
          this.advance();
        }
      } else {
        break;
      }
    }
  }

  readString() {
    const quote = this.source[this.position];
    const start = this.position;
    this.advance();

    let value = '';
    while (this.position < this.source.length && this.source[this.position] !== quote) {
      if (this.source[this.position] === '\\') {
        value += this.source[this.position];
        this.advance();
        if (this.position < this.source.length) {
          value += this.source[this.position];
          this.advance();
        }
      } else {
        value += this.source[this.position];
        this.advance();
      }
    }

    if (this.source[this.position] === quote) {
      this.advance();
    }

    return {
      type: TokenTypes.String,
      value: JSON.parse(quote + value + quote),
      raw: this.source.slice(start, this.position),
      line: this.line,
      column: this.column,
    };
  }

  readTemplate() {
    const start = this.position;
    this.advance();

    let value = '';
    const expressions = [];

    while (this.position < this.source.length && this.source[this.position] !== '`') {
      if (this.source[this.position] === '\\') {
        value += this.source[this.position];
        this.advance();
        if (this.position < this.source.length) {
          value += this.source[this.position];
          this.advance();
        }
      } else if (this.source[this.position] === '$' && this.source[this.position + 1] === '{') {
        value += this.source[this.position];
        this.advance();
        value += this.source[this.position];
        this.advance();

        let braceCount = 1;
        let expr = '';
        while (braceCount > 0 && this.position < this.source.length) {
          if (this.source[this.position] === '{') braceCount++;
          if (this.source[this.position] === '}') braceCount--;
          expr += this.source[this.position];
          this.advance();
        }
        expressions.push(expr);
        value += expr;
      } else {
        value += this.source[this.position];
        this.advance();
      }
    }

    if (this.source[this.position] === '`') {
      this.advance();
    }

    return {
      type: TokenTypes.Template,
      value,
      expressions,
      raw: this.source.slice(start, this.position),
      line: this.line,
      column: this.column,
    };
  }

  readNumber() {
    const start = this.position;

    while (this.position < this.source.length && /[\d.exEX]/.test(this.source[this.position])) {
      this.advance();
    }

    const raw = this.source.slice(start, this.position);
    return {
      type: TokenTypes.Number,
      value: parseFloat(raw),
      raw,
      line: this.line,
      column: this.column,
    };
  }

  readIdentifier() {
    const start = this.position;

    while (this.position < this.source.length && /[a-zA-Z0-9_$]/.test(this.source[this.position])) {
      this.advance();
    }

    const value = this.source.slice(start, this.position);
    const type = KEYWORDS.has(value) ? TokenTypes.Keyword : TokenTypes.Identifier;

    return {
      type,
      value,
      line: this.line,
      column: this.column,
    };
  }

  readOperator() {
    const match = this.source.slice(this.position).match(OPERATORS);
    const operator = match[0];

    for (let i = 0; i < operator.length; i++) {
      this.advance();
    }

    return {
      type: TokenTypes.Operator,
      value: operator,
      line: this.line,
      column: this.column,
    };
  }

  readPunctuation() {
    const char = this.source[this.position];
    this.advance();

    return {
      type: TokenTypes.Punctuation,
      value: char,
      line: this.line,
      column: this.column,
    };
  }

  readRegex() {
    const start = this.position;
    this.advance();

    let value = '';
    let escaped = false;

    while (this.position < this.source.length) {
      const char = this.source[this.position];

      if (escaped) {
        value += char;
        escaped = false;
      } else if (char === '\\') {
        value += char;
        escaped = true;
      } else if (char === '/') {
        this.advance();
        break;
      } else if (char === '\n') {
        break;
      } else {
        value += char;
      }

      this.advance();
    }

    let flags = '';
    while (this.position < this.source.length && /[gimsuvy]/.test(this.source[this.position])) {
      flags += this.source[this.position];
      this.advance();
    }

    return {
      type: TokenTypes.Regex,
      value,
      flags,
      raw: this.source.slice(start, this.position),
      line: this.line,
      column: this.column,
    };
  }

  advance() {
    if (this.source[this.position] === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    this.position++;
  }
}

export function tokenize(source) {
  const tokenizer = new Tokenizer(source);
  return tokenizer.tokenize();
}
