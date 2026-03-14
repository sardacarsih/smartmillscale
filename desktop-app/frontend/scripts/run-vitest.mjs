/* eslint-env node */
import react from '@vitejs/plugin-react'
import { transform as transformWithSucrase } from 'sucrase'
import { startVitest } from 'vitest/node'

const enableCoverage = process.argv.includes('--coverage')

const jsxTransformPlugin = {
  name: 'codex-sucrase-jsx',
  enforce: 'pre',
  transform(code, id) {
    if (!id.endsWith('.jsx')) {
      return null
    }

    const transformed = transformWithSucrase(code, {
      filePath: id,
      transforms: ['jsx'],
      jsxRuntime: 'automatic',
      production: false,
    })

    return {
      code: transformed.code,
      map: null,
    }
  },
}

const vitest = await startVitest(
  'test',
  [],
  {
    run: true,
    watch: false,
    config: false,
  },
  {
    root: process.cwd(),
    plugins: [jsxTransformPlugin, react()],
    esbuild: false,
    oxc: {
      jsx: {
        runtime: 'automatic',
        importSource: 'react',
      },
    },
    optimizeDeps: {
      rolldownOptions: {
        transform: {
          jsx: {
            runtime: 'automatic',
          },
        },
      },
    },
    resolve: {
      preserveSymlinks: true,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
      include: ['src/**/*.{test,spec}.{js,jsx}'],
      pool: 'threads',
      maxWorkers: 1,
      minWorkers: 1,
      coverage: {
        enabled: enableCoverage,
        provider: 'v8',
        reporter: ['text'],
      },
    },
  },
)

if (!vitest) {
  process.exitCode = 1
} else {
  const exitCode = vitest.state.getCountOfFailedTests() > 0 ? 1 : 0
  await vitest.close()
  process.exitCode = exitCode
}
