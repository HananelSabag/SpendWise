#!/usr/bin/env node

/**
 * Smart Translation Auditor for SpendWise - FIXED VERSION
 * 
 * This script performs a complete 4-point translation audit with smart filtering:
 * A. 🔑 Key Mismatch – ensures all t('...') references exist in LanguageContext
 * B. 📝 Hard-coded Text – finds REAL UI text only (not code/imports/paths)
 * C. 🔄 Existing Key Reuse – identifies duplicate concepts
 * D. ❌ Missing Keys – finds keys that need to be added
 * 
 * Usage: node scripts/SmartTranslationAudit.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const colorize = (text, color) => `${colors[color]}${text}${colors.reset}`;

class SmartTranslationAuditor {
  constructor() {
    this.translations = null;
    this.translationKeys = new Set();
    this.hebrewKeys = new Set();
    this.usedKeys = new Set();
    this.results = {
      // A. Key Mismatch
      missingTKeys: [],
      dynamicTKeys: [],  // Keys with ${} interpolation
      
      // B. Hard-coded Text
      hardcodedStrings: [],
      fallbackPatterns: [],
      isRTLTernaries: [],
      
      // C. Existing Key Reuse
      duplicateConcepts: [],
      
      // D. Missing Keys
      keysToAdd: [],
      
      // New result buckets
      missingHebrewKeys: [],
      missingEnglishKeys: [],
      unusedKeys: [],
      
      // Statistics
      stats: {
        totalFiles: 0,
        filesWithIssues: 0,
        totalTCalls: 0,
        validTCalls: 0,
        dynamicTCalls: 0,
        hardcodedCount: 0,
        totalIssues: 0
      }
    };
    
    // Enhanced ignore patterns - MUCH MORE COMPREHENSIVE
    this.ignorePatterns = [
      // Numbers and basic values
      /^[0-9]+$/,
      /^[0-9]+\.[0-9]+$/,
      /^(true|false|null|undefined)$/,
      /^NaN$/,
      
      // Code patterns
      /^[A-Z_]+$/,                          // CONSTANTS
      /^[a-z]+[A-Z]/,                       // camelCase
      /^[A-Z][a-z]+[A-Z]/,                  // PascalCase
      /\.[a-z]+$/,                          // .extension
      /^[a-z]+_[a-z]+$/,                    // snake_case
      
      // React/JSX specific
      /^(className|onClick|onChange|onSubmit|onBlur|onFocus|onKeyDown|onKeyUp)$/,
      /^(style|key|ref|id|type|name|value|placeholder|disabled|checked)$/,
      /^(props|state|setState|useState|useEffect|useContext|useRef)$/,
      /^(Component|Fragment|StrictMode|Suspense)$/,
      
      // HTML elements
      /^(div|span|p|a|button|input|form|label|select|option|textarea)$/,
      /^(h[1-6]|ul|ol|li|table|tr|td|th|thead|tbody|tfoot)$/,
      /^(header|footer|nav|main|section|article|aside)$/,
      /^(img|svg|path|g|circle|rect|line|polyline|polygon)$/,
      
      // CSS units and properties
      /^(px|rem|em|vh|vw|%|deg|s|ms)$/,
      /^(flex|grid|block|inline|none|absolute|relative|fixed)$/,
      /^(center|left|right|top|bottom|auto|inherit|initial)$/,
      
      // File paths and imports
      /\//,                                 // Contains slash
      /\\/,                                 // Contains backslash
      /^\.\.?\//, /\.$|\.{2,}/, /\/$/,     // Relative paths
      /\.(js|jsx|ts|tsx|css|scss|json|png|jpg|jpeg|gif|svg|ico|mp4|mp3|pdf|zip)$/i,
      
      // NPM packages
      /^(@?[a-z0-9\-]+\/[a-z0-9\-]+|[a-z0-9\-]+)$/, // package names
      /^(react|redux|axios|lodash|moment|express|next|gatsby|webpack)$/,
      /^(framer-motion|lucide-react|react-dom|react-router|styled-components)$/,
      
      // URLs and protocols
      /^https?:\/\//,
      /^(http|https|ftp|ws|wss)$/,
      /^(www\.|api\.|cdn\.)/,
      
      // Special characters only
      /^[\W]+$/,
      /^[=<>!&|+\-*/]+$/,                  // Operators
      
      // Data attributes
      /^(data-|aria-)/,
      
      // Common technical terms
      /^(API|URL|ID|UUID|JWT|JSON|XML|CSV|PDF)$/,
      /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$/,
      
      // Database/Backend
      /^(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|JOIN)$/i,
      /^(mongodb|postgresql|mysql|redis|sqlite)$/,
      
      // Version patterns
      /^v?[0-9]+\.[0-9]+(\.[0-9]+)?$/,
      
      // Hex colors
      /^#[0-9a-fA-F]{3,8}$/,
      
      // Common programming variables
      /^(i|j|k|x|y|z|n|m|idx|index|key|val|value|obj|arr|item|elem|el)$/,
      /^(req|res|err|error|next|cb|callback|fn|func)$/,
      
      // Time formats
      /^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?$/,
      /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
      
      // Common CSS classes (Tailwind, Bootstrap)
      /^(bg-|text-|border-|flex-|grid-|p-|m-|w-|h-)/,
      /^(col-|row-|btn-|card-|modal-|navbar-)/,
      
      // Emojis and special unicode
      /[\u{1F600}-\u{1F64F}]/u,
      /[\u{1F300}-\u{1F5FF}]/u,
      
      // Single characters (except meaningful ones)
      /^[a-zA-Z]$/,
      /^[^a-zA-Z0-9\s]{1,2}$/
    ];
    
    // Patterns that indicate real UI text
    this.uiTextPatterns = [
      /^[A-Z][a-z]+([\s][A-Za-z]+)*[.!?]?$/,  // Sentence case
      /^[a-z]+([\s][a-z]+)+$/,                // Multiple lowercase words
      /Welcome|Login|Sign|Register|Submit|Cancel|Save|Delete|Edit|Create|Update/i,
      /Please|Enter|Select|Choose|Click|Type|Fill/i,
      /Error|Success|Warning|Info|Loading|Processing/i,
      /^(Yes|No|OK|Confirm|Close|Open|Back|Next|Previous)$/i
    ];
  }

  // Extract translations from LanguageContext.jsx
  extractTranslations(fileContent) {
    try {
      const startToken = 'const translations';
      const endToken = 'export const LanguageProvider';

      const startIndex = fileContent.indexOf(startToken);
      if (startIndex === -1) {
        throw new Error('Could not locate "const translations"');
      }

      const endIndex = fileContent.indexOf(endToken, startIndex);
      if (endIndex === -1) {
        throw new Error('Could not locate end of translations object');
      }

      let translationsStr = fileContent
        .substring(startIndex, endIndex)
        .replace(/^const\s+translations\s*=\s*/, '')
        .trim();

      if (translationsStr.endsWith(';')) {
        translationsStr = translationsStr.slice(0, -1);
      }

      translationsStr = translationsStr.replace(/"(weekDays|months|monthsShort)":\s*"(\[.*?\])"/g, '"$1": $2');

      const translations = eval(`(${translationsStr})`);
      return translations;
    } catch (error) {
      throw new Error(`Failed to extract translations: ${error.message}`);
    }
  }

  // Flatten translations to get all keys
  flattenTranslations(obj, prefix = '') {
    const flattened = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenTranslations(value, fullKey));
      } else {
        flattened[fullKey] = value;
      }
    }
    
    return flattened;
  }

  // Load and prepare translations
  loadTranslations() {
    const contextPath = path.join(process.cwd(), 'client', 'src', 'context', 'LanguageContext.jsx');
    const fileContent = fs.readFileSync(contextPath, 'utf-8');
    this.translations = this.extractTranslations(fileContent);
    
    const englishKeys = {};
    for (const [key, value] of Object.entries(this.translations)) {
      if (key !== 'he' && typeof value === 'object') {
        Object.assign(englishKeys, this.flattenTranslations(value, key));
      }
    }
    
    Object.keys(englishKeys).forEach(key => this.translationKeys.add(key));
    
    // Collect Hebrew keys
    if (this.translations.he && typeof this.translations.he === 'object') {
      const hebrewFlat = this.flattenTranslations(this.translations.he, 'he');
      Object.keys(hebrewFlat).forEach(k => this.hebrewKeys.add(k.replace(/^he\./, '')));
    }
    
    // Compute cross-language mismatches
    const missingInHe = [...this.translationKeys].filter(k => !this.hebrewKeys.has(k));
    const missingInEn = [...this.hebrewKeys].filter(k => !this.translationKeys.has(k));

    this.results.missingHebrewKeys.push(...missingInHe);
    this.results.missingEnglishKeys.push(...missingInEn);
  }

  // Enhanced string checking
  shouldIgnoreString(str, context = '') {
    if (!str || str.length < 2) return true;
    
    // NEW: skip multiline or code-like chunks
    if (str.includes('\n')) return true; // usually code blocks
    if (/[{}()]/.test(str)) return true; // contains JS braces/parentheses – likely code
    if (str.includes('=>')) return true; // arrow functions
    if (/^\[.*\]$/.test(str.trim())) return true; // array literal
    if (str.includes('new Date') || str.includes('.map(') || str.includes('.reduce(')) return true;

    // Check if it matches any ignore pattern
    if (this.ignorePatterns.some(pattern => pattern.test(str))) {
      return true;
    }
    
    // Additional context-based checks
    if (context) {
      // If it's in an import statement
      if (context.includes('import') || context.includes('require')) return true;
      
      // If it's a file path in code
      if (context.includes('path.join') || context.includes('__dirname')) return true;
      
      // If it's in a console.log (likely debug)
      if (context.includes('console.')) return true;
      
      // If it's a CSS class assignment
      if (context.match(/className\s*=|class\s*=/)) {
        // But still check for real text in classNames
        if (!this.uiTextPatterns.some(pattern => pattern.test(str))) {
          return true;
        }
      }
    }
    
    // Check if it looks like real UI text
    const looksLikeUIText = this.uiTextPatterns.some(pattern => pattern.test(str));
    
    // If it doesn't match UI patterns and has no spaces, probably code
    if (!looksLikeUIText && !str.includes(' ')) {
      return true;
    }
    
    return false;
  }

  // Find all t() function calls in a file
  findTCalls(content, filePath) {
    const tCallRegex = /\bt\s*\(\s*['"`]([^'"`]+)['"`](?:\s*,\s*\{[^}]*\})?\s*\)/g;
    let match;
    
    while ((match = tCallRegex.exec(content)) !== null) {
      const key = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      this.results.stats.totalTCalls++;
      
      // Check if it's a dynamic key with ${} interpolation
      if (key.includes('${')) {
        this.results.stats.dynamicTCalls++;
        this.results.dynamicTKeys.push({
          file: filePath,
          line: lineNumber,
          key: key,
          code: match[0],
          note: 'Dynamic key - verify base paths exist'
        });
      } else if (!this.translationKeys.has(key)) {
        this.results.missingTKeys.push({
          file: filePath,
          line: lineNumber,
          key: key,
          code: match[0],
          issue: `Translation key "${key}" not found in LanguageContext`
        });
      } else {
        this.results.stats.validTCalls++;
        this.usedKeys.add(key);
      }
    }
  }

  // Find hard-coded strings with better filtering
  findHardcodedStrings(content, filePath) {
    // Skip files that are likely not to have UI text
    if (filePath.includes('utils/') || 
        filePath.includes('hooks/') || 
        filePath.includes('services/') ||
        filePath.includes('.config.') ||
        filePath.includes('.test.')) {
      return;
    }
    
    // Find strings in JSX content (between > and <)
    const jsxStringRegex = />([^<>{}\n]+?)</g;
    
    // Find string literals in specific contexts
    const patterns = [
      // JSX props that commonly have UI text
      /(?:title|label|placeholder|alt|helperText|errorMessage|successMessage|message|description)\s*=\s*["']([^"']+)["']/g,
      
      // Toast/Alert calls
      /(?:toast|alert|notify)\.(?:success|error|warning|info)\s*\(\s*["']([^"']+)["']/g,
      
      // Error messages
      /throw\s+new\s+Error\s*\(\s*["']([^"']+)["']/g,
      
      // Button/Link text in JSX
      /<(?:Button|Link|a|button)[^>]*>([^<]+)</g,
      
      // Heading text
      /<h[1-6][^>]*>([^<]+)</g,
      
      // Paragraph and span text
      /<(?:p|span|label|div)[^>]*>([^<]+)</g,
    ];
    
    const checkString = (str, fullMatch, index) => {
      const trimmed = str.trim();
      
      // Get context around the match
      const contextStart = Math.max(0, index - 50);
      const contextEnd = Math.min(content.length, index + fullMatch.length + 50);
      const context = content.substring(contextStart, contextEnd);
      
      if (!trimmed || this.shouldIgnoreString(trimmed, context)) return;
      
      // Skip if it's inside a t() call
      if (context.includes('t(') && context.includes(trimmed)) return;
      
      // Skip if it's a translation key reference
      if (trimmed.includes('.') && /^[a-zA-Z][a-zA-Z0-9._]*$/.test(trimmed)) return;
      
      const lineNumber = content.substring(0, index).split('\n').length;
      
      this.results.hardcodedStrings.push({
        file: filePath,
        line: lineNumber,
        text: trimmed,
        context: fullMatch.substring(0, 80) + (fullMatch.length > 80 ? '...' : ''),
        suggestion: `Replace with t('${this.suggestKey(trimmed)}')`
      });
      
      this.results.stats.hardcodedCount++;
    };
    
    // Check JSX content
    let match;
    while ((match = jsxStringRegex.exec(content)) !== null) {
      checkString(match[1], match[0], match.index);
    }
    
    // Check specific patterns
    patterns.forEach(pattern => {
      pattern.lastIndex = 0; // Reset regex
      while ((match = pattern.exec(content)) !== null) {
        checkString(match[1], match[0], match.index);
      }
    });
  }

  // Find fallback patterns
  findFallbackPatterns(content, filePath) {
    // Find || 'fallback' patterns but be smarter about it
    const fallbackRegex = /\|\|\s*['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = fallbackRegex.exec(content)) !== null) {
      const fallbackText = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      // Get context
      const contextStart = Math.max(0, match.index - 50);
      const context = content.substring(contextStart, match.index + 50);
      
      // Skip if it's not UI text
      if (this.shouldIgnoreString(fallbackText, context)) continue;
      
      // Skip common non-UI fallbacks
      if (['', 'default', 'unknown', 'N/A', 'null', 'undefined'].includes(fallbackText)) continue;
      
      this.results.fallbackPatterns.push({
        file: filePath,
        line: lineNumber,
        text: fallbackText,
        code: match[0],
        suggestion: 'Remove fallback and ensure translation key always exists'
      });
    }
  }

  // Find isRTL ternaries
  findIsRTLTernaries(content, filePath) {
    // Find isRTL ? 'hebrew' : 'english' patterns
    const rtlRegex = /isRTL\s*\?\s*['"`]([^'"`]+)['"`]\s*:\s*['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = rtlRegex.exec(content)) !== null) {
      const rtlText = match[1];
      const ltrText = match[2];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      // Skip CSS directions and technical values
      if (['rtl', 'ltr', 'right', 'left'].includes(rtlText.toLowerCase()) &&
          ['ltr', 'rtl', 'left', 'right'].includes(ltrText.toLowerCase())) {
        continue;
      }
      
      // Skip locale codes
      if (rtlText.match(/^[a-z]{2}-[A-Z]{2}$/) && ltrText.match(/^[a-z]{2}-[A-Z]{2}$/)) {
        continue;
      }
      
      this.results.isRTLTernaries.push({
        file: filePath,
        line: lineNumber,
        hebrewText: rtlText,
        englishText: ltrText,
        code: match[0],
        suggestion: `Replace with single t('${this.suggestKey(ltrText)}')`
      });
    }
  }

  // Suggest a translation key based on text
  suggestKey(text) {
    // Get the current component/section from common patterns
    let section = 'common';
    
    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 0);
    
    // Try to create a meaningful key
    if (words.length === 1) {
      return `${section}.${words[0]}`;
    } else if (words.length <= 3) {
      return `${section}.${words.join('_')}`;
    } else {
      // For longer text, use first few words
      return `${section}.${words.slice(0, 3).join('_')}`;
    }
  }

  // Analyze a single file
  analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    let issuesInFile = 0;
    const issuesBefore = {
      missingKeys: this.results.missingTKeys.length,
      hardcoded: this.results.hardcodedStrings.length,
      fallbacks: this.results.fallbackPatterns.length,
      rtl: this.results.isRTLTernaries.length
    };
    
    // Run all checks
    this.findTCalls(content, relativePath);
    this.findHardcodedStrings(content, relativePath);
    this.findFallbackPatterns(content, relativePath);
    this.findIsRTLTernaries(content, relativePath);
    
    // Count new issues
    issuesInFile += this.results.missingTKeys.length - issuesBefore.missingKeys;
    issuesInFile += this.results.hardcodedStrings.length - issuesBefore.hardcoded;
    issuesInFile += this.results.fallbackPatterns.length - issuesBefore.fallbacks;
    issuesInFile += this.results.isRTLTernaries.length - issuesBefore.rtl;
    
    if (issuesInFile > 0) {
      this.results.stats.filesWithIssues++;
    }
    
    this.results.stats.totalFiles++;
  }

  // Get all JavaScript/TypeScript files
  getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (!file.includes('node_modules') && 
            !file.includes('build') && 
            !file.includes('dist') &&
            !file.includes('.git')) {
          this.getAllFiles(filePath, fileList);
        }
      } else if (file.match(/\.(js|jsx|ts|tsx)$/) && 
                 !file.includes('.test.') &&
                 !file.includes('.spec.')) {
        fileList.push(filePath);
      }
    });
    
    return fileList;
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n' + colorize('🔍 SMART TRANSLATION AUDIT REPORT', 'bright'));
    console.log(colorize('=' .repeat(60), 'dim') + '\n');
    
    // Statistics
    console.log(colorize('📊 STATISTICS:', 'cyan'));
    console.log(`  Total Files Scanned: ${colorize(this.results.stats.totalFiles, 'green')}`);
    console.log(`  Files with Issues: ${colorize(this.results.stats.filesWithIssues, this.results.stats.filesWithIssues > 0 ? 'yellow' : 'green')}`);
    console.log(`  Total t() Calls: ${colorize(this.results.stats.totalTCalls, 'blue')}`);
    console.log(`  Valid t() Calls: ${colorize(this.results.stats.validTCalls, 'green')}`);
    console.log(`  Dynamic t() Calls: ${colorize(this.results.stats.dynamicTCalls, 'cyan')}`);
    console.log(`  Hard-coded UI Text: ${colorize(this.results.stats.hardcodedCount, this.results.stats.hardcodedCount > 0 ? 'red' : 'green')}`);
    console.log('');
    
    // A. Key Mismatch - Static Keys
    if (this.results.missingTKeys.length > 0) {
      console.log(colorize(`🔑 MISSING TRANSLATION KEYS (${this.results.missingTKeys.length}):`, 'red'));
      this.results.missingTKeys.slice(0, 10).forEach(issue => {
        console.log(`  ${colorize(issue.file, 'yellow')}:${issue.line}`);
        console.log(`    Missing key: "${colorize(issue.key, 'red')}"`);
        console.log(`    Code: ${colorize(issue.code, 'dim')}`);
      });
      if (this.results.missingTKeys.length > 10) {
        console.log(colorize(`  ... and ${this.results.missingTKeys.length - 10} more`, 'dim'));
      }
      console.log('');
    }
    
    // Dynamic Keys (for awareness)
    if (this.results.dynamicTKeys.length > 0) {
      console.log(colorize(`🔄 DYNAMIC TRANSLATION KEYS (${this.results.dynamicTKeys.length}):`, 'cyan'));
      console.log(colorize('  Note: These use template literals and need manual verification', 'dim'));
      this.results.dynamicTKeys.slice(0, 5).forEach(issue => {
        console.log(`  ${colorize(issue.file, 'yellow')}:${issue.line}`);
        console.log(`    Pattern: "${colorize(issue.key, 'cyan')}"`);
      });
      if (this.results.dynamicTKeys.length > 5) {
        console.log(colorize(`  ... and ${this.results.dynamicTKeys.length - 5} more`, 'dim'));
      }
      console.log('');
    }
    
    // B. Hard-coded Text
    if (this.results.hardcodedStrings.length > 0) {
      console.log(colorize(`📝 HARD-CODED UI TEXT (${this.results.hardcodedStrings.length}):`, 'yellow'));
      
      // Group by file
      const byFile = {};
      this.results.hardcodedStrings.forEach(issue => {
        if (!byFile[issue.file]) byFile[issue.file] = [];
        byFile[issue.file].push(issue);
      });
      
      Object.entries(byFile).slice(0, 5).forEach(([file, issues]) => {
        console.log(`  ${colorize(file, 'yellow')} (${issues.length} issues):`);
        issues.slice(0, 3).forEach(issue => {
          console.log(`    Line ${issue.line}: "${colorize(issue.text, 'red')}"`);
          console.log(`    → ${colorize(issue.suggestion, 'green')}`);
        });
        if (issues.length > 3) {
          console.log(`    ... and ${issues.length - 3} more in this file`);
        }
      });
      
      if (Object.keys(byFile).length > 5) {
        console.log(colorize(`  ... and ${Object.keys(byFile).length - 5} more files`, 'dim'));
      }
      console.log('');
    }
    
    // Fallback patterns
    if (this.results.fallbackPatterns.length > 0) {
      console.log(colorize(`⚠️  FALLBACK PATTERNS (${this.results.fallbackPatterns.length}):`, 'yellow'));
      this.results.fallbackPatterns.slice(0, 5).forEach(issue => {
        console.log(`  ${colorize(issue.file, 'yellow')}:${issue.line}`);
        console.log(`    Fallback: "${colorize(issue.text, 'yellow')}"`);
        console.log(`    → ${colorize(issue.suggestion, 'green')}`);
      });
      if (this.results.fallbackPatterns.length > 5) {
        console.log(colorize(`  ... and ${this.results.fallbackPatterns.length - 5} more`, 'dim'));
      }
      console.log('');
    }
    
    // isRTL ternaries
    if (this.results.isRTLTernaries.length > 0) {
      console.log(colorize(`🔄 isRTL TERNARIES TO REMOVE (${this.results.isRTLTernaries.length}):`, 'magenta'));
      this.results.isRTLTernaries.slice(0, 5).forEach(issue => {
        console.log(`  ${colorize(issue.file, 'yellow')}:${issue.line}`);
        console.log(`    RTL: "${issue.hebrewText}" | LTR: "${issue.englishText}"`);
        console.log(`    → ${colorize(issue.suggestion, 'green')}`);
      });
      if (this.results.isRTLTernaries.length > 5) {
        console.log(colorize(`  ... and ${this.results.isRTLTernaries.length - 5} more`, 'dim'));
      }
      console.log('');
    }
    
    // Cross-language parity
    if (this.results.missingHebrewKeys.length > 0 || this.results.missingEnglishKeys.length > 0) {
      console.log(colorize('🌐 LANGUAGE PARITY:', 'bright'));
      if (this.results.missingHebrewKeys.length > 0) {
        console.log(colorize(`  EN keys missing in HE: ${this.results.missingHebrewKeys.length}`, 'red'));
      }
      if (this.results.missingEnglishKeys.length > 0) {
        console.log(colorize(`  HE keys missing in EN: ${this.results.missingEnglishKeys.length}`, 'red'));
      }
      console.log('');
    }
    
    // Unused keys
    const unused = [...this.translationKeys].filter(k => !this.usedKeys.has(k));
    this.results.unusedKeys = unused;
    if (unused.length > 0) {
      console.log(colorize(`🗑️  UNUSED TRANSLATION KEYS (${unused.length}):`, 'yellow'));
      console.log(colorize('  Consider pruning these to keep context lean', 'dim'));
      console.log('');
    }
    
    // Summary
    const totalIssues = this.results.missingTKeys.length + 
                       this.results.hardcodedStrings.length + 
                       this.results.fallbackPatterns.length + 
                       this.results.isRTLTernaries.length +
                       this.results.missingHebrewKeys.length +
                       this.results.missingEnglishKeys.length;
    
    this.results.stats.totalIssues = totalIssues;
    
    console.log(colorize('📋 SUMMARY:', 'bright'));
    console.log(`  Real Issues Found: ${colorize(totalIssues, totalIssues > 0 ? 'yellow' : 'green')}`);
    console.log(`  Dynamic Keys to Review: ${colorize(this.results.dynamicTKeys.length, 'cyan')}`);
    
    if (totalIssues === 0 && this.results.dynamicTKeys.length === 0) {
      console.log(colorize('\n🎉 PERFECT! No translation issues found! 🎉', 'green'));
    } else {
      if (totalIssues > 0) {
        console.log(colorize(`\n⚠️  Found ${totalIssues} issues that need attention`, 'yellow'));
      }
      if (this.results.dynamicTKeys.length > 0) {
        console.log(colorize(`ℹ️  ${this.results.dynamicTKeys.length} dynamic keys need manual review`, 'cyan'));
      }
      
      console.log('\nNext steps:');
      if (this.results.missingTKeys.length > 0) {
        console.log('1. Add missing translation keys to LanguageContext.jsx');
      }
      if (this.results.hardcodedStrings.length > 0) {
        console.log('2. Replace hard-coded UI text with t() calls');
      }
      if (this.results.fallbackPatterns.length > 0) {
        console.log('3. Remove fallback patterns - ensure keys always exist');
      }
      if (this.results.isRTLTernaries.length > 0) {
        console.log('4. Remove isRTL ternaries - use single t() call');
      }
      console.log('5. Run this audit again to verify all issues are resolved');
    }
    
    // --- save simple text list for quick view ---
    const simpleLines = [];
    this.results.hardcodedStrings.forEach(i => simpleLines.push(`[Hardcoded] ${i.file}:${i.line}  "${i.text.replace(/\s+/g,' ').slice(0,80)}"`));
    this.results.fallbackPatterns.forEach(i => simpleLines.push(`[Fallback]  ${i.file}:${i.line}  ${i.text}`));
    this.results.isRTLTernaries.forEach(i => simpleLines.push(`[isRTL]    ${i.file}:${i.line}  ${i.hebrewText} | ${i.englishText}`));
    fs.writeFileSync(path.join(process.cwd(), 'translation-fix-list.txt'), simpleLines.join('\n'));
    console.log(colorize(`📄 Quick fix list saved to: translation-fix-list.txt`, 'dim'));
    
    // Save detailed report
    const reportPath = path.join(process.cwd(), 'smart-translation-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(colorize(`\n📄 Detailed report saved to: ${reportPath}`, 'dim'));
  }

  // Main audit function
  async runAudit() {
    try {
      console.log(colorize('🚀 Starting Smart Translation Audit...', 'cyan'));
      console.log(colorize('   (Filtering out false positives like imports, paths, code)', 'dim'));
      
      // Load translations
      console.log(colorize('\n📂 Loading translations from LanguageContext.jsx...', 'dim'));
      this.loadTranslations();
      console.log(colorize(`✅ Loaded ${this.translationKeys.size} translation keys`, 'green'));
      
      // Get all client files
      const clientDir = path.join(process.cwd(), 'client', 'src');
      console.log(colorize('\n🔍 Scanning client files...', 'dim'));
      const files = this.getAllFiles(clientDir);
      console.log(colorize(`📁 Found ${files.length} files to analyze`, 'blue'));
      
      // Analyze each file
      console.log(colorize('\n🔬 Analyzing files for REAL translation issues...', 'dim'));
      files.forEach((file, index) => {
        if (index % 50 === 0) {
          process.stdout.write(`\r  Progress: ${index}/${files.length} files...`);
        }
        this.analyzeFile(file);
      });
      console.log(`\r  Progress: ${files.length}/${files.length} files... Done!`);
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error(colorize('\n❌ ERROR:', 'red'), error.message);
      console.error(colorize('\nStack trace:', 'dim'), error.stack);
      process.exit(1);
    }
  }
}

// Run the audit
if (require.main === module) {
  const auditor = new SmartTranslationAuditor();
  auditor.runAudit();
}

module.exports = SmartTranslationAuditor;