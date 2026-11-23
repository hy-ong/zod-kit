// ESM smoke test: import() every exports subpath of the built package.
// Usage: npm run build && node scripts/smoke.mjs

import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const { runSmoke } = require("./smoke-cases.cjs")

await runSmoke("esm", (specifier) => import(specifier), require.resolve)
