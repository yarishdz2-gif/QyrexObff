// AST Node Definitions - Unified structure for Prometheus + IronBrew fusion
export const NodeTypes = {
  Program: 'Program',
  VariableDeclaration: 'VariableDeclaration',
  FunctionDeclaration: 'FunctionDeclaration',
  FunctionCall: 'FunctionCall',
  BinaryExpression: 'BinaryExpression',
  UnaryExpression: 'UnaryExpression',
  LogicalExpression: 'LogicalExpression',
  StringLiteral: 'StringLiteral',
  NumericLiteral: 'NumericLiteral',
  BooleanLiteral: 'BooleanLiteral',
  Identifier: 'Identifier',
  MemberExpression: 'MemberExpression',
  ArrayExpression: 'ArrayExpression',
  ObjectExpression: 'ObjectExpression',
  IfStatement: 'IfStatement',
  WhileStatement: 'WhileStatement',
  ForStatement: 'ForStatement',
  ForInStatement: 'ForInStatement',
  BlockStatement: 'BlockStatement',
  ExpressionStatement: 'ExpressionStatement',
  ReturnStatement: 'ReturnStatement',
  BreakStatement: 'BreakStatement',
  ContinueStatement: 'ContinueStatement',
  TryStatement: 'TryStatement',
  ThrowStatement: 'ThrowStatement',
  ConditionalExpression: 'ConditionalExpression',
  AssignmentExpression: 'AssignmentExpression',
  SequenceExpression: 'SequenceExpression',
  NewExpression: 'NewExpression',
  UpdateExpression: 'UpdateExpression',
};

// Factory functions
export const createProgram = (body = []) => ({
  type: NodeTypes.Program,
  body,
});

export const createVariableDeclaration = (declarations, kind = 'var') => ({
  type: NodeTypes.VariableDeclaration,
  declarations,
  kind,
});

export const createFunctionDeclaration = (id, params, body, async = false, generator = false) => ({
  type: NodeTypes.FunctionDeclaration,
  id,
  params,
  body,
  async,
  generator,
});

export const createBlockStatement = (body = []) => ({
  type: NodeTypes.BlockStatement,
  body,
});

export const createExpressionStatement = (expression) => ({
  type: NodeTypes.ExpressionStatement,
  expression,
});

export const createFunctionCall = (callee, args = []) => ({
  type: NodeTypes.FunctionCall,
  callee,
  arguments: args,
});

export const createMemberExpression = (object, property, computed = false) => ({
  type: NodeTypes.MemberExpression,
  object,
  property,
  computed,
});

export const createIdentifier = (name) => ({
  type: NodeTypes.Identifier,
  name,
});

export const createStringLiteral = (value) => ({
  type: NodeTypes.StringLiteral,
  value,
  raw: JSON.stringify(value),
});

export const createNumericLiteral = (value) => ({
  type: NodeTypes.NumericLiteral,
  value,
  raw: String(value),
});

export const createBinaryExpression = (operator, left, right) => ({
  type: NodeTypes.BinaryExpression,
  operator,
  left,
  right,
});

export const createLogicalExpression = (operator, left, right) => ({
  type: NodeTypes.LogicalExpression,
  operator,
  left,
  right,
});

export const createConditionalExpression = (test, consequent, alternate) => ({
  type: NodeTypes.ConditionalExpression,
  test,
  consequent,
  alternate,
});

export const createAssignmentExpression = (operator, left, right) => ({
  type: NodeTypes.AssignmentExpression,
  operator,
  left,
  right,
});

export const createArrayExpression = (elements = []) => ({
  type: NodeTypes.ArrayExpression,
  elements,
});

export const createObjectExpression = (properties = []) => ({
  type: NodeTypes.ObjectExpression,
  properties,
});

export const createIfStatement = (test, consequent, alternate = null) => ({
  type: NodeTypes.IfStatement,
  test,
  consequent,
  alternate,
});

export const createWhileStatement = (test, body) => ({
  type: NodeTypes.WhileStatement,
  test,
  body,
});

export const createForStatement = (init, test, update, body) => ({
  type: NodeTypes.ForStatement,
  init,
  test,
  update,
  body,
});

export const createReturnStatement = (argument = null) => ({
  type: NodeTypes.ReturnStatement,
  argument,
});

export const createTryStatement = (block, handler = null, finalizer = null) => ({
  type: NodeTypes.TryStatement,
  block,
  handler,
  finalizer,
});

export const createThrowStatement = (argument) => ({
  type: NodeTypes.ThrowStatement,
  argument,
});

export const createCatchClause = (param, body) => ({
  param,
  body,
});
