// Only src/components is public. src/primitives is vendored shadcn source — raw
// material, never exported directly. Promote a primitive by adding a file under
// src/components and exporting it here.
export * from './components/button'
export * from './lib/utils'
