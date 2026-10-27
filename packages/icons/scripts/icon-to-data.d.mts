// Types for scripts/icon-to-data.mjs, for the tests that import it.

/** The data module for one animate-ui icon, ready to write as `<name>.ts`. */
export function iconDataFile(name: string, source: string): { exportName: string, text: string }
