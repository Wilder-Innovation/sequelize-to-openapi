#!/usr/bin/env node
/**
 * Post-build script: renames .js → .cjs in dist/cjs/ and fixes require() calls.
 *
 * Because TypeScript's CommonJS output uses .js extensions, but the package
 * root is "type": "module", Node.js requires CJS files to have .cjs extension.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const CJS_DIR = path.resolve(__dirname, '..', 'dist', 'cjs');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      // Read, fix internal requires, rename
      let content = fs.readFileSync(fullPath, 'utf8');
      // Fix relative require() paths: "./foo.js" → "./foo.cjs"
      content = content.replace(/require\((['"])(\.{1,2}\/[^'"]+)\.js\1\)/g, (_, q, p) => {
        return `require(${q}${p}.cjs${q})`;
      });
      const newPath = fullPath.replace(/\.js$/, '.cjs');
      fs.writeFileSync(newPath, content, 'utf8');
      fs.unlinkSync(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.d.ts')) {
      // Fix declaration references
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(/from ['"](\.\/{0,1}[^'"]+)\.js['"]/g, (_, p) => {
        return `from '${p}.cjs'`;
      });
      fs.writeFileSync(fullPath, content, 'utf8');
    } else if (entry.isFile() && entry.name.endsWith('.js.map')) {
      // Rename sourcemaps
      const newPath = fullPath.replace(/\.js\.map$/, '.cjs.map');
      fs.renameSync(fullPath, newPath);
    }
  }
}

if (fs.existsSync(CJS_DIR)) {
  walk(CJS_DIR);
  console.log('✓ Renamed CJS output files to .cjs');
} else {
  console.warn('⚠ dist/cjs not found — skipping rename');
}
