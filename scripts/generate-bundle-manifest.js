#!/usr/bin/env node
/**
 * Generates a manifest of all built bundles with their file hashes.
 * Run after successful builds to track bundle versions.
 *
 * Usage: node scripts/generate-bundle-manifest.js
 * Output: Creates/updates public/bundles/manifest.json
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const INTERFACES_DIR = path.resolve(__dirname, '../src/interfaces');
const SHARED_DIR = path.resolve(__dirname, '../src/shared');
const VITE_CONFIG = path.resolve(__dirname, '../vite.widget.config.ts');
const BUNDLES_DIR = path.resolve(__dirname, '../public/bundles');
const MANIFEST_PATH = path.join(BUNDLES_DIR, 'manifest.json');

/**
 * Calculate hash of a file's contents
 */
function hashFile(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (error) {
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

  const sharedHash = hashDirectory(SHARED_DIR);
  hash.update(`shared:${sharedHash}`);

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
    return [];
  }

  const interfaces = [];
  const entries = fs.readdirSync(INTERFACES_DIR);

  for (const entry of entries) {
    if (entry.startsWith('_') || entry.startsWith('.')) continue;

    const entryPath = path.join(INTERFACES_DIR, entry);
    if (!fs.statSync(entryPath).isDirectory()) continue;

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
 * Get bundle file info
 */
function getBundleInfo(interfaceName) {
  const bundlePath = path.join(BUNDLES_DIR, `${interfaceName}.js`);

  if (!fs.existsSync(bundlePath)) {
    return null;
  }

  const stats = fs.statSync(bundlePath);

  return {
    bundleFile: `${interfaceName}.js`,
    bundleSize: stats.size,
    builtAt: stats.mtime.toISOString(),
  };
}

/**
 * Generate the manifest
 */
function generateManifest() {
  const interfaces = discoverInterfaces();
  const sharedHash = calculateSharedHash();
  const bundles = {};

  for (const iface of interfaces) {
    const sourceHash = hashDirectory(iface.path);
    const bundleInfo = getBundleInfo(iface.name);

    if (bundleInfo) {
      bundles[iface.name] = {
        sourceHash,
        ...bundleInfo,
      };
    }
  }

  const manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    sharedHash,
    bundles,
  };

  return manifest;
}

/**
 * Write manifest to file
 */
function writeManifest(manifest) {
  // Ensure bundles directory exists
  if (!fs.existsSync(BUNDLES_DIR)) {
    fs.mkdirSync(BUNDLES_DIR, { recursive: true });
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
}

// Main execution
try {
  console.log('Generating bundle manifest...');

  const manifest = generateManifest();
  writeManifest(manifest);

  console.log(`Manifest generated at: ${MANIFEST_PATH}`);
  console.log(`  Version: ${manifest.version}`);
  console.log(`  Generated: ${manifest.generatedAt}`);
  console.log(`  Bundles: ${Object.keys(manifest.bundles).length}`);

  for (const [name, info] of Object.entries(manifest.bundles)) {
    const sizeKB = Math.round(info.bundleSize / 1024);
    console.log(`    - ${name}: ${info.bundleFile} (${sizeKB} KB)`);
  }
} catch (error) {
  console.error('Error generating manifest:', error.message);
  process.exit(1);
}
