import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    setupFiles: ['./setupTests.js'],
    environment: 'jsdom',
    globals: true,
    include: [
      'src/**/*.{test,spec}.{js,jsx}',
      '../tests/unit/**/*.{test,spec}.{js,jsx}'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/components/finetune/**/*.vue'],
      exclude: [
        'node_modules/',
        'src/**/*.spec.js',
        'src/**/*.test.js',
      ],
      lines: 80,
      functions: 85,
      branches: 75,
      statements: 80,
      reportsDirectory: '../tests/reports/coverage'
    },
    reporters: ['verbose', 'json'],
    outputFile: {
      json: '../tests/reports/test-results.json'
    },
    // deps: {
    //   inline: ['element-plus'],
    // },
    server: {
      deps: {
        inline: ['element-plus', 'vue-i18n', 'pinia'],
      }
    },
  }
})