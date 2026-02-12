# CLAUDE.md — zod-kit

## Project Overview

`@hy_ong/zod-kit` is a TypeScript library providing pre-built Zod validation schemas with full i18n support (10 locales). It includes common validators (email, password, text, number, credit card, IP, color, coordinate, etc.) and Taiwan-specific validators (National ID, Business ID, mobile, tel, fax, postal code, invoice, license plate, bank account, passport).

- **Version:** 0.2.0
- **License:** MIT
- **NPM:** `@hy_ong/zod-kit`
- **Peer dependency:** Zod ^4.3.6
- **Production dependency:** dayjs ^1.11.19

## Commands

```bash
# Run all tests (1050 test cases across 25 files)
npm test

# Run tests once (no watch mode)
npm test -- --run

# Run specific test file
npx vitest run tests/common/email.test.ts

# Build (ESM + CJS + .d.ts, 26 entry points with code splitting)
npm run build
# Uses tsup.config.ts for multi-entry build

# Lint
npx eslint src/

# Type check
npx tsc --noEmit

# Publish (runs tests + build automatically via prepublishOnly)
npm publish --access public
```

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
    ├── common/                 # 15 universal validators
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
    │   ├── number.ts
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
        └── tel.ts              # Landline + toll-free (0800/0809)

tests/                          # Mirrors src/validators/ structure
├── common/                     # 15 test files
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

All 26 sub-modules are configured in `tsup.config.ts` (entry points) and `package.json` (exports map).

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
- Returns: `ZodType` — required returns non-nullable, optional returns nullable

### Validation Pipeline

All validators use a two-step approach:
1. `z.preprocess()` — input transformation (trim, coerce, normalize)
2. `.superRefine()` — complex business logic and custom error messages

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
- **Tel/Fax**: Area code + digit length rules per region
- **Mobile**: Operator prefix validation (090-099)
- **Invoice**: 2-letter prefix + 8-digit format, auto-strip hyphens, auto-uppercase
- **License Plate**: New (2012+) and legacy formats for car/motorcycle
- **Bank Account**: Bank code validation against official list + account number length
- **Passport**: 9-digit format with type prefix (0=diplomatic, 1=official, 2=ordinary, 3=travel)

## Code Style

- **Formatter:** Prettier — no semicolons, double quotes, 200 char line width, 2-space indent
- **Linter:** ESLint 9 + typescript-eslint (recommended rules, `no-explicit-any` disabled)
- **TypeScript:** Strict mode, ESNext target, declaration files generated
- **Module:** ES Module (`"type": "module"` in package.json)
- **Tests:** Vitest with globals enabled, node environment

## Conventions

- Commit messages use **Conventional Commits**: `feat(scope):`, `fix(scope):`, `chore:`, `docs:`
- Every validator exports both a factory function and relevant type definitions
- Test files use `beforeEach(() => setLocale("en-US"))` for consistent locale
- Test structure: `describe("validatorName(required) features")` → nested `describe` per feature → `it` cases
- Source files are organized by domain: `common/` for universal, `taiwan/` for locale-specific
- CI runs on GitHub Actions (Node 18/20/22): lint, type-check, test, build

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
6. Create `tests/{domain}/{name}.test.ts` with comprehensive coverage
7. Test with `npx vitest run tests/{domain}/{name}.test.ts`
