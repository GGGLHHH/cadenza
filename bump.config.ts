import { defineConfig } from 'bumpp'

/**
 * `pnpm release` bumps these in lockstep, commits `chore: release vX`, tags `vX` and
 * pushes — which is what fires .github/workflows/release.yml.
 *
 * Only the publishable package is listed. docs/ is private and carries no version.
 * bumpp reads `bump.config.ts`, not `bumpp.config.ts`.
 */
export default defineConfig({
  files: [
    'package.json',
    'packages/ui/package.json',
    'packages/utils/package.json',
  ],
})
