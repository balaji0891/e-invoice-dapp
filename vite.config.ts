import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src'),
    },
  },
  root: './frontend',
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    fs: {
      allow: ['..'],
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: [],
    include: [
      '@zama-fhe/relayer-sdk/web',
      'keccak',
      'secp256k1',
    ],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  define: {
    'global': 'globalThis',
  },
  assetsInclude: ['**/*.wasm'],
});
