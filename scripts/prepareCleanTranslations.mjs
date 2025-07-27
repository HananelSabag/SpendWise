#!/usr/bin/env node
// prepareCleanTranslations.mjs – balanced cleanup generator
// Keeps:
//   1. Every key referenced literally in t('...') calls.
//   2. All keys under protected namespaces (categories.*, toast.*) to cover dynamic access.
//   3. Both English & Hebrew values for each kept key; if Hebrew missing it duplicates English.
// Produces client/src/context/LanguageContext.clean.jsx for review.

import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'client', 'src');
const CTX = path.join(SRC, 'context');
const OLD = path.join(CTX, 'LanguageContext.jsx');
const NEW = path.join(CTX, 'LanguageContext.clean.jsx');

const PROTECTED_NAMESPACES = ['categories', 'toast', 'common'];

// Gather literal keys --------------------------------------------------
const T_REGEX = /t\(\s*["']([A-Za-z0-9_.-]+)["']/g;
// any string literal that looks like a translation path (at least one dot, no /)
const STRING_PATH_REGEX = /["']([A-Za-z][A-Za-z0-9_.-]*\.[A-Za-z0-9_.-]+)["']/g;
const literalKeys = new Set();
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      scan(fp);
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      const txt = fs.readFileSync(fp, 'utf8');
      let m;
      while ((m = T_REGEX.exec(txt))) {
        literalKeys.add(m[1]);
      }
      // also scan for generic dotted string literals
      STRING_PATH_REGEX.lastIndex = 0;
      while ((m = STRING_PATH_REGEX.exec(txt))) {
        const candidate = m[1];
        if (!candidate.includes('/')) literalKeys.add(candidate);
      }
    }
  }
}
scan(SRC);
console.log(`Found ${literalKeys.size} candidate translation keys in code.`);

// Evaluate translations object ----------------------------------------
if (!fs.existsSync(OLD)) throw new Error('LanguageContext.jsx not found');
const raw = fs.readFileSync(OLD, 'utf8');
const start = raw.indexOf('const translations');
const braceStart = raw.indexOf('{', start);
let depth = 0, end = braceStart;
for (let i = braceStart; i < raw.length; i++) {
  if (raw[i] === '{') depth++;
  else if (raw[i] === '}') {
    depth--;
    if (depth === 0) { end = i; break; }
  }
}
const translationsText = raw.slice(braceStart, end + 1);
const sandbox = {};
const translations = vm.runInNewContext(`(${translationsText})`, sandbox, { timeout: 5000 });
if (!translations || typeof translations !== 'object') throw new Error('Failed evaluating translations');
const heTranslations = translations.he || {};

// helper functions -----------------------------------------------------
function setDeep(obj, pathArr, value) {
  let p = obj;
  pathArr.forEach((seg, idx) => {
    if (idx === pathArr.length - 1) p[seg] = value;
    else {
      if (!(seg in p)) p[seg] = {};
      p = p[seg];
    }
  });
}
function getDeep(obj, pathArr) {
  let p = obj;
  for (const seg of pathArr) {
    if (p && typeof p === 'object' && seg in p) p = p[seg];
    else return undefined;
  }
  return p;
}

// Build keep list ------------------------------------------------------
const keepKeys = new Set(literalKeys);
for (const ns of PROTECTED_NAMESPACES) {
  // copy every subkey path from translations[ns]
  function walk(nsObj, prefix) {
    for (const k of Object.keys(nsObj)) {
      const newPath = prefix ? `${prefix}.${k}` : k;
      keepKeys.add(newPath);
      if (typeof nsObj[k] === 'object') walk(nsObj[k], newPath);
    }
  }
  if (translations[ns]) walk(translations[ns], ns);
}
console.log(`Total keys kept after adding protected namespaces: ${keepKeys.size}`);

// Build slim english object -------------------------------------------
const slim = {};
for (const key of keepKeys) {
  const parts = key.split('.');
  const enVal = getDeep(translations, parts);
  setDeep(slim, parts, enVal !== undefined ? enVal : `[MISSING:${key}]`);
}

// Build slim hebrew object --------------------------------------------
const slimHe = {};
for (const key of keepKeys) {
  const parts = key.split('.');
  const heVal = getDeep(heTranslations, parts);
  const enVal = getDeep(slim, parts);
  setDeep(slimHe, parts, heVal !== undefined ? heVal : enVal);
}
slim.he = slimHe;

// Generate new provider file ------------------------------------------
const header = `// Auto-generated clean translations\nimport React, { createContext, useContext } from 'react';\n\nconst LanguageContext = createContext();\n\nconst translations = `;
const footer = `;\n\nexport const useLanguage = () => {\n  const ctx = useContext(LanguageContext);\n  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');\n  return ctx;\n};\n\nexport const LanguageProvider = ({ children }) => {\n  const t = (key, params = {}) => {\n    const value = key.split('.').reduce((o, i) => (o ? o[i] : undefined), translations);
    if (!value) return key;\n    return Object.entries(params).reduce((s, [k, v]) => s.replace(new RegExp('\\{\\{'+k+'\\}\\}', 'g'), v), value);\n  };\n  return <LanguageContext.Provider value={{ t }}>{children}</LanguageContext.Provider>;\n};\n`;

fs.writeFileSync(NEW, header + JSON.stringify(slim, null, 2) + footer, 'utf8');
console.log('Clean translation file written ->', path.relative(ROOT, NEW)); 