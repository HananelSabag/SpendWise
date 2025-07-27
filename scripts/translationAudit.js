#!/usr/bin/env node
/*
 * translationAudit.js — Step 1 of the i18n cleanup plan.
 *
 * Generates a report of:
 *   1) Keys present in English but missing in Hebrew and vice-versa.
 *   2) Duplicate keys in either language block.
 *   3) Translation keys used in the codebase that are missing from LanguageContext.
 *   4) Hard-coded text literals (simple heuristic).
 *
 * Usage:  node scripts/translationAudit.js > translation-report.md
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
// chalk v5 is ESM-only and causes ERR_REQUIRE_ESM when required from CJS.
// To keep compatibility we avoid using it; color output is nice-to-have.
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const LANGUAGE_CONTEXT_PATH = path.join(__dirname, '..', 'client', 'src', 'context', 'LanguageContext.jsx');
const CLIENT_SRC_GLOB = path.join(__dirname, '..', 'client', 'src', '**', '*.{js,jsx,ts,tsx}').replace(/\\/g, '/');

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

// Check if text is likely user-facing and should be translated
function isLikelyUserFacingText(text, filename) {
  if (!text || text.length < 2) return false;
  
  // Exclude obvious non-user-facing content
  const excludePatterns = [
    /^[0-9]+$/,                     // Pure numbers
    /^[0-9]+[A-Z]?$/,              // Numbers with single letter (10K+, etc)
    /^\s*$/, /^\.+$/, /^,+$/,      // Whitespace, dots, commas
    /^[()]+$/, /^[\[\]]+$/,        // Brackets
    /^[{}]+$/, /^[<>]+$/,          // Braces, arrows
    /^[+\-*/=]+$/,                 // Math operators
    /^[!@#$%^&*]+$/,               // Special chars
    /^\w{1,2}$/,                   // Very short words (ok, no, etc)
    /^(div|span|p|h[1-6]|ul|li|img)$/i, // HTML tags
    /^(px|em|rem|%|vh|vw)$/,       // CSS units
    /^(true|false|null|undefined)$/i, // JS keywords
    /^(get|post|put|delete)$/i,    // HTTP methods
    /^(debug|test|dev|prod)$/i,    // Dev terms
    /^(id|key|url|api|src|href)$/i // Technical terms
  ];
  
  if (excludePatterns.some(pattern => pattern.test(text.trim()))) {
    return false;
  }
  
  // Exclude file-specific non-user content
  if (filename.includes('test') || filename.includes('spec')) {
    return false; // Test files often have non-user strings
  }
  
  // Include if it looks like user-facing text
  const includePatterns = [
    /^[A-Z][a-z]/, // Starts with capital letter
    /[.!?]$/, // Ends with punctuation
    /\s+/, // Contains spaces (likely sentences)
    /^(Loading|Error|Success|Warning|Info)/, // Common UI states
    /^(Welcome|Hello|Goodbye)/, // Greetings
    /^(Save|Cancel|Delete|Edit|Update|Create)/, // Actions
    /^(Please|Thank|Sorry)/, // Polite phrases
  ];
  
  return includePatterns.some(pattern => pattern.test(text.trim()));
}

// Get line number for a given character index
function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length;
}

function extractTranslationKeys(ast, languageNodeName) {
  // Locate translations.<languageNodeName>
  let keys = new Set();

  traverse(ast, {
    ObjectProperty(path) {
      const { node } = path;
      if (
        path.parentPath.parentPath &&
        path.parentPath.parentPath.node &&
        path.parentPath.parentPath.node.type === 'VariableDeclarator' &&
        path.parentPath.parentPath.node.id.name === 'translations'
      ) {
        // We are inside translations object tree
        // We need to resolve the top-level language (en/he) chain
        const chain = [];
        let current = path;
        while (current && current.node && current.node.key) {
          if (current.node.key.type === 'Identifier') {
            chain.unshift(current.node.key.name);
          } else if (current.node.key.type === 'StringLiteral') {
            chain.unshift(current.node.key.value);
          }
          current = current.parentPath.parentPath;
        }

        if (chain[0] === languageNodeName) {
          // Build key: chain slice from index 1 to end joined by dots
          const key = chain.slice(1).join('.');
          if (key) keys.add(key);
        }
      }
    },
  });

  return keys;
}

