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
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        },
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom', 'chart.js', 'react-chartjs-2']
        }
      }
    }
  },
  resolve: {
    alias: {
      'react': '/node_modules/react',
      'react-dom': '/node_modules/react-dom',
      'chart.js': '/node_modules/chart.js',
      'react-chartjs-2': '/node_modules/react-chartjs-2'
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'chart.js', 'react-chartjs-2']
  }
});
