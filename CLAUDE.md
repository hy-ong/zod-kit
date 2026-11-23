# CLAUDE.md — zod-kit

## Project Overview

`@hy_ong/zod-kit` is a TypeScript library providing pre-built Zod validation schemas with full i18n support (10 locales). It includes common validators (email, password, text, number, oneOf, manyOf, credit card, IP, color, coordinate, etc.) and Taiwan-specific validators (National ID, Business ID, mobile, tel, fax, postal code, invoice, license plate, bank account, passport).

- **Version:** 0.4.0
- **License:** MIT
- **NPM:** `@hy_ong/zod-kit`
- **Peer dependency:** Zod v4 (exact range: see `package.json`)
- **Production dependency:** dayjs v1 (exact range: see `package.json`)

## Commands

```bash
# Run all tests in watch mode (27 test files; runtime tests + type checks)
npm test

# Run tests once (no watch mode)
npm test -- --run

# Run runtime tests only, skipping type checks
npx vitest run --typecheck.enabled=false

# Run specific test file
npx vitest run tests/common/email.test.ts

# Build (ESM + CJS + .d.ts, 28 entry points with code splitting)
npm run build
# Uses tsup.config.ts for multi-entry build

# Lint
npx eslint src/

# Type check (src only, uses tsconfig.json)
npx tsc --noEmit

# Publish (runs tests + build automatically via prepublishOnly; npm account has 2FA)
npm publish --access public --otp=<code>
```

### Test Type Checking

`npm test` also type-checks `tests/**/*.test.ts` via Vitest typecheck (see `vitest.config.ts`), using `tsconfig.test.json` (extends `tsconfig.json`, includes `src` and `tests`, adds `vitest/globals` types).

- A failing `expectTypeOf` assertion or any type error in a test file fails the run.
- Because each test file is run both as a runtime test and as a typecheck test, the summary's "Test Files" and "Tests" counts are roughly doubled (e.g. 27 files are reported as 54).
- `npx tsc --noEmit` only checks `src/`; it does not cover test files.

## Project Structure

```
src/
├── index.ts                    # Re-exports all validators + config
├── config.ts                   # Locale state (setLocale, getLocale)
├── i18n/
│   ├── index.ts                # Translation function t(key, params)
│   └── locales/
│       ├── en-US.json          # English (US)
│       ├── en-GB.json          # English (UK)
│       ├── zh-TW.json          # Traditional Chinese
│       ├── zh-CN.json          # Simplified Chinese
│       ├── ja-JP.json          # Japanese
│       ├── ko-KR.json          # Korean
│       ├── ms-MY.json          # Malay
│       ├── id-ID.json          # Indonesian
│       ├── th-TH.json          # Thai
│       └── vi-VN.json          # Vietnamese
└── validators/
    ├── common/                 # 17 universal validators
    │   ├── boolean.ts
    │   ├── color.ts            # Hex, RGB, HSL with alpha support
    │   ├── coordinate.ts       # Latitude, longitude, coordinate pairs
    │   ├── credit-card.ts      # Luhn algorithm, card type detection
    │   ├── date.ts
    │   ├── datetime.ts         # Uses dayjs for parsing
    │   ├── email.ts
    │   ├── file.ts
    │   ├── id.ts               # UUID, nanoid, ObjectId
    │   ├── ip.ts               # IPv4, IPv6, CIDR support
    │   ├── many-of.ts          # Multi-select from a fixed list of values
    │   ├── number.ts
    │   ├── one-of.ts           # Single-select from a fixed list of values
    │   ├── password.ts
    │   ├── text.ts
    │   ├── time.ts
    │   └── url.ts
    └── taiwan/                 # 10 Taiwan-specific validators
        ├── bank-account.ts     # 銀行帳號 (bank code + account number)
        ├── business-id.ts      # 統一編號 (checksum)
        ├── fax.ts
        ├── invoice.ts          # 統一發票 (2 letters + 8 digits)
        ├── license-plate.ts    # 車牌號碼 (new + legacy formats)
        ├── mobile.ts           # 09X-XXXX-XXXX
        ├── national-id.ts      # 身分證/居留證 (checksum)
        ├── passport.ts         # 護照號碼 (9 digits, type prefix)
        ├── postal-code.ts      # 3/5/6-digit with official data
        └── tel.ts              # Landline, 070 VoIP, toll-free (0800/0809), optional ITFS

tests/                          # Mirrors src/validators/ structure (27 test files)
├── common/                     # 17 test files
└── taiwan/                     # 10 test files
```

## Per-Module Imports

Users can import individual validators for tree-shaking:

```typescript
// Full import
import { email, twNationalId } from "@hy_ong/zod-kit"

// Per-module import (tree-shakeable)
import { email } from "@hy_ong/zod-kit/common/email"
import { twNationalId } from "@hy_ong/zod-kit/taiwan/national-id"
```

All 27 sub-modules (plus the root `index` entry, 28 entry points in total) are configured in `tsup.config.ts` (entry points) and `package.json` (exports map).

## Architecture & Patterns

### Validator Function Signature

Every validator follows this consistent pattern:

```typescript
function validatorName<IsRequired extends boolean = false>(
  required?: IsRequired,
  options?: Omit<ValidatorOptions<IsRequired>, "required">
): ValidatorSchema<IsRequired>
```

