import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import process from 'node:process'
import { defineConfig } from 'bumpp'
import { generateMarkDown, getGitDiff, loadChangelogConfig, parseCommits } from 'changelogen'

const CHANGELOG = 'CHANGELOG.md'
/**
 * Hand-written notes for the next release — what a commit title cannot say: a
 * migration, or a breaking change no commit declared. They open the release's
 * section and the file goes away in the release commit.
 */
const NEXT_NOTES = 'CHANGELOG.next.md'

/**
 * `pnpm release` bumps these in lockstep, writes the changelog, commits
 * `chore: release vX`, tags `vX` and pushes — which is what fires
 * .github/workflows/release.yml.
 *
 * Only the publishable packages are listed. docs/ is private and carries no version.
 * bumpp reads `bump.config.ts`, not `bumpp.config.ts`.
 */
export default defineConfig({
  files: [
    'package.json',
    'packages/ai/package.json',
    'packages/form/package.json',
    'packages/ui/package.json',
    'packages/utils/package.json',
  ],
  // changelogen's own steps, minus its bump / commit / tag, which are bumpp's.
  // Runs after the bump and before the commit, from the last tag to HEAD.
  async execute(operation) {
    const config = await loadChangelogConfig(process.cwd(), {
      newVersion: operation.state.newVersion,
      noAuthors: true,
      // Nothing a library user acts on.
      types: { chore: false, ci: false, style: false, test: false },
    })
    const commits = parseCommits(await getGitDiff(config.from, config.to), config)
      .filter(commit => Boolean(config.types[commit.type]) && !(commit.type === 'chore' && commit.scope === 'deps' && !commit.isBreaking))
      // No authors: changelogen looks every author's email up on ungh.cc even
      // with `noAuthors`, and a release has no business sending them out.
      .map(commit => ({ ...commit, author: { name: '', email: '' } }))
    const generated = await generateMarkDown(commits, config)
    const notes = existsSync(NEXT_NOTES) ? readFileSync(NEXT_NOTES, 'utf8').trim() : ''
    // Under the heading and its compare link, before the first group.
    const groups = generated.search(/^### /m)
    const section = notes === '' || groups === -1
      ? `${generated}${notes === '' ? '' : `\n\n${notes}`}`
      : `${generated.slice(0, groups)}${notes}\n\n${generated.slice(groups)}`

    const existing = existsSync(CHANGELOG) ? readFileSync(CHANGELOG, 'utf8') : '# Changelog\n\n'
    // Newest first: before the previous release's heading, as changelogen does.
    const previous = existing.search(/^##\s/m)
    writeFileSync(CHANGELOG, previous === -1
      ? `${existing.trimEnd()}\n\n${section}\n`
      : `${existing.slice(0, previous)}${section}\n\n${existing.slice(previous)}`)

    const updatedFiles = [...operation.state.updatedFiles, CHANGELOG]
    if (notes !== '') {
      rmSync(NEXT_NOTES)
      updatedFiles.push(NEXT_NOTES)
    }
    operation.update({ updatedFiles })
  },
})
