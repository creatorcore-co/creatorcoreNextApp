#!/usr/bin/env node
/**
 * Build Interfaces Script
 * Discovers and builds all interfaces in src/interfaces/
 * Each interface is built to public/bundles/<name>.js as an IIFE bundle
 */

const { build } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');
const fs = require('fs');

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
  console.log('Discovering interfaces...');
  const interfaces = await discoverInterfaces();

  if (interfaces.length === 0) {
    console.log('No interfaces found to build.');
    return;
  }

  console.log(
    `Found ${interfaces.length} interface(s): ${interfaces.map((i) => i.name).join(', ')}`
  );

  // Ensure output directory exists
  const bundlesDir = path.resolve(__dirname, '../public/bundles');
  if (!fs.existsSync(bundlesDir)) {
    fs.mkdirSync(bundlesDir, { recursive: true });
  }

  // Clear existing bundles
  const existingFiles = fs.readdirSync(bundlesDir);
  for (const file of existingFiles) {
    if (file.endsWith('.js') || file.endsWith('.js.map')) {
      fs.unlinkSync(path.resolve(bundlesDir, file));
    }
  }

  // Build each interface
  for (const iface of interfaces) {
    await buildInterface(iface);
  }

  console.log('\nAll interfaces built successfully!');
  console.log(`Output: public/bundles/`);
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
