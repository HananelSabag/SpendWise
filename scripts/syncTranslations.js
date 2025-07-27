#!/usr/bin/env node
/*
 * syncTranslations.js
 *
 * Creates a clean, duplicate-free, fully-synchronised copy of LanguageContext.jsx
 *   • Removes duplicate keys (keeps first occurrence)
 *   • Copies missing keys between English (root) and Hebrew (translations.he)
 *   • Outputs a new file at client/src/context/LanguageContext_synced.jsx for manual review.
 *
 * NOTE: Does NOT overwrite the original file.
 */

const fs = require('fs');
const path = require('path');
const recast = require('recast');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const babelParser = require('recast/parsers/babel');

const LANGUAGE_PATH = path.join(__dirname, '..', 'client', 'src', 'context', 'LanguageContext.jsx');
const OUTPUT_PATH = path.join(__dirname, '..', 'client', 'src', 'context', 'LanguageContext_synced.jsx');

function extractObject(node) {
  const obj = {};
  node.properties.forEach((prop) => {
    const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value;
    if (prop.value.type === 'ObjectExpression') {
      obj[key] = extractObject(prop.value);
    } else if (prop.value.type === 'StringLiteral') {
      obj[key] = prop.value.value;
    } else {
      // For unsupported node types, stringify
      obj[key] = recast.print(prop.value).code;
    }
  });
  return obj;
}

function buildObjectExpression(obj) {
  const t = require('@babel/types');
  const props = Object.keys(obj).map((key) => {
    const value = obj[key];
    let valueNode;
    if (typeof value === 'object' && value !== null) {
      valueNode = buildObjectExpression(value);
    } else {
      valueNode = t.stringLiteral(String(value));
    }
    return t.objectProperty(t.stringLiteral(key), valueNode);
  });
  return t.objectExpression(props);
}

function mergeDeep(target, source) {
  for (const key of Object.keys(source)) {
    if (!(key in target)) {
      target[key] = source[key];
    } else if (
      typeof target[key] === 'object' &&
      target[key] !== null &&
      typeof source[key] === 'object'
    ) {
      mergeDeep(target[key], source[key]);
    }
  }
}

function removeDuplicates(obj) {
  // Recursively ensure only unique keys (object property names are unique by definition)
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      obj[key] = removeDuplicates(obj[key]);
    }
  }
  return obj;
}

function main() {
  const code = fs.readFileSync(LANGUAGE_PATH, 'utf8');
  const ast = recast.parse(code, { parser: babelParser });

  let translationsPath = null;
  traverse(ast, {
    VariableDeclarator(path) {
      if (path.node.id.name === 'translations') {
        translationsPath = path;
      }
    },
  });
  if (!translationsPath) {
    console.error('Could not find translations object');
    process.exit(1);
  }

  const translationsNode = translationsPath.node.init;
  const translationsObj = extractObject(translationsNode);

  // Separate english (root) and hebrew
  const english = { ...translationsObj };
  delete english.he;
  const hebrew = translationsObj.he || {};

  // Remove duplicates implicitly by object nature + deep cleanup
  removeDuplicates(english);
  removeDuplicates(hebrew);

  // Copy missing keys
  mergeDeep(hebrew, english); // ensure hebrew has all english keys (copies strings)
  mergeDeep(english, hebrew); // ensure english has all hebrew keys (copies hebrew strings)

  // Build new translations object
  const t = require('@babel/types');
  const newTranslationsNode = t.variableDeclaration('const', [
    t.variableDeclarator(
      t.identifier('translations'),
      t.objectExpression([
        ...Object.keys(english).map((key) =>
          t.objectProperty(
            t.stringLiteral(key),
            typeof english[key] === 'object'
              ? buildObjectExpression(english[key])
              : t.stringLiteral(String(english[key]))
          )
        ),
        t.objectProperty(t.identifier('he'), buildObjectExpression(hebrew)),
      ])
    ),
  ]);

  // Replace original variable declaration
  translationsPath.parentPath.replaceWith(newTranslationsNode);

  const output = recast.print(ast).code;
  fs.writeFileSync(OUTPUT_PATH, output, 'utf8');
  console.log(`✅ Synced translations written to ${path.relative(process.cwd(), OUTPUT_PATH)}`);
}

if (require.main === module) {
  main();
} 