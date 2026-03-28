/**
 * check-missing-translations.cjs  (v3)
 *
 * Reports:
 *  1. Keys missing in HE only       → need Hebrew translation
 *  2. Keys missing in EN only       → need English translation
 *  3. Keys missing in BOTH EN + HE  → key doesn't exist anywhere
 *  4. Duplicate top-level keys in translation files → last value silently wins
 *  5. Hardcoded user-visible text   → should use t() instead
 *
 * Usage:
 *   node client/scripts/check-missing-translations.cjs
 *   node client/scripts/check-missing-translations.cjs --module auth
 *   node client/scripts/check-missing-translations.cjs --file LoginForm
 *   node client/scripts/check-missing-translations.cjs --no-hardcoded
 */

const fs   = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────

const SRC_DIR   = path.resolve(__dirname, '../src');
const TRANS_DIR = path.resolve(__dirname, '../src/translations');

const args         = process.argv.slice(2);
const filterModule = args.includes('--module') ? args[args.indexOf('--module') + 1] : null;
const filterFile   = args.includes('--file')   ? args[args.indexOf('--file')   + 1] : null;
const noHardcoded  = args.includes('--no-hardcoded');

// ─── ANSI colours ─────────────────────────────────────────────────────────────

const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
};
const c = (color, str) => `${C[color]}${str}${C.reset}`;
const box = (width = 70) => '─'.repeat(width);
const header = (title, color = 'cyan') =>
  `\n${c(color, '┌' + box(title.length + 2) + '┐')}\n` +
  `${c(color, '│')} ${c('bold', title)} ${c(color, '│')}\n` +
  `${c(color, '└' + box(title.length + 2) + '┘')}`;

// ─── Load translation files ────────────────────────────────────────────────────

function loadTranslations(lang) {
  const dir = path.join(TRANS_DIR, lang);
  if (!fs.existsSync(dir)) return {};
  const modules = {};
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.js') || file === 'index.js') continue;
    const moduleName = file.replace('.js', '');
    try {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      const cleaned = content
        .replace(/export default\s+/, 'module.exports = ')
        .replace(/^export\s+/gm, '');
      const mod = new Function('module', 'exports', 'require', cleaned + '; return module.exports;')(
        { exports: {} }, {}, () => ({})
      );
      modules[moduleName] = mod || {};
    } catch {
      modules[moduleName] = {};
    }
  }
  return modules;
}

// ─── Detect duplicate top-level keys in a JS translation file ─────────────────

function findDuplicateKeys(lang) {
  const dir = path.join(TRANS_DIR, lang);
  if (!fs.existsSync(dir)) return [];
  const dupes = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.js') || file === 'index.js') continue;
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const seen = {};
    // Match top-level keys (2-space indent) and direct children (4-space) at any level
    const keyRe = /^  (\w+)\s*:/gm;
    let m;
    while ((m = keyRe.exec(content)) !== null) {
      const key = m[1];
      if (seen[key]) {
        dupes.push({ file: `${lang}/${file}`, key });
      }
      seen[key] = true;
    }
  }
  return dupes;
}

// ─── Resolve dotted key path ───────────────────────────────────────────────────

function resolvePath(obj, keyPath) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return typeof cur === 'string' ? cur
    : (typeof cur === 'object' && cur !== null ? '__object__' : undefined);
}

// ─── Parse useTranslation() bindings ──────────────────────────────────────────

const BINDING_RE = /const\s+\{([^}]+)\}\s*=\s*useTranslation\s*\(\s*(?:'([^']*)'|"([^"]*)")?\s*\)/g;

function parseBindings(content) {
  const bindings = {};
  let m;
  BINDING_RE.lastIndex = 0;
  while ((m = BINDING_RE.exec(content)) !== null) {
    const moduleArg = m[2] || m[3] || null;
    for (const part of m[1].split(',')) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const colonIdx = trimmed.indexOf(':');
      const exportName = colonIdx !== -1 ? trimmed.slice(0, colonIdx).trim() : trimmed;
      const localName  = colonIdx !== -1 ? trimmed.slice(colonIdx + 1).trim() : trimmed;
      if (exportName === 't') bindings[localName] = moduleArg;
    }
  }
  return bindings;
}

