#!/usr/bin/env node
/**
 * Create Interface CLI
 * Scaffolds a new interface from the _template directory
 *
 * Usage: node scripts/create-interface.js <interface-name>
 */

const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage: npm run create-interface <interface-name>

Creates a new interface from the template.

Examples:
  npm run create-interface dashboard
  npm run create-interface user-profile
  npm run create-interface PaymentForm

The name will be converted to:
  - kebab-case for directory and CSS classes
  - PascalCase for component and type names
  - camelCase for variables (if needed)

Options:
  --help, -h    Show this help message
`);
  process.exit(0);
}

const inputName = args[0];

// Validate input
if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(inputName)) {
  console.error(
    'Error: Interface name must start with a letter and contain only letters, numbers, hyphens, and underscores.'
  );
  process.exit(1);
}

// Name conversions
function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function toPascalCase(str) {
  return toKebabCase(str)
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

const kebabName = toKebabCase(inputName);
const pascalName = toPascalCase(inputName);
const camelName = toCamelCase(inputName);
const currentDate = new Date().toISOString().split('T')[0];

console.log(`\nCreating interface: ${pascalName}`);
console.log(`  Directory: src/interfaces/${kebabName}/`);
console.log(`  Global name: window.${pascalName}`);
console.log(`  Event prefix: ${kebabName}:`);

// Paths
const templateDir = path.resolve(__dirname, '../src/interfaces/_template');
const targetDir = path.resolve(__dirname, '../src/interfaces', kebabName);

// Check template exists
if (!fs.existsSync(templateDir)) {
  console.error(`\nError: Template directory not found at ${templateDir}`);
  console.error('Make sure src/interfaces/_template/ exists.');
  process.exit(1);
}

// Check target doesn't exist
if (fs.existsSync(targetDir)) {
  console.error(`\nError: Interface "${kebabName}" already exists at ${targetDir}`);
  process.exit(1);
}

// Placeholder replacements
const replacements = {
  '{{INTERFACE_NAME}}': pascalName,
  '{{INTERFACE_NAME_KEBAB}}': kebabName,
  '{{INTERFACE_NAME_CAMEL}}': camelName,
  '{{DATE}}': currentDate,
};

// Copy and transform files
function processFile(srcPath, destPath) {
  let content = fs.readFileSync(srcPath, 'utf8');

  for (const [placeholder, value] of Object.entries(replacements)) {
    content = content.split(placeholder).join(value);
  }

  fs.writeFileSync(destPath, content);
}

function copyDirectory(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      processFile(srcPath, destPath);
      console.log(`  Created: ${path.relative(process.cwd(), destPath)}`);
    }
  }
}

// Execute
try {
  console.log('\nCreating files...');
  copyDirectory(templateDir, targetDir);

  console.log(`
Interface created successfully!

Next steps:
  1. Edit src/interfaces/${kebabName}/Component.tsx to build your UI
  2. Edit src/interfaces/${kebabName}/styles.ts for custom styling
  3. Edit src/interfaces/${kebabName}/types.ts if you need custom props
  4. Run "npm run build:interfaces" to build all interfaces
  5. Your bundle will be at public/bundles/${kebabName}.js

Bundle URL:
  https://creatorcore-next-app.vercel.app/bundles/${kebabName}.js
`);
} catch (error) {
  console.error('\nError creating interface:', error.message);
  process.exit(1);
}
