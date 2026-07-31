import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    // ponytail: jsdom, not a real browser — React Aria's pointer/focus behaviour is
    // only approximated. Switch to vitest browser mode if a11y regressions slip through.
    environment: 'jsdom',
    // Testing Library only registers its auto-cleanup when afterEach is global.
    globals: true,
    include: ['packages/*/test/**/*.test.{ts,tsx}'],
  },
})
