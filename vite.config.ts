import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      external: ['react'],
      output: {
        globals: {
          react: 'React'
        }
      }
    }
  },
  resolve: {
    alias: {
      'react': 'react',
      'react-dom': 'react-dom',
      'chart.js': 'chart.js',
      'react-chartjs-2': 'react-chartjs-2'
    },
    dedupe: ['react', 'react-dom', 'chart.js', 'react-chartjs-2']
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'chart.js', 'react-chartjs-2']
  }
});
