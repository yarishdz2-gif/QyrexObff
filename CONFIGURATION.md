# Qyrexobf Configuration Guide

## Configuration File (.qyrexobf.json)

Place this file in your project root to customize Qyrexobf behavior:

```json
{
  "preset": "Medium",
  "stringEncryption": true,
  "controlFlowFlattening": true,
  "nameMangling": true,
  "antiSandbox": false,
  "deadCodeInjection": false,
  "constantObfuscation": false,
  "debugLogging": false,
  "minify": false,
  "compact": false,
  "excludePatterns": ["node_modules/**", "*.test.js"],
  "includePatterns": ["src/**/*.js"]
}
```

## Environment Variables

```bash
# Enable debug mode
export QYREXOBF_DEBUG=true

# Set default preset
export QYREXOBF_PRESET=High

# Specify output directory
export QYREXOBF_OUTPUT_DIR=./protected
```

## Programmatic Configuration

```javascript
const config = {
  // Obfuscation Layers
  stringEncryption: true,           // Encrypt string literals
  controlFlowFlattening: true,      // Flatten control structures
  nameMangling: true,               // Rename identifiers
  antiSandbox: true,                // Inject sandbox detection
  deadCodeInjection: false,         // Add unreachable code
  constantObfuscation: false,       // Transform numeric constants

  // Output Options
  minify: false,                    // Minify output
  compact: false,                   // Compact formatting
  sourceMap: false,                 // Generate source maps

  // Security Options
  preventReverse: true,             // Anti-reverse engineering
  preventDeobfuscation: true,       // Anti-deobfuscation
  preventAnalysis: true,            // Anti-analysis techniques

  // Debugging
  debugLogging: false,              // Show detailed logs
  preserveComments: false,          // Keep comments

  // Performance
  workerThreads: 4,                 // Parallel processing
  batchSize: 100,                   // Files per batch
};
```

## Preset Configurations

### Low
```javascript
{
  stringEncryption: true,
  controlFlowFlattening: false,
  nameMangling: true,
  antiSandbox: false,
}
```
**Use case:** Quick obfuscation with minimal overhead

### Medium (Default)
```javascript
{
  stringEncryption: true,
  controlFlowFlattening: true,
  nameMangling: true,
  antiSandbox: false,
}
```
**Use case:** Balanced protection and performance

### High
```javascript
{
  stringEncryption: true,
  controlFlowFlattening: true,
  nameMangling: true,
  antiSandbox: true,
}
```
**Use case:** Strong protection against static analysis

### Ultra
```javascript
{
  stringEncryption: true,
  controlFlowFlattening: true,
  nameMangling: true,
  antiSandbox: true,
  deadCodeInjection: true,
  constantObfuscation: true,
}
```
**Use case:** Maximum protection against all analysis types

## Advanced Options

### Custom Encryption Key
```javascript
const obfuscator = new Qyrexobf({
  encryptionKey: 0xAB,  // Custom XOR key
});
```

### Selective Obfuscation
```javascript
const config = {
  onlyObfuscate: ['src/sensitive/*.js'],
  excludeObfuscation: ['src/vendor/**/*.js'],
};
```

### Module Preservation
```javascript
const config = {
  preserveModules: true,   // Keep module structure
  preserveExports: true,   // Keep export names
  preserveAPI: true,       // Keep public API names
};
```

## Exclusion Patterns

Use glob patterns to exclude files:

```json
{
  "excludePatterns": [
    "node_modules/**",
    "dist/**",
    "*.test.js",
    "*.spec.js",
    "**/vendor/**",
    "**/third-party/**"
  ]
}
```

## Performance Tuning

### For Large Codebases
```javascript
{
  preset: "Low",           // Use simpler preset
  compact: true,           // Minify output
  workerThreads: 8,        // Parallel processing
}
```

### For Maximum Protection
```javascript
{
  preset: "Ultra",
  debugLogging: false,     // Disable logs
  compact: true,
  workerThreads: 4,
}
```

### For Development
```javascript
{
  preset: "Low",
  debugLogging: true,
  preserveComments: true,
  sourceMap: true,
}
```

## CLI Configuration

Load config from file:
```bash
qyrexobf --config .qyrexobf.json input.js
```

Override config option:
```bash
qyrexobf -p Ultra --override stringEncryption=false input.js
```

## Integration with Build Tools

### Webpack
```javascript
const QyrexobfPlugin = require('qyrexobf/webpack-plugin');

module.exports = {
  plugins: [
    new QyrexobfPlugin({
      preset: 'High',
      exclude: /node_modules/,
    })
  ]
};
```

### Rollup
```javascript
import qyrexobf from 'qyrexobf/rollup-plugin';

export default {
  plugins: [
    qyrexobf({
      preset: 'Medium',
      include: 'src/**/*.js',
    })
  ]
};
```

### Gulp
```javascript
const qyrexobf = require('qyrexobf/gulp');

gulp.task('obfuscate', () => {
  return gulp.src('src/**/*.js')
    .pipe(qyrexobf({ preset: 'High' }))
    .pipe(gulp.dest('dist'));
});
```

## Monitoring & Analysis

Enable detailed logging:
```javascript
const obfuscator = new Qyrexobf({
  debugLogging: true,
});

obfuscator.on('progress', (stats) => {
  console.log(`Processed: ${stats.processed}/${stats.total}`);
});

obfuscator.on('complete', (summary) => {
  console.log(`Final size reduction: ${summary.reduction}%`);
});
```

## Security Best Practices

1. **Always use High or Ultra preset for production**
2. **Combine obfuscation with minification**
3. **Add anti-sandbox detection for sensitive code**
4. **Regularly update to latest version**
5. **Test obfuscated code thoroughly**
6. **Store configuration securely**
7. **Use version control for config changes**

## Troubleshooting

### Code won't run after obfuscation
- Disable `controlFlowFlattening`
- Check for external dependencies

### Output is too large
- Enable `minify` or `compact` options
- Use "Low" preset instead

### Obfuscation too slow
- Reduce `workerThreads`
- Use "Low" preset
- Split large files

### Some code is broken
- Check exclusion patterns
- Disable specific transformations
- Test with simpler preset