// ---------------------------------------------------------------------------
// Collect translation keys from LanguageContext.jsx
// ---------------------------------------------------------------------------
function collectLanguageKeys() {
  const code = fs.readFileSync(LANGUAGE_CONTEXT_PATH, 'utf8');
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'dynamicImport', 'classProperties', 'optionalChaining'],
  });

  const enKeys = new Set();
  const heKeys = new Set();
  const duplicates = { en: new Set(), he: new Set() };

  traverse(ast, {
    ObjectProperty(path) {
      // Ensure we're inside the `translations` variable declarator
      const declParent = path.findParent((p) =>
        p.isVariableDeclarator() && p.node.id.name === 'translations'
      );
      if (!declParent) return;

      // Build full chain from this node up to `translations`
      const segments = [];
      let current = path;
      while (
        current &&
        current.isObjectProperty() &&
        current.node &&
        current.node.key
      ) {
        const keyNode = current.node.key;
        segments.unshift(
          keyNode.type === 'Identifier' ? keyNode.name : keyNode.value
        );
        current = current.parentPath.parentPath;
      }

      if (!segments.length) return;

      const isHebrew = segments[0] === 'he';
      const key = isHebrew ? segments.slice(1).join('.') : segments.join('.');
      if (!key) return;

      const keySet = isHebrew ? heKeys : enKeys;
      const dupSet = isHebrew ? duplicates.he : duplicates.en;
      if (keySet.has(key)) {
        dupSet.add(key);
      } else {
        keySet.add(key);
      }
    },
  });

  return { enKeys, heKeys, duplicates };
}

