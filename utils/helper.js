// Helper functions for obfuscation
export function generateRandomId(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function xorEncrypt(str, key = 0x42) {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(str.charCodeAt(i) ^ key);
  }
  return result;
}

export function base64Encode(str) {
  try {
    return btoa(str);
  } catch (e) {
    return Buffer.from(str).toString('base64');
  }
}

export function base64Decode(str) {
  try {
    return atob(str);
  } catch (e) {
    return Buffer.from(str, 'base64').toString();
  }
}

export function generateRandomString(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (obj instanceof Object) {
    const clone = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clone[key] = deepClone(obj[key]);
      }
    }
    return clone;
  }
}

export function measureComplexity(ast) {
  let complexity = 0;

  function walk(node) {
    if (!node) return;

    complexity++;

    if (typeof node === 'object') {
      for (const key in node) {
        if (Array.isArray(node[key])) {
          node[key].forEach(child => walk(child));
        } else if (typeof node[key] === 'object') {
          walk(node[key]);
        }
      }
    }
  }

  walk(ast);
  return complexity;
}

export function getObfuscationSummary(originalCode, obfuscatedCode) {
  return {
    originalSize: originalCode.length,
    obfuscatedSize: obfuscatedCode.length,
    compressionRatio: ((1 - obfuscatedCode.length / originalCode.length) * 100).toFixed(2) + '%',
    expansionRatio: ((obfuscatedCode.length / originalCode.length - 1) * 100).toFixed(2) + '%',
  };
}

export const presets = {
  Low: {
    stringEncryption: true,
    controlFlowFlattening: false,
    nameMangling: true,
    antiSandbox: false,
    debugLogging: false,
  },
  Medium: {
    stringEncryption: true,
    controlFlowFlattening: true,
    nameMangling: true,
    antiSandbox: false,
    debugLogging: false,
  },
  High: {
    stringEncryption: true,
    controlFlowFlattening: true,
    nameMangling: true,
    antiSandbox: true,
    debugLogging: false,
  },
  Ultra: {
    stringEncryption: true,
    controlFlowFlattening: true,
    nameMangling: true,
    antiSandbox: true,
    debugLogging: false,
  },
};
