import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  publicDir: false, // Disable public directory to avoid conflict
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/interfaces/widget/index.tsx'),
      name: 'NextWidget',
      fileName: () => 'widget.js',
      formats: ['iife'],
    },
    outDir: 'public',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        // Ensure React is bundled
        inlineDynamicImports: true,
        // Global variable name for the widget
        name: 'NextWidget',
        // Extend window.NextWidget
        extend: true,
        // Fix the named/default exports warning
        exports: 'named',
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debug mode
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
