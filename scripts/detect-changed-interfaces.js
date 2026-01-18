#!/usr/bin/env node
/**
 * Detects which interfaces have changed since the last successful build.
 * Compares current file hashes against a stored manifest.
 *
 * Usage: node scripts/detect-changed-interfaces.js
 * Output: JSON array of changed interface names to stdout
 *
 * Exit codes:
 *   0 - Success (outputs changed interfaces)
 *   1 - Error
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const INTERFACES_DIR = path.resolve(__dirname, '../src/interfaces');
const SHARED_DIR = path.resolve(__dirname, '../src/shared');
const VITE_CONFIG = path.resolve(__dirname, '../vite.widget.config.ts');
const MANIFEST_PATH = path.resolve(__dirname, '../public/bundles/manifest.json');

/**
 * Calculate hash of a file's contents
 */
function hashFile(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      getAllFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Calculate combined hash of all files in a directory
 */
function hashDirectory(dir) {
  const files = getAllFiles(dir).sort();
  const hash = crypto.createHash('sha256');

  for (const file of files) {
    const fileHash = hashFile(file);
    if (fileHash) {
      // Include relative path in hash so file moves are detected
      const relativePath = path.relative(dir, file);
      hash.update(`${relativePath}:${fileHash}`);
    }
  }

  return hash.digest('hex');
}

/**
 * Calculate hash for shared dependencies
 */
function calculateSharedHash() {
  const hash = crypto.createHash('sha256');

  // Hash shared directory
  const sharedHash = hashDirectory(SHARED_DIR);
  hash.update(`shared:${sharedHash}`);

  // Hash vite config
  const viteHash = hashFile(VITE_CONFIG);
  if (viteHash) {
    hash.update(`vite:${viteHash}`);
  }

  return hash.digest('hex');
}

/**
 * Discover all interfaces in src/interfaces/
 */
function discoverInterfaces() {
  if (!fs.existsSync(INTERFACES_DIR)) {
    console.error('Error: src/interfaces/ directory not found');
    process.exit(1);
  }

  const interfaces = [];
  const entries = fs.readdirSync(INTERFACES_DIR);

  for (const entry of entries) {
    // Skip template and hidden directories
    if (entry.startsWith('_') || entry.startsWith('.')) continue;

    const entryPath = path.join(INTERFACES_DIR, entry);
    if (!fs.statSync(entryPath).isDirectory()) continue;

    // Check for index.tsx
    const indexPath = path.join(entryPath, 'index.tsx');
    if (!fs.existsSync(indexPath)) continue;

    interfaces.push({
      name: entry,
      path: entryPath,
    });
  }

  return interfaces;
}

/**
 * Load the existing manifest
 */
function loadManifest() {
  try {
    if (!fs.existsSync(MANIFEST_PATH)) {
      return null;
    }
    const content = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading manifest:', error.message);
    return null;
  }
}

/**
 * Main detection logic
 */
function detectChanges() {
  const interfaces = discoverInterfaces();
  const manifest = loadManifest();
  const currentSharedHash = calculateSharedHash();

  // If no manifest exists, all interfaces are considered changed
  if (!manifest) {
    return {
      changedInterfaces: interfaces.map((i) => i.name),
      reason: 'No manifest found - all interfaces need building',
      sharedChanged: false,
    };
  }

  // If shared files changed, all interfaces need rebuilding
  if (manifest.sharedHash !== currentSharedHash) {
    return {
      changedInterfaces: interfaces.map((i) => i.name),
      reason: 'Shared dependencies changed - all interfaces need rebuilding',
      sharedChanged: true,
    };
  }

  // Check each interface for changes
  const changedInterfaces = [];

  for (const iface of interfaces) {
    const currentHash = hashDirectory(iface.path);
    const manifestEntry = manifest.bundles?.[iface.name];

    if (!manifestEntry) {
      // New interface not in manifest
      changedInterfaces.push(iface.name);
    } else if (manifestEntry.sourceHash !== currentHash) {
      // Interface files changed
      changedInterfaces.push(iface.name);
    }
  }

  return {
    changedInterfaces,
    reason:
      changedInterfaces.length > 0
        ? `${changedInterfaces.length} interface(s) changed`
        : 'No changes detected',
    sharedChanged: false,
  };
}

// Main execution
try {
  const result = detectChanges();

  // Output JSON array to stdout (for script consumption)
  console.log(JSON.stringify(result.changedInterfaces));

  // Output human-readable info to stderr (won't interfere with JSON output)
  if (process.argv.includes('--verbose') || process.argv.includes('-v')) {
    console.error('');
    console.error('Change Detection Results:');
    console.error(`  Reason: ${result.reason}`);
    console.error(`  Shared changed: ${result.sharedChanged}`);
    console.error(`  Changed interfaces: ${result.changedInterfaces.join(', ') || 'none'}`);
  }
} catch (error) {
  console.error('Error detecting changes:', error.message);
  process.exit(1);
}