// ─── Find t() calls in a file ─────────────────────────────────────────────────

function findTCalls(content, bindings) {
  const results = [];
  const lines = content.split('\n');
  const varNames = Object.keys(bindings);
  if (!varNames.length) return results;
  const namesPattern = varNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const CALL_RE = new RegExp(`\\b(${namesPattern})\\s*\\(\\s*['"]([^'"]+)['"]`, 'g');
  for (let i = 0; i < lines.length; i++) {
    CALL_RE.lastIndex = 0;
    let m;
    while ((m = CALL_RE.exec(lines[i])) !== null) {
      results.push({ key: m[2], line: i + 1, boundModule: bindings[m[1]] });
    }
  }
  return results;
}

// ─── Detect hardcoded user-visible text ───────────────────────────────────────
//
// Looks for:
//   1. JSX text nodes:  >Some text<  (not just whitespace/numbers/punctuation)
//   2. User-facing string props: placeholder, title, aria-label, alt, tooltip
//      that contain actual words and aren't already using { t(...) }

const USER_PROPS = ['placeholder', 'title', 'aria-label', 'alt', 'tooltip'];

// Min 3 letters to be considered "user-visible text"
const HAS_LETTERS_RE = /[a-zA-Z]{3,}/;

// Patterns we deliberately skip (technical / non-translatable)
const SKIP_PATTERNS = [
  /^\s*$/,                             // whitespace only
  /^[0-9\s.,:;!?%$€£#@\-_/()]+$/,   // numbers / punctuation only
  /^https?:\/\//,                      // URLs
  /^[a-z][a-zA-Z0-9_-]*$/,            // single camelCase/kebab identifier
  /^\{/,                               // JSX expression
  /^<\//,                              // closing tag
  /\/\//,                              // comment
  /[?()[\]{}].*[a-z]/i,               // looks like JS expression (ternary, call, etc.)
  /^[A-Z][a-z]+\.[A-Z]/,              // JS object path like Math.abs
  /\bparseFloat\b|\bparseInt\b|\bMath\b|\btypeof\b/, // JS built-ins
  /^\d+\s*&&\s*/,                      // short-circuit expression like "0 && foo"
  /&&\s*\w+$/,                         // expression ending with && identifier
  /=\s*\d+\s*&&/,                      // "= 0 &&" pattern
];

function isSkippable(text) {
  const t = text.trim();
  if (!t || !HAS_LETTERS_RE.test(t)) return true;
  return SKIP_PATTERNS.some(r => r.test(t));
}

function findHardcoded(content, relPath) {
  const results = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // 1. JSX text nodes: >Some literal text<
    //    Match text between > and < that isn't a tag or expression
    const textNodeRe = />([^<>{}\n]+)</g;
    let m;
    while ((m = textNodeRe.exec(line)) !== null) {
      const text = m[1].trim();
      if (!isSkippable(text)) {
        results.push({ line: lineNum, type: 'text', text });
      }
    }

    // 2. User-facing string props with hardcoded values
    for (const prop of USER_PROPS) {
      // Matches:  prop="Some value"  or  prop={'Some value'}
      const propRe = new RegExp(`\\b${prop}=["']([^"'{}]+)["']`, 'g');
      while ((m = propRe.exec(line)) !== null) {
        const text = m[1].trim();
        if (!isSkippable(text)) {
          results.push({ line: lineNum, type: `prop:${prop}`, text });
        }
      }
    }
  }
  return results;
}

// ─── Walk source ───────────────────────────────────────────────────────────────

function walkSrc(dir) {
  const files = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', '.git', 'dist', 'build', 'translations', 'scripts'].includes(entry.name)) continue;
        walk(full);
      } else if (entry.isFile() && /\.(jsx?|tsx?)$/.test(entry.name)) {
        files.push(full);
      }
    }
  };
  walk(dir);
  return files;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

process.stdout.write('Loading translations... ');
const enTrans = loadTranslations('en');
const heTrans = loadTranslations('he');
console.log(c('green', '✓'));

process.stdout.write('Scanning source files... ');
const allFiles = walkSrc(SRC_DIR);

