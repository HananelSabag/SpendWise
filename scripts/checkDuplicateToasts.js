#!/usr/bin/env node
/*
 * checkDuplicateToasts.js ― Simple static checker that reports identical toast
 * messages (literal strings) used more than once across the client codebase.
 *
 * How it works:
 * 1. Scans all .js/.jsx/.ts/.tsx files under client/src (excluding backup folders).
 * 2. Uses regex to capture string literals passed as the first argument to
 *    toastService.<method>() or toast.<method>() calls.
 * 3. Aggregates occurrences and prints any messages that appear in more than
 *    one location (file + line).
 *
 * Limitations:
 * • Only detects duplicate *literal* strings – dynamic translations via t() can
 *   still be flagged if the key is passed as a literal (e.g. t('toast.success')),
 *   but runtime-generated strings are ignored.
 * • Does not analyse call-graphs; it just checks source appearances.
 *
 * Usage:
 *   node scripts/checkDuplicateToasts.js
 *
 * (You can also add an npm script: "npm run check:toasts")
 */

const glob = require('glob');
const fs = require('fs');
const path = require('path');

// Regex patterns that capture: toastService.success('message') / toast.success("msg")
// Group 3 contains the message string.
const CALL_PATTERNS = [
  /toastService\.(success|error|info|warning|loading)\s*\(\s*(["'`])([^"'`]+?)\2/gi,
  /toast\.(success|error|info|warning|loading)\s*\(\s*(["'`])([^"'`]+?)\2/gi,
];

// Collect { message: [{ file, line }] }
const messages = new Map();

function recordMatch({ file, line, message }) {
  if (!messages.has(message)) {
    messages.set(message, []);
  }
  messages.get(message).push({ file, line });
}

function scanFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  CALL_PATTERNS.forEach((regex) => {
    // Reset regex state for each file
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const [, , , message] = match; // message is in capture group 3
      // Compute line number where match starts
      const uptoMatch = content.slice(0, match.index);
      const line = uptoMatch.split('\n').length;
      recordMatch({ file, line, message });
    }
  });
}

// Search pattern – exclude backup dirs
const FILE_GLOB = 'client/src/**/*.{js,jsx,ts,tsx}';
const IGNORE_GLOB = '**/backup*/**';

const filePaths = glob.sync(FILE_GLOB, { ignore: IGNORE_GLOB, nodir: true });
filePaths.forEach(scanFile);

let duplicatesFound = false;

messages.forEach((occurrences, message) => {
  if (occurrences.length > 1) {
    duplicatesFound = true;
    console.log(`\nDuplicate toast message: "${message}" (used ${occurrences.length} times)`);
    occurrences.forEach(({ file, line }) => {
      console.log(`  ↳ ${path.relative(process.cwd(), file)}:${line}`);
    });
  }
});

if (!duplicatesFound) {
  console.log('🎉  No duplicate toast messages found.');
} 