// ---------------------------------------------------------------------------
// Scan codebase for translation key usages & hard-coded literals
// ---------------------------------------------------------------------------
function scanCodebaseForKeys() {
  const files = glob.sync(CLIENT_SRC_GLOB, { nodir: true, absolute: true });
  const usedKeys = new Set();
  const hardCodedTextOccurrences = [];
  const missingTCallOccurrences = [];

  // POINT 3: Detect t('key') usage
  const tCallRegex = /t\(\s*['"`]([^'"`]+)['"`]/g;
  
  // POINT 1 & 2: Enhanced hard-coded text patterns
  const patterns = [
    // JSX text content
    { regex: />\s*([^<{][^<>&}{\n]{2,})\s*</g, type: 'JSX Text Content' },
    // Placeholder attributes
    { regex: /placeholder\s*=\s*["']([^"']{3,})["']/g, type: 'Placeholder Text' },
    // Title attributes
    { regex: /title\s*=\s*["']([^"']{3,})["']/g, type: 'Title Attribute' },
    // Alt text
    { regex: /alt\s*=\s*["']([^"']{3,})["']/g, type: 'Alt Text' },
    // Label text
    { regex: /label\s*=\s*["']([^"']{3,})["']/g, type: 'Label Text' },
    // Error messages in strings
    { regex: /(?:error|message|msg)\s*[:=]\s*["']([^"']{4,})["']/g, type: 'Error Message' },
    // Button text patterns
    { regex: /(?:button|btn).*?["']([A-Z][^"']{2,})["']/g, type: 'Button Text' },
    // Toast/notification messages
    { regex: /(?:toast|notification|alert).*?["']([A-Z][^"']{3,})["']/g, type: 'Toast Message' },
    // Console messages that might be user-facing
    { regex: /console\.(?:log|warn|error)\s*\(\s*["']([A-Z][^"']{4,})["']/g, type: 'Console Message' },
    // String literals that look like user messages
    { regex: /["']([A-Z][^"']*(?:\s+[A-Z][^"']*){1,}[.!?])["']/g, type: 'User Message' }
  ];

  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const filename = path.relative(process.cwd(), file);

    // POINT 3: Collect t('key') usages
    let match;
    tCallRegex.lastIndex = 0;
    while ((match = tCallRegex.exec(content)) !== null) {
      const key = match[1];
      // Filter out obvious false positives
      if (
        !key.startsWith('/') &&           // API paths
        !key.startsWith('./') &&          // File paths  
        !key.startsWith('../') &&         // File paths
        !key.includes('${') &&            // Template literals
        !key.includes('-${') &&           // Template literals in strings
        key.length > 1 &&                 // Single characters
        !key.match(/^[a-zA-Z]$/) &&       // Single letters
        !key.match(/^\d+$/) &&            // Numbers only
        key.includes('.') &&              // Must have namespace
        !key.includes(' ') &&             // No spaces (likely not a key)
        !key.endsWith('||') &&            // Code artifacts
        !key.includes('?') &&             // Conditional operators
        !key.includes(':') &&             // Object notation
        !key.includes('=')                // Assignment operators
      ) {
        usedKeys.add(key);
      }
    }

    // POINT 1 & 2: Enhanced hard-coded text detection
    patterns.forEach(({ regex, type }) => {
      regex.lastIndex = 0;
      while ((match = regex.exec(content)) !== null) {
        const text = match[1].trim();
        if (isLikelyUserFacingText(text, filename)) {
          hardCodedTextOccurrences.push({ 
            file: filename, 
            text, 
            type,
            line: getLineNumber(content, match.index)
          });
        }
      }
    });
  });

  return { usedKeys, hardCodedTextOccurrences, missingTCallOccurrences };
}

// ---------------------------------------------------------------------------
// Generate report
// ---------------------------------------------------------------------------
function generateReport() {
  const { enKeys, heKeys, duplicates } = collectLanguageKeys();
  const { usedKeys, hardCodedTextOccurrences, missingTCallOccurrences } = scanCodebaseForKeys();

  const missingInHe = [...enKeys].filter((k) => !heKeys.has(k));
  const missingInEn = [...heKeys].filter((k) => !enKeys.has(k));
  const missingInTranslations = [...usedKeys].filter((k) => !enKeys.has(k) && !heKeys.has(k));

  console.log('# 🔍 COMPREHENSIVE TRANSLATION AUDIT REPORT\n');
  
  console.log('## 📊 4-POINT CHECKLIST SUMMARY');
  console.log('### ✅ POINT 1: Hard-coded strings detection');
  console.log(`• 🚨 Hard-coded text found: ${hardCodedTextOccurrences.length}`);
  console.log('### ✅ POINT 2: Missing t() calls detection'); 
  console.log(`• 🚨 Missing t() opportunities: ${hardCodedTextOccurrences.length} (same as Point 1)`);
  console.log('### ✅ POINT 3: Missing translation keys');
  console.log(`• ❌ t() calls missing translations: ${missingInTranslations.length}`);
  console.log('### ✅ POINT 4: Duplicate translation keys');
  console.log(`• ⚠️  Duplicate EN keys: ${duplicates.en.size}`);
  console.log(`• ⚠️  Duplicate HE keys: ${duplicates.he.size}`);
  console.log();

  console.log('## 📈 TRANSLATION STATUS');
  console.log(`• 🇬🇧 English keys: ${enKeys.size}`);
  console.log(`• 🇮🇱 Hebrew  keys: ${heKeys.size}`);
  console.log(`• 🔑 Keys used in code: ${usedKeys.size}`);
  console.log(`• ❌ Missing in Hebrew: ${missingInHe.length}`);
  console.log(`• ❌ Missing in English: ${missingInEn.length}`);
  console.log();

  function printList(title, arr) {
    if (!arr.length) return;
    console.log(`### ${title} (${arr.length})`);
    arr.forEach((item) => console.log('-', item));
    console.log();
  }

  function printHardcodedOccurrences(title, occurrences) {
    if (!occurrences.length) return;
    console.log(`### ${title} (${occurrences.length})`);
    
    // Group by type for better organization
    const byType = {};
    occurrences.forEach(({ type, text, file, line }) => {
      if (!byType[type]) byType[type] = [];
      byType[type].push({ text, file, line });
    });
    
    Object.entries(byType).forEach(([type, items]) => {
      console.log(`\n#### ${type} (${items.length})`);
      items.slice(0, 20).forEach(({ text, file, line }) => {
        console.log(`- "${text}" — ${file}:${line}`);
      });
      if (items.length > 20) {
        console.log(`... and ${items.length - 20} more`);
      }
    });
    console.log();
  }

  // POINT 4: Report duplicate keys
  if (duplicates.en.size > 0 || duplicates.he.size > 0) {
    console.log('## 🚨 POINT 4: DUPLICATE TRANSLATION KEYS');
    printList('Duplicate English keys', [...duplicates.en]);
    printList('Duplicate Hebrew keys', [...duplicates.he]);
  }

  // POINT 3: Report missing translation keys  
  if (missingInTranslations.length > 0 || missingInHe.length > 0 || missingInEn.length > 0) {
    console.log('## 🚨 POINT 3: MISSING TRANSLATION KEYS');
    printList('Used in code but missing in translations', missingInTranslations);
    printList('Missing keys in Hebrew', missingInHe);
    printList('Missing keys in English', missingInEn);
  }

  // POINT 1 & 2: Report hard-coded text (both hard-coded strings and missing t() calls)
  if (hardCodedTextOccurrences.length > 0) {
    console.log('## 🚨 POINT 1 & 2: HARD-CODED TEXT & MISSING t() CALLS');
    console.log('_These are strings that should likely be translated using t() calls_\n');
    printHardcodedOccurrences('Hard-coded text that needs translation', hardCodedTextOccurrences);
  }

  // Success message if everything is clean
  if (duplicates.en.size === 0 && duplicates.he.size === 0 && 
      missingInTranslations.length === 0 && missingInHe.length === 0 && 
      missingInEn.length === 0 && hardCodedTextOccurrences.length === 0) {
    console.log('## 🎉 ALL 4 POINTS PASSED!');
    console.log('✅ No duplicate keys found');
    console.log('✅ No missing translation keys');  
    console.log('✅ No hard-coded strings detected');
    console.log('✅ Perfect translation coverage!');
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
if (require.main === module) {
  generateReport();
} 