// Collect: missing[lang] = Map<sig, { file, key, line, resolvedModule, resolvedKey }>
const missingEn = new Map();
const missingHe = new Map();
const hardcodedByFile = {};
let totalCalls = 0;

for (const filePath of allFiles) {
  const relPath = path.relative(SRC_DIR, filePath);
  if (filterFile && !relPath.includes(filterFile)) continue;

  const content = fs.readFileSync(filePath, 'utf8');

  // ── Hardcoded detection ──────────────────────────────────────────────────
  if (!noHardcoded && /\.(jsx|tsx)$/.test(filePath)) {
    const hc = findHardcoded(content, relPath);
    if (hc.length) hardcodedByFile[relPath] = hc;
  }

  // ── Missing key detection ────────────────────────────────────────────────
  if (!content.includes('useTranslation')) continue;
  const bindings = parseBindings(content);
  if (!Object.keys(bindings).length) continue;

  const calls = findTCalls(content, bindings);
  totalCalls += calls.length;

  for (const { key, line, boundModule } of calls) {
    let resolvedModule, resolvedKey;
    if (boundModule !== null) {
      resolvedModule = boundModule;
      resolvedKey    = key;
    } else {
      const parts = key.split('.');
      if (parts.length < 2) continue;
      resolvedModule = parts[0];
      resolvedKey    = parts.slice(1).join('.');
    }

    if (filterModule && resolvedModule !== filterModule) continue;

    const sig = `${resolvedModule}::${resolvedKey}`;
    const entry = { file: relPath, key, line, resolvedModule, resolvedKey };

    const enMod = enTrans[resolvedModule];
    const heMod = heTrans[resolvedModule];

    const enVal = enMod ? resolvePath(enMod, resolvedKey) : undefined;
    const heVal = heMod ? resolvePath(heMod, resolvedKey) : undefined;

    if (enVal === undefined && !missingEn.has(sig)) missingEn.set(sig, entry);
    if (heVal === undefined && !missingHe.has(sig)) missingHe.set(sig, entry);
  }
}
console.log(c('green', '✓'));

// ─── Categorise ───────────────────────────────────────────────────────────────

const missingBoth = new Map();
const missingHeOnly = new Map();
const missingEnOnly = new Map();

for (const [sig, entry] of missingHe) {
  if (missingEn.has(sig)) missingBoth.set(sig, entry);
  else missingHeOnly.set(sig, entry);
}
for (const [sig, entry] of missingEn) {
  if (!missingHe.has(sig)) missingEnOnly.set(sig, entry);
}

// ─── Duplicate key detection ──────────────────────────────────────────────────

const dupesEn = findDuplicateKeys('en');
const dupesHe = findDuplicateKeys('he');

// ─── Print helpers ─────────────────────────────────────────────────────────────

function groupByFile(entries) {
  const map = {};
  for (const entry of entries) {
    if (!map[entry.file]) map[entry.file] = [];
    map[entry.file].push(entry);
  }
  return map;
}

function printMissingGroup(map, langTag) {
  if (!map.size) { console.log(c('green', '  ✅ None!')); return; }
  const byFile = groupByFile([...map.values()]);
  // Also group by module for summary
  const byModule = {};
  for (const e of map.values()) {
    byModule[e.resolvedModule] = (byModule[e.resolvedModule] || 0) + 1;
  }
  // Module summary line
  const modSummary = Object.entries(byModule)
    .sort((a,b) => b[1]-a[1])
    .map(([m,n]) => `${c('yellow',m)}${c('gray',':'+n)}`)
    .join('  ');
  console.log('  ' + modSummary + '\n');

  for (const [file, items] of Object.entries(byFile)) {
    console.log(`  ${c('blue','📄')} ${c('dim', file)}`);
    for (const { key, line, resolvedModule, resolvedKey } of items) {
      console.log(
        `     ${c('gray','L'+String(line).padStart(4))}  ` +
        `${c('cyan', "t('"+key+"')")}  ${c('gray','→')}  ` +
        `${c('red', resolvedModule+'.'+resolvedKey)}`
      );
    }
  }
}

// ─── Output ───────────────────────────────────────────────────────────────────

console.log('\n' + c('bold', '═'.repeat(70)));
console.log(c('bold', ' 🌍  SpendWise Translation Health Report'));
console.log(c('bold', '═'.repeat(70)));

