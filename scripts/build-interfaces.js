#!/usr/bin/env node
/**
 * Build Interfaces Script
 * Discovers and builds interfaces in src/interfaces/
 * Each interface is built to public/bundles/<name>.js as an IIFE bundle
 *
 * Usage:
 *   npm run build:interfaces              # Build all interfaces
 *   npm run build:interfaces -- --only=widget,dashboard  # Build specific interfaces
 *   npm run build:interfaces -- --changed # Build only changed interfaces
 *   npm run build:interfaces -- --force   # Force rebuild all
 */

const { build } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

/**
 * Parse command line arguments
 */
function parseArgs(args) {
  const result = {
    only: null,
    changed: false,
    force: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--only=')) {
      result.only = arg.slice(7).split(',').map((s) => s.trim());
    } else if (arg === '--changed') {
      result.changed = true;
    } else if (arg === '--force') {
      result.force = true;
    }
  }

  return result;
}

/**
 * Discover all interfaces in src/interfaces/
 * Excludes _template and directories without index.tsx
 */
async function discoverInterfaces() {
  const interfacesDir = path.resolve(__dirname, '../src/interfaces');
  const interfaces = [];

  if (!fs.existsSync(interfacesDir)) {
    console.error('Error: src/interfaces/ directory not found');
    process.exit(1);
  }

  const entries = fs.readdirSync(interfacesDir);

  for (const entry of entries) {
    // Skip template and hidden directories
    if (entry.startsWith('_') || entry.startsWith('.')) continue;

    const entryPath = path.resolve(interfacesDir, entry);
    if (!fs.statSync(entryPath).isDirectory()) continue;

    // Check for index.tsx
    const indexPath = path.resolve(entryPath, 'index.tsx');
    if (!fs.existsSync(indexPath)) continue;

    // Convert kebab-case to PascalCase for global name
    let globalName = entry
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');

    // Special case: "widget" -> "NextWidget" for backward compatibility
    if (entry === 'widget') {
      globalName = 'NextWidget';
    }

    interfaces.push({
      name: entry,
      entry: indexPath,
      globalName,
    });
  }

  return interfaces;
}

/**
 * Get changed interfaces using the detection script
 */
function getChangedInterfaces() {
  try {
    const result = execSync('node scripts/detect-changed-interfaces.js', {
      encoding: 'utf-8',
      cwd: path.resolve(__dirname, '..'),
    });
    return JSON.parse(result.trim());
  } catch (error) {
    console.error('Error detecting changes:', error.message);
    return null;
  }
}

/**
 * Generate manifest after successful build
 */
function generateManifest() {
  try {
    execSync('node scripts/generate-bundle-manifest.js', {
      encoding: 'utf-8',
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Warning: Failed to generate manifest:', error.message);
  }
}

/**
 * Build a single interface
 */
async function buildInterface(iface) {
  console.log(
    `\nBuilding ${iface.name} -> public/bundles/${iface.name}.js (global: ${iface.globalName})`
  );

  await build({
    configFile: false,
    plugins: [react.default()],
    publicDir: false,
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
      lib: {
        entry: iface.entry,
        name: iface.globalName,
        fileName: () => `${iface.name}.js`,
        formats: ['iife'],
      },
      outDir: 'public/bundles',
      emptyOutDir: false, // Don't clear between builds
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
          name: iface.globalName,
          extend: true,
          exports: 'named',
        },
      },
      minify: 'terser',
      terserOptions: {
        compress: { drop_console: false },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../src'),
      },
    },
    logLevel: 'warn',
  });

  // Get file size
  const outputPath = path.resolve(__dirname, '../public/bundles', `${iface.name}.js`);
  const stats = fs.statSync(outputPath);
  const sizeKB = Math.round(stats.size / 1024);

  console.log(`  Built ${iface.name}.js (${sizeKB} KB)`);
}

/**
 * Main build function
 */
async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log('Discovering interfaces...');
  let interfaces = await discoverInterfaces();

  if (interfaces.length === 0) {
    console.log('No interfaces found to build.');
    return;
  }

  console.log(
    `Found ${interfaces.length} interface(s): ${interfaces.map((i) => i.name).join(', ')}`
  );

  // Filter interfaces based on arguments
  let interfacesToBuild = interfaces;
  let skipBuild = false;

  if (args.changed && !args.force) {
    // Build only changed interfaces
    const changedNames = getChangedInterfaces();

    if (changedNames === null) {
      console.log('Warning: Could not detect changes, building all interfaces');
    } else if (changedNames.length === 0) {
      console.log('\nNo interfaces changed, skipping build.');
      skipBuild = true;
    } else {
      console.log(`\nChanged interfaces: ${changedNames.join(', ')}`);
      interfacesToBuild = interfaces.filter((i) => changedNames.includes(i.name));
    }
  } else if (args.only && !args.force) {
    // Build only specified interfaces
    const requestedNames = args.only;
    const validNames = interfaces.map((i) => i.name);
    const invalidNames = requestedNames.filter((n) => !validNames.includes(n));

    if (invalidNames.length > 0) {
      console.error(`Error: Unknown interface(s): ${invalidNames.join(', ')}`);
      console.error(`Available: ${validNames.join(', ')}`);
      process.exit(1);
    }

    interfacesToBuild = interfaces.filter((i) => requestedNames.includes(i.name));
    console.log(`\nBuilding specified interfaces: ${requestedNames.join(', ')}`);
  } else if (args.force) {
    console.log('\nForce rebuilding all interfaces...');
  }

  if (skipBuild) {
    return;
  }

  // Ensure output directory exists
  const bundlesDir = path.resolve(__dirname, '../public/bundles');
  if (!fs.existsSync(bundlesDir)) {
    fs.mkdirSync(bundlesDir, { recursive: true });
  }

  // Clear existing bundles only if building all (not selective)
  if (!args.only && !args.changed) {
    const existingFiles = fs.readdirSync(bundlesDir);
    for (const file of existingFiles) {
      if (file.endsWith('.js') || file.endsWith('.js.map')) {
        fs.unlinkSync(path.resolve(bundlesDir, file));
      }
    }
  }

  // Build each interface
  for (const iface of interfacesToBuild) {
    await buildInterface(iface);
  }

  console.log(`\n${interfacesToBuild.length} interface(s) built successfully!`);
  console.log(`Output: public/bundles/`);

  // Generate manifest after successful build
  console.log('');
  generateManifest();
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
