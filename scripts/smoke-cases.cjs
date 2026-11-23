"use strict"

// Runtime smoke test shared by scripts/smoke.mjs (ESM) and scripts/smoke.cjs (CJS).
// It loads every subpath in package.json "exports" through the package name, so it
// exercises the built dist/ exactly as a consumer would (self-reference inside this
// repo, or the installed package inside a consumer project).

const fs = require("node:fs")
const path = require("node:path")

const PKG = "@hy_ong/zod-kit"

// One case per exports subpath: call `fn(...args)` and parse `input`.
const cases = {
  ".": { fn: "email", args: [true], input: "user@example.com", expected: "user@example.com" },
  "./common/boolean": { fn: "boolean", args: [true], input: "true", expected: true },
  "./common/color": { fn: "color", args: [true], input: "#ff0000", expected: "#ff0000" },
  "./common/coordinate": { fn: "coordinate", args: [true, { type: "latitude" }], input: "25.033", expected: "25.033" },
  "./common/credit-card": { fn: "creditCard", args: [true], input: "4111111111111111", expected: "4111111111111111" },
  "./common/date": { fn: "date", args: [true], input: "2024-01-15", expected: "2024-01-15" },
  "./common/datetime": { fn: "datetime", args: [true], input: "2024-01-15 10:30", expected: "2024-01-15 10:30" },
  "./common/email": { fn: "email", args: [true], input: "  user@example.com  ", expected: "user@example.com" },
  "./common/file": { fn: "file", args: [false], input: null, expected: null },
  "./common/id": { fn: "id", args: [true, { type: "uuid" }], input: "550e8400-e29b-41d4-a716-446655440000", expected: "550e8400-e29b-41d4-a716-446655440000" },
  "./common/ip": { fn: "ip", args: [true], input: "192.168.1.1", expected: "192.168.1.1" },
  "./common/many-of": { fn: "manyOf", args: [true, { values: ["a", "b", "c"] }], input: ["a", "c"], expected: ["a", "c"] },
  "./common/number": { fn: "number", args: [true], input: "42", expected: 42 },
  "./common/one-of": { fn: "oneOf", args: [true, { values: ["a", "b"] }], input: "b", expected: "b" },
  "./common/password": { fn: "password", args: [true], input: "Str0ng!Passw0rd", expected: "Str0ng!Passw0rd" },
  "./common/text": { fn: "text", args: [true], input: "  hello  ", expected: "hello" },
  "./common/time": { fn: "time", args: [true], input: "10:30", expected: "10:30" },
  "./common/url": { fn: "url", args: [true], input: "https://example.com", expected: "https://example.com" },
  "./taiwan/bank-account": { fn: "twBankAccount", args: [true], input: "004-123456789012", expected: "004-123456789012" },
  "./taiwan/business-id": { fn: "twBusinessId", args: [true], input: "12345675", expected: "12345675" },
  "./taiwan/fax": { fn: "twFax", args: [true], input: "0223456789", expected: "0223456789" },
  "./taiwan/invoice": { fn: "twInvoice", args: [true], input: "ab-12345678", expected: "AB12345678" },
  "./taiwan/license-plate": { fn: "twLicensePlate", args: [true], input: "abc-1234", expected: "ABC1234" },
  "./taiwan/mobile": { fn: "twMobile", args: [true], input: "0912345678", expected: "0912345678" },
  "./taiwan/national-id": { fn: "twNationalId", args: [true], input: "A123456789", expected: "A123456789" },
  "./taiwan/passport": { fn: "twPassport", args: [true], input: "212345678", expected: "212345678" },
  "./taiwan/postal-code": { fn: "twPostalCode", args: [true], input: "100", expected: "100" },
  "./taiwan/tel": { fn: "twTel", args: [true], input: "0223456789", expected: "0223456789" },
}

function readExportKeys(resolveFromHere) {
  // Resolve the package entry, then walk up to the package.json that declares it.
  let dir = path.dirname(resolveFromHere(PKG))
  for (;;) {
    const file = path.join(dir, "package.json")
    if (fs.existsSync(file)) {
      const pkg = JSON.parse(fs.readFileSync(file, "utf8"))
      if (pkg.name === PKG) return Object.keys(pkg.exports)
    }
    const parent = path.dirname(dir)
    if (parent === dir) throw new Error(`Cannot find package.json for ${PKG}`)
    dir = parent
  }
}

/**
 * @param {string} label "esm" or "cjs"
 * @param {(specifier: string) => Promise<any>} load
 * @param {(specifier: string) => string} resolve CJS-style resolver used to locate package.json
 */
async function runSmoke(label, load, resolve) {
  const failures = []
  const subpaths = readExportKeys(resolve)

  for (const subpath of subpaths) {
    if (!cases[subpath]) failures.push(`${subpath}: no smoke case defined`)
  }
  for (const subpath of Object.keys(cases)) {
    if (!subpaths.includes(subpath)) failures.push(`${subpath}: smoke case has no matching exports entry`)
  }

  for (const subpath of subpaths) {
    const c = cases[subpath]
    if (!c) continue
    const specifier = subpath === "." ? PKG : `${PKG}/${subpath.slice(2)}`
    try {
      const mod = await load(specifier)
      if (typeof mod[c.fn] !== "function") throw new Error(`export "${c.fn}" is ${typeof mod[c.fn]}`)
      const actual = mod[c.fn](...c.args).parse(c.input)
      if (JSON.stringify(actual) !== JSON.stringify(c.expected)) {
        throw new Error(`parse(${JSON.stringify(c.input)}) returned ${JSON.stringify(actual)}, expected ${JSON.stringify(c.expected)}`)
      }
    } catch (error) {
      failures.push(`${specifier}: ${error && error.message ? error.message : error}`)
    }
  }

  // The root entry must expose every validator used above, plus the locale API,
  // and the bundled locale messages must be available.
  try {
    const root = await load(PKG)
    for (const name of new Set(Object.values(cases).map((c) => c.fn))) {
      if (typeof root[name] !== "function") failures.push(`${PKG}: root export "${name}" missing`)
    }
    root.setLocale("en-US")
    const en = root.text(true).safeParse("")
    root.setLocale("zh-TW")
    const zh = root.text(true).safeParse("")
    root.setLocale("en-US")
    const enMessage = en.success ? "" : en.error.issues[0].message
    const zhMessage = zh.success ? "" : zh.error.issues[0].message
    if (!enMessage || !zhMessage || enMessage === zhMessage) {
      failures.push(`${PKG}: locale messages not applied (en-US=${JSON.stringify(enMessage)}, zh-TW=${JSON.stringify(zhMessage)})`)
    }
  } catch (error) {
    failures.push(`${PKG}: ${error && error.message ? error.message : error}`)
  }

  if (failures.length > 0) {
    console.error(`[smoke:${label}] ${failures.length} failure(s) on Node ${process.version}:`)
    for (const failure of failures) console.error(`  - ${failure}`)
    process.exitCode = 1
    return
  }
  console.log(`[smoke:${label}] OK: ${subpaths.length} entry points loaded and parsed on Node ${process.version}`)
}

module.exports = { PKG, cases, runSmoke }
