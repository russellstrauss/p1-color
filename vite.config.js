import { defineConfig } from 'vite';

export default defineConfig({
  // config options
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          vendor: ['dat.gui']
        }
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
