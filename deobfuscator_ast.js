
const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');
const vm = require('vm');

const code = fs.readFileSync('/data/data/com.dsharnessmobile.shell/files/home/tmp/link4m.js', 'utf8');
const idx = code.indexOf(',function(){');

// 1. Initialize _0x520c
let initCode = code.slice(0, idx) + ');';
initCode = initCode.replace('const _0x520c=', 'var _0x520c=');
initCode = initCode.replace('const _0x516d=', 'var _0x516d=');
const ctx = vm.createContext({
  console, Math, Date, parseInt, Boolean, String, RegExp, Array, Object
});
vm.runInContext(initCode, ctx);
const _0x520c = ctx._0x520c;

// 2. Parse AST of payload
console.log("Parsing AST...");
const payloadCode = '(' + code.slice(idx + 1);
const ast = parser.parse(payloadCode, { sourceType: 'script' });

function evaluateExpr(node, env) {
  if (!node) return undefined;
  if (node.type === 'StringLiteral') return node.value;
  if (node.type === 'NumericLiteral') return node.value;
  if (node.type === 'Identifier') {
    if (env && node.name in env) return env[node.name];
    return undefined;
  }
  if (node.type === 'UnaryExpression') {
    const val = evaluateExpr(node.argument, env);
    if (val === undefined) return undefined;
    if (node.operator === '-') return -val;
    if (node.operator === '+') return +val;
    if (node.operator === '!') return !val;
  }
  if (node.type === 'BinaryExpression') {
    const left = evaluateExpr(node.left, env);
    const right = evaluateExpr(node.right, env);
    if (left === undefined || right === undefined) return undefined;
    if (node.operator === '+') return left + right;
    if (node.operator === '-') return left - right;
    if (node.operator === '*') return left * right;
    if (node.operator === '/') return left / right;
    if (node.operator === '%') return left % right;
  }
  return undefined;
}

function resolveChain(binding, argValues) {
  if (!binding || !binding.path.isVariableDeclarator()) return null;
  const init = binding.path.node.init;
  if (!init) return null;
  const params = init.params.map(p => p.name);
  const env = {};
  params.forEach((p, i) => { env[p] = argValues[i]; });
  
  let retNode = null;
  if (init.body.type === 'BlockStatement') {
    if (init.body.body.length === 1 && init.body.body[0].type === 'ReturnStatement') {
      retNode = init.body.body[0].argument;
    }
  } else {
    retNode = init.body;
  }
  if (!retNode || retNode.type !== 'CallExpression') return null;
  const nextCallee = retNode.callee;
  if (nextCallee.type !== 'Identifier') return null;
  const nextArgs = retNode.arguments.map(a => evaluateExpr(a, env));
  if (nextArgs.some(v => v === undefined)) return null;
  
  if (nextCallee.name === '_0x520c') {
    return _0x520c(nextArgs[0], nextArgs[1]);
  }
  
  const nextBinding = binding.scope.getBinding(nextCallee.name);
  return resolveChain(nextBinding, nextArgs);
}

function resolveDecoderCall(callPath) {
  const callee = callPath.node.callee;
  if (callee.type !== 'Identifier') return null;
  const name = callee.name;
  
  if (name === '_0x520c') {
    const args = callPath.node.arguments.map(a => evaluateExpr(a, {}));
    if (args.length >= 2 && typeof args[0] === 'number' && typeof args[1] === 'string') {
      return _0x520c(args[0], args[1]);
    }
    return null;
  }
  
  const binding = callPath.scope.getBinding(name);
  if (!binding || !binding.path.isVariableDeclarator()) return null;
  
  const init = binding.path.node.init;
  if (!init || (init.type !== 'FunctionExpression' && init.type !== 'ArrowFunctionExpression')) return null;
  
  const params = init.params.map(p => p.name);
  const argValues = callPath.node.arguments.map(a => evaluateExpr(a, {}));
  if (argValues.some(v => v === undefined)) return null;
  
  const env = {};
  params.forEach((p, i) => { env[p] = argValues[i]; });
  
  let retNode = null;
  if (init.body.type === 'BlockStatement') {
    if (init.body.body.length === 1 && init.body.body[0].type === 'ReturnStatement') {
      retNode = init.body.body[0].argument;
    }
  } else {
    retNode = init.body;
  }
  
  if (!retNode || retNode.type !== 'CallExpression') return null;
  
  const nextCallee = retNode.callee;
  if (nextCallee.type !== 'Identifier') return null;
  
  const nextArgs = retNode.arguments.map(a => evaluateExpr(a, env));
  if (nextArgs.some(v => v === undefined)) return null;
  
  if (nextCallee.name === '_0x520c') {
    if (typeof nextArgs[0] === 'number' && typeof nextArgs[1] === 'string') {
      return _0x520c(nextArgs[0], nextArgs[1]);
    }
    return null;
  }
  
  const nextBinding = binding.scope.getBinding(nextCallee.name);
  if (!nextBinding) return null;
  
  return resolveChain(nextBinding, nextArgs);
}

console.log("Replacing all encrypted string calls in AST...");
let decodedCount = 0;
traverse(ast, {
  CallExpression(path) {
    const res = resolveDecoderCall(path);
    if (res !== null) {
      decodedCount++;
      path.replaceWith(t.stringLiteral(res));
    }
  }
});

console.log(`Successfully replaced ${decodedCount} calls with decrypted strings!`);

console.log("Generating decoded code...");
const output = generate(ast, { compact: false, comments: true }).code;
fs.writeFileSync('/data/data/com.dsharnessmobile.shell/files/home/tmp/deobf/link4m_decoded.js', output, 'utf8');
console.log("Written link4m_decoded.js (size: " + output.length + " bytes)");
