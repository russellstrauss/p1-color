import { defineConfig } from 'vite';

export default defineConfig({
  base: '',
  // config options
  build: {
    outDir: 'dist',
    assetsDir: '', // Put assets in the root of dist
    rollupOptions: {
      output: {
        // Use default chunking to avoid manual chunk issues
      }
    },
    chunkSizeWarningLimit: 1000
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  }
});
