import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    // ponytail: jsdom, not a real browser — pointer/focus behaviour is
    // only approximated. Switch to vitest browser mode if a11y regressions slip through.
    environment: 'jsdom',
    // Testing Library only registers its auto-cleanup when afterEach is global.
    globals: true,
    include: ['packages/*/test/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    // The pickers' tests drive multi-step interactions (open the panel, open
    // the year list, type a date key by key) that run ~1s alone and pass the
    // 5s default once a loaded machine slows the parallel run (seen at a load
    // average of ~20). A hang still fails, at 15s.
    testTimeout: 15_000,
  },
})