// Summary table
const totalHardcoded = Object.values(hardcodedByFile).reduce((s, a) => s + a.length, 0);
console.log(`
  ${c('bold','Category')}                          ${c('bold','Count')}
  ${'─'.repeat(50)}
  ${c('red','● Missing in HE only')}              ${c('yellow', String(missingHeOnly.size).padStart(4))}   ← need Hebrew translation
  ${c('yellow','● Missing in EN only')}              ${c('yellow', String(missingEnOnly.size).padStart(4))}   ← need English translation
  ${c('red','● Missing in BOTH (no key)')}        ${c('yellow', String(missingBoth.size).padStart(4))}   ← key doesn't exist anywhere
  ${c('cyan','● Duplicate keys (EN)')}             ${c('yellow', String(dupesEn.length).padStart(4))}   ← last value silently wins
  ${c('cyan','● Duplicate keys (HE)')}             ${c('yellow', String(dupesHe.length).padStart(4))}   ← last value silently wins
  ${noHardcoded ? c('gray','● Hardcoded text (skipped)') : c('blue','● Hardcoded text')}          ${noHardcoded ? c('gray','  --') : c('yellow', String(totalHardcoded).padStart(4))}   ← should use t()
`);

// ── 1. Missing HE ─────────────────────────────────────────────────────────────
console.log(header(`1. MISSING IN HEBREW (${missingHeOnly.size})`, 'red'));
printMissingGroup(missingHeOnly, 'he');

// ── 2. Missing EN ─────────────────────────────────────────────────────────────
console.log(header(`2. MISSING IN ENGLISH (${missingEnOnly.size})`, 'yellow'));
printMissingGroup(missingEnOnly, 'en');

// ── 3. Missing Both ───────────────────────────────────────────────────────────
console.log(header(`3. MISSING IN BOTH LANGUAGES (${missingBoth.size})`, 'red'));
if (missingBoth.size) {
  console.log(c('gray', '  ⚠️  Note: files with multiple useTranslation() hooks may cause false positives here.'));
  console.log(c('gray', '     Verify each entry manually before adding keys.\n'));
}
printMissingGroup(missingBoth, 'both');

// ── 4. Duplicates ─────────────────────────────────────────────────────────────
console.log(header(`4. DUPLICATE KEYS IN TRANSLATION FILES`, 'cyan'));
if (!dupesEn.length && !dupesHe.length) {
  console.log(c('green', '  ✅ No duplicates found!'));
} else {
  for (const { file, key } of [...dupesEn, ...dupesHe]) {
    console.log(`  ${c('cyan','📁')} ${c('dim', file)}  ${c('yellow','key:')} ${c('bold', key)}  ${c('gray','(last value wins)')}`);
  }
}

// ── 5. Hardcoded ──────────────────────────────────────────────────────────────
if (!noHardcoded) {
  console.log(header(`5. HARDCODED TEXT (${totalHardcoded} instances in ${Object.keys(hardcodedByFile).length} files)`, 'blue'));
  if (!totalHardcoded) {
    console.log(c('green', '  ✅ No hardcoded text found!'));
  } else {
    for (const [file, items] of Object.entries(hardcodedByFile)) {
      console.log(`\n  ${c('blue','📄')} ${c('dim', file)}`);
      for (const { line, type, text } of items) {
        const label = type === 'text' ? c('gray','text') : c('cyan', type);
        console.log(
          `     ${c('gray','L'+String(line).padStart(4))}  [${label}]  ` +
          `${c('yellow', JSON.stringify(text))}`
        );
      }
    }
  }
}

// ── Footer ────────────────────────────────────────────────────────────────────
const totalIssues = missingHeOnly.size + missingEnOnly.size + missingBoth.size +
                    dupesEn.length + dupesHe.length + totalHardcoded;

console.log('\n' + c('bold', '═'.repeat(70)));
if (totalIssues === 0) {
  console.log(c('green', c('bold', '  ✅  All translation checks passed!')));
} else {
  console.log(c('bold', `  Total issues: ${c('red', String(totalIssues))}`));
}
console.log(c('bold', '═'.repeat(70)) + '\n');