- First param: `required` boolean (defaults to `false`)
- Second param: options object (varies per validator)
- Returns: `ZodType` — required returns non-nullable, optional returns nullable (or the configured `emptyValue` type for `number` / `boolean`)
- Some validators add extra generics, e.g. `oneOf` / `manyOf` take `const V` (inferred from `options.values`) and `number` / `boolean` take an `EmptyValue` generic

### Validation Pipeline

Most validators use a two-step approach:
1. `z.preprocess()` — input transformation (trim, coerce, normalize)
2. `.superRefine()` — complex business logic and custom error messages

Exceptions: `boolean`, `file`, and `oneOf` use `.refine()` chains or union schemas instead of `.superRefine()`. `oneOf` / `manyOf` are designed to stay compatible with React Hook Form and with missing optional keys in `z.object`, so check their tests before changing how they wrap schemas.

### i18n System

- 10 locales: en-US, en-GB, zh-TW, zh-CN, ja-JP, ko-KR, ms-MY, id-ID, th-TH, vi-VN
- Locale state is global: `setLocale("en-US")` / `setLocale("zh-TW")`
- Translation keys are dot-separated: `common.email.invalid`
- Parameter substitution: `${paramName}` in message templates
- Each validator supports custom `i18n` overrides in options

### Taiwan Validators

Taiwan validators implement domain-specific algorithms:
- **National ID / Business ID**: Checksum verification with weighted sums
- **Postal Code**: Validates against official Chunghwa Post data (28KB+ of mappings)
- **Tel/Fax**: Area code + digit length rules per region; tel also accepts 070 VoIP, 0800/0809 toll-free, and optional international toll-free (`allowITFS`)
- **Mobile**: Operator prefix validation (090-099), optional `normalize` option
- **Invoice**: 2-letter prefix + 8-digit format, auto-strip hyphens, auto-uppercase
- **License Plate**: New (2012+) and legacy formats for car/motorcycle
- **Bank Account**: Bank code validation against official list + account number length
- **Passport**: 9-digit format with type prefix (0=diplomatic, 1=official, 2=ordinary, 3=travel)

## Code Style

- **Formatter:** Prettier (`.prettierrc.json`) — no semicolons, double quotes, 200 char line width, 2-space indent
- **Linter:** ESLint (flat config in `eslint.config.mts`) + typescript-eslint (recommended rules, `no-explicit-any` disabled)
- **TypeScript:** Strict mode, ESNext target, declaration files generated
- **Module:** ES Module (`"type": "module"` in package.json)
- **Tests:** Vitest with globals enabled, node environment, typecheck enabled

## Conventions

- Commit messages use **Conventional Commits**: `feat(scope):`, `fix(scope):`, `test(scope):`, `chore:`, `docs:`
- Every validator exports both a factory function and relevant type definitions
- Test files use `beforeEach(() => setLocale("en-US"))` for consistent locale (when they assert on messages)
- Test structure: `describe("validatorName(required) features")` → nested `describe` per feature → `it` cases
- Type-level behavior (e.g. `z.input` / `z.output`) is asserted with `expectTypeOf` in the test files
- Source files are organized by domain: `common/` for universal, `taiwan/` for locale-specific
- No GitHub Actions: this repo must not contain `.github/workflows`. All verification runs locally (lint, type-check, test, build, smoke).

### Backward Compatibility

- New features are always opt-in options that are off by default.
- After upgrading without changing any options, runtime behavior and `z.output` types must stay exactly the same.
- Clear bug fixes may change behavior, but compare `safeParse` results input by input between the old and new versions to confirm every difference comes only from the fix.

## Release

1. Verify locally: `npx eslint src/`, `npx tsc --noEmit`, `npm test -- --run`, `npm run build`, then `node scripts/smoke.mjs` and `node scripts/smoke.cjs` (ESM/CJS import of every subpath).
2. Bump the version in its own commit: `chore: bump version to X.Y.Z`.
3. Write release notes following the format in `RELEASE.md`.
4. The npm account has 2FA, so the user runs `npm publish --access public --otp=<code>` themselves (`prepublishOnly` runs tests + build).
5. After publishing, confirm the registry's `gitHead` matches `HEAD` (e.g. `npm view @hy_ong/zod-kit@X.Y.Z gitHead`), then create the tag and release with `gh release create vX.Y.Z --target <sha>`.
6. Always push over HTTPS with `gh` credentials (e.g. `git push https://github.com/hy-ong/zod-kit.git main:main`), not SSH.

## Build Output

`dist/` contains per-module outputs with code splitting:
- `{module}.js` — ESM bundle
- `{module}.cjs` — CommonJS bundle
- `{module}.d.ts` — TypeScript declarations (ESM)
- `{module}.d.cts` — TypeScript declarations (CJS)
- `chunk-*.js` / `chunk-*.cjs` — Shared code chunks

## Adding a New Validator

1. Create `src/validators/{domain}/{name}.ts` following the generic pattern above
2. Add i18n keys to all 10 locale files in `src/i18n/locales/`
3. Export from `src/index.ts`
4. Add entry point to `tsup.config.ts`
5. Add exports map entry to `package.json`
6. Create `tests/{domain}/{name}.test.ts` with comprehensive coverage, including `expectTypeOf` checks for input/output types
7. Test with `npx vitest run tests/{domain}/{name}.test.ts` (runs runtime tests and type checks)
8. Update `README.md` with the new validator's usage and options
