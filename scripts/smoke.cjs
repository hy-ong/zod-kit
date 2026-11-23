"use strict"

// CommonJS smoke test: require() every exports subpath of the built package.
// Usage: npm run build && node scripts/smoke.cjs

const { runSmoke } = require("./smoke-cases.cjs")

runSmoke("cjs", async (specifier) => require(specifier), require.resolve).catch((error) => {
  console.error(error)
  process.exitCode = 1
})
