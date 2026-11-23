# Zod Kit

[![npm version](https://badge.fury.io/js/%40hy_ong%2Fzod-kit.svg)](https://badge.fury.io/js/%40hy_ong%2Fzod-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A comprehensive TypeScript library that provides pre-built validation schemas on top of [Zod](https://github.com/colinhacks/zod) with full internationalization support. Streamline your form validation with battle-tested schemas for common data types and Taiwan-specific formats.

## ✨ Features

- 🔍 **Pre-built schemas** - Common validation patterns ready to use
- 🌐 **i18n support** - English and Traditional Chinese localization
- 📝 **TypeScript-first** - Full type safety and IntelliSense support
- ⚡ **Lightweight** - Minimal dependencies with Zod as peer dependency
- 🎯 **Highly configurable** - Flexible options for every use case
- 🇹🇼 **Taiwan-specific** - National ID, business ID, phone numbers, postal codes, etc.
- ⏰ **Date/Time support** - Comprehensive datetime, time, and date validation
- 📎 **File validation** - MIME type filtering, size constraints, and file type checking
- 🧪 **Battle-tested** - Comprehensive test suite with 700+ tests

## 📦 Installation

```bash
npm install @hy_ong/zod-kit zod
```

```bash
yarn add @hy_ong/zod-kit zod
```

```bash
pnpm add @hy_ong/zod-kit zod
```

> **Note**: Zod is a peer dependency (`^4.3.6`) and must be installed separately.

## 🚀 Quick Start

```typescript
import { email, password, text, twMobile, datetime, time, twPostalCode } from '@hy_ong/zod-kit'

// Simple email validation (required by default)
const emailSchema = email(true)
emailSchema.parse('user@example.com') // ✅ "user@example.com"

// Optional email
const optionalEmail = email(false)
optionalEmail.parse(null) // ✅ null

// Password with complexity requirements
const passwordSchema = password(true, {
  minLength: 8,
  requireUppercase: true,
  requireDigits: true,
  requireSpecialChars: true
})

// Taiwan mobile phone validation
const phoneSchema = twMobile(true)
phoneSchema.parse('0912345678') // ✅ "0912345678"

// DateTime validation
const datetimeSchema = datetime(true)
datetimeSchema.parse('2024-03-15 14:30') // ✅ "2024-03-15 14:30"

// Time validation
const timeSchema = time(true)
timeSchema.parse('14:30') // ✅ "14:30"

// Taiwan postal code validation
const postalSchema = twPostalCode(true)
postalSchema.parse('100001') // ✅ "100001"
```

## 📚 API Reference

### Common Validators

#### `email(required?, options?)`

Validates email addresses with comprehensive format checking.

**Parameters:**
- `required` (boolean, optional): Whether the field is required. Default: `false`
- `options` (object, optional): Configuration options

```typescript
import { email } from '@hy_ong/zod-kit'

// Required email (recommended)
const requiredEmail = email(true)

// Optional email
const optionalEmail = email(false)
optionalEmail.parse(null) // ✅ null

// With options
const advancedEmail = email(true, {
  allowedDomains: ['gmail.com', 'company.com'],
  minLength: 5,
  maxLength: 100,
  transform: (val) => val.toLowerCase(),
  defaultValue: 'default@example.com',
  i18n: {
    en: { invalid: 'Please enter a valid email' },
    'zh-TW': { invalid: '請輸入有效的電子郵件' }
  }
})
```

#### `password(required?, options?)`

Validates passwords with customizable complexity requirements.

**Parameters:**
- `required` (boolean, optional): Whether the field is required. Default: `false`
- `options` (object, optional): Configuration options

```typescript
import { password } from '@hy_ong/zod-kit'

// Required password with complexity rules
const passwordSchema = password(true, {
  min: 8,             // Minimum length
  max: 128,           // Maximum length
  uppercase: true,    // Require A-Z
  lowercase: true,    // Require a-z
  digits: true,       // Require 0-9
  special: true,      // Require !@#$%^&*
  regex: /[A-Z]/      // Custom pattern
})

// Optional password
const optionalPassword = password(false)
```

#### `text(required?, options?)`

General text validation with length and pattern constraints.

```typescript
import { text } from '@hy_ong/zod-kit'

const nameSchema = text(true, {
  minLength: 2,
  maxLength: 50,
  regex: /^[a-zA-Z\s]+$/,
  trimMode: 'trim',           // 'trim' | 'trimStart' | 'trimEnd' | 'none'
  casing: 'none',             // 'upper' | 'lower' | 'title' | 'none'
  transform: (val) => val.toLowerCase()
})

const optionalText = text(false)

// Strict: reject non-string input instead of converting it with String()
const strictText = text(true, { strict: true })
strictText.parse(123) // ❌ "Must be a string" (i18n key: common.text.notString)

// Treat whitespace-only input as empty (checked after trimming, works with any trimMode)
const blankAsEmpty = text(false, { trimMode: 'none', whitespaceAsEmpty: true })
blankAsEmpty.parse('   ') // ✅ null
```

Other options: `startsWith`, `endsWith`, `includes`, `excludes`, `notEmpty`, `defaultValue`, `i18n`. `strict` and `whitespaceAsEmpty` default to `false` (by default non-string input is coerced with `String()`, and whitespace-only input is trimmed to `""` rather than treated as empty).

#### `number(required?, options?)`

Validates numeric values with range and type constraints.

```typescript
import { number } from '@hy_ong/zod-kit'

const ageSchema = number(true, {
  min: 0,
  max: 150,
  type: 'integer',     // 'integer' | 'float' | 'both'
  positive: true
})

const optionalNumber = number(false)
optionalNumber.parse('') // ✅ null

// Choose what empty input becomes when optional: null (default) | undefined | ''
const undefinedWhenEmpty = number(false, { emptyValue: undefined }) // z.output: number | undefined
undefinedWhenEmpty.parse('') // ✅ undefined

// Treat whitespace-only strings as empty instead of parsing them as 0
const wsAsEmpty = number(true, { whitespaceAsEmpty: true })
wsAsEmpty.parse('  ') // ❌ Required
```

Other options: `negative`, `nonNegative`, `nonPositive`, `multipleOf`, `precision`, `finite` (default `true`), `parseCommas` (parse `"1,234"` as `1234`), `transform`, `defaultValue`, `i18n`. `defaultValue` takes priority over `emptyValue`; `emptyValue` only applies to optional fields (required fields still fail with the required message).

#### `url(required?, options?)`

URL validation with protocol and domain restrictions.

```typescript
import { url } from '@hy_ong/zod-kit'

const urlSchema = url(true, {
  protocols: ['https'],         // Only HTTPS allowed
  allowedDomains: ['safe.com'], // Domain whitelist
  requireTLD: true             // Require top-level domain
})

const optionalUrl = url(false)
```

#### `boolean(required?, options?)`

Boolean validation with flexible input handling.

```typescript
import { boolean } from '@hy_ong/zod-kit'

const consentSchema = boolean(true, {
  truthyValues: ['yes', '1', 'true'], // Custom truthy values
  falsyValues: ['no', '0', 'false'],  // Custom falsy values
  shouldBe: true                      // Must be true (e.g. accept terms)
})

const optionalBoolean = boolean(false)
optionalBoolean.parse('') // ✅ null

// Choose what empty input becomes when optional: null (default) | undefined | ''
const undefinedWhenEmpty = boolean(false, { emptyValue: undefined }) // z.output: boolean | undefined
```

Other options: `strict` (only accept actual booleans), `transform`, `defaultValue`, `i18n`. `defaultValue` takes priority over `emptyValue`.

#### `oneOf(required?, options)`

Validates that a value is one of an allowed list of strings or numbers. Numeric strings are matched against numeric values (e.g. `'1'` → `1`).

```typescript
import { oneOf } from '@hy_ong/zod-kit'

const planSchema = oneOf(true, {
  values: ['basic', 'pro'] as const,
  caseSensitive: false // Default: true
})
planSchema.parse('PRO') // ✅ "pro"

const optionalPlan = oneOf(false, { values: ['basic', 'pro'] as const })
optionalPlan.parse('') // ✅ null

// Report the "invalid" message as the top-level issue instead of the generic union error
const directPlan = oneOf(true, { values: ['basic', 'pro'], directIssue: true })
directPlan.safeParse('gold').error?.issues[0].message // "Must be one of: basic, pro"
```

Other options: `defaultValue`, `transform`, `i18n`. `directIssue` defaults to `false`; it only changes non-empty invalid values (empty values still yield the required message or `null`/`defaultValue`).

Empty values are `''`, `null`, `undefined` and a missing `z.object` key. Blank strings are never coerced to numbers, so a whitespace-only string (e.g. `' '`) is invalid unless it is itself one of the `values`. `caseSensitive: false` only affects string options — numbers are matched as-is.

#### `datetime(required?, options?)`

Validates datetime with comprehensive format support and timezone handling.

```typescript
import { datetime } from '@hy_ong/zod-kit'

// Basic datetime validation
const basicSchema = datetime(true)
basicSchema.parse('2024-03-15 14:30') // ✓ Valid

// Business hours validation
const businessHours = datetime(true, {
  format: 'YYYY-MM-DD HH:mm',
  minHour: 9,
  maxHour: 17,
  weekdaysOnly: true
})

// Timezone-aware validation
const timezoneSchema = datetime(true, {
  timezone: 'Asia/Taipei',
  mustBeFuture: true
})

// Multiple format support
const flexibleSchema = datetime(true, {
  format: 'DD/MM/YYYY HH:mm'
})
flexibleSchema.parse('15/03/2024 14:30') // ✓ Valid

// Optional datetime
const optionalDatetime = datetime(false)
```

#### `time(required?, options?)`

Time validation with multiple formats and constraints.

```typescript
import { time } from '@hy_ong/zod-kit'

// Basic time validation (24-hour format)
const basicSchema = time(true)
basicSchema.parse('14:30') // ✓ Valid

// 12-hour format with AM/PM
const ampmSchema = time(true, { format: 'hh:mm A' })
ampmSchema.parse('02:30 PM') // ✓ Valid

// Business hours validation
const businessHours = time(true, {
  format: 'HH:mm',
  minHour: 9,
  maxHour: 17,
  minuteStep: 15 // Only :00, :15, :30, :45
})

// Time range validation
const timeRangeSchema = time(true, {
  min: '09:00',
  max: '17:00'
})

// Optional time
const optionalTime = time(false)
```

#### `date(required?, options?)`

Date validation with range and format constraints.

```typescript
import { date } from '@hy_ong/zod-kit'

const birthdateSchema = date(true, {
  format: 'YYYY-MM-DD',
  minDate: '1900-01-01',
  maxDate: new Date(),
  timezone: 'Asia/Taipei'
})

const optionalDate = date(false)
```

#### `file(required?, options?)`

File validation with MIME type filtering and size constraints.

```typescript
import { file } from '@hy_ong/zod-kit'

// Basic file validation
const basicSchema = file(true)
basicSchema.parse(new File(['content'], 'test.txt'))

// Size restrictions
const sizeSchema = file(true, {
  maxSize: 1024 * 1024, // 1MB
  minSize: 1024 // 1KB
})

// Extension restrictions
const imageSchema = file(true, {
  extension: ['.jpg', '.png', '.gif'],
  maxSize: 5 * 1024 * 1024 // 5MB
})

// MIME type restrictions
const documentSchema = file(true, {
  type: ['application/pdf', 'application/msword'],
  maxSize: 10 * 1024 * 1024 // 10MB
})

// Image files only
const imageOnlySchema = file(true, { imageOnly: true })

// Optional file
const optionalFile = file(false)
```

#### `id(required?, options?)`

Flexible ID validation supporting multiple formats.

```typescript
import { id } from '@hy_ong/zod-kit'

const userIdSchema = id(true, {
  type: 'uuid',              // 'uuid', 'nanoid', 'objectId', 'auto', etc.
  allowedTypes: ['uuid', 'nanoid'], // Multiple allowed types
  customRegex: /^USR_[A-Z0-9]+$/    // Custom pattern
})

const optionalId = id(false)
```

### Taiwan-Specific Validators

#### `twNationalId(required?, options?)`

Validates Taiwan National ID (身份證字號).

```typescript
import { twNationalId } from '@hy_ong/zod-kit'

const idSchema = twNationalId(true, {
  type: 'both',
  allowOldResident: true
})

idSchema.parse('A123456789') // ✅ Valid Taiwan National ID

const optionalId = twNationalId(false)
```

#### `twBusinessId(required?, options?)`

Validates Taiwan Business ID (統一編號).

```typescript
import { twBusinessId } from '@hy_ong/zod-kit'

const bizSchema = twBusinessId(true)
bizSchema.parse('12345675') // ✅ Valid business ID with checksum

const optionalBizId = twBusinessId(false)
```

#### `twMobile(required?, options?)`

Validates Taiwan mobile phone numbers.

```typescript
import { twMobile } from '@hy_ong/zod-kit'

const phoneSchema = twMobile(true)
phoneSchema.parse('0912-345-678') // ✅ "0912-345-678" (separators are ignored during validation)

// Output digits only by stripping "-" and whitespace
const normalizedSchema = twMobile(true, { normalize: true })
normalizedSchema.parse('0912-345-678') // ✅ "0912345678"
normalizedSchema.parse('0912 345 678') // ✅ "0912345678"

const optionalMobile = twMobile(false)
```

Other options: `whitelist`, `transform`, `defaultValue`, `i18n`. `normalize` defaults to `false`; when enabled it runs after `transform`, and whitelist entries are also compared in normalized form.

#### `twTel(required?, options?)`

Validates Taiwan telephone numbers, including landline, 070 VoIP, domestic 0800/0809 recipient-paid numbers, and optional 008 ITFS/UIFN numbers.

```typescript
import { twTel } from '@hy_ong/zod-kit'

const landlineSchema = twTel(true)
landlineSchema.parse('02-2345-6789') // ✅ Valid landline number

const itfsSchema = twTel(true, { allowITFS: true })
itfsSchema.parse('00800-2468-1668') // ✅ Valid UIFN number
itfsSchema.parse('00801-852-747')   // ✅ Valid ITFS number

const optionalTel = twTel(false)
```

#### `twFax(required?, options?)`

Validates Taiwan fax numbers (same format as landline).

```typescript
import { twFax } from '@hy_ong/zod-kit'

const faxSchema = twFax(true)
faxSchema.parse('02-2345-6789') // ✅ Valid fax number

const optionalFax = twFax(false)
```

#### `twPostalCode(required?, options?)`

Validates Taiwan postal codes with support for 3-digit, 5-digit, and 6-digit formats.

```typescript
import { twPostalCode } from '@hy_ong/zod-kit'

// Accept 3-digit or 6-digit formats (recommended)
const modernSchema = twPostalCode(true)
modernSchema.parse('100')     // ✅ Valid 3-digit
modernSchema.parse('100001')  // ✅ Valid 6-digit

// Accept all formats
const flexibleSchema = twPostalCode(true, { format: 'all' })
flexibleSchema.parse('100')     // ✅ Valid
flexibleSchema.parse('10001')   // ✅ Valid (5-digit legacy)
flexibleSchema.parse('100001')  // ✅ Valid

// Only 6-digit format (current standard)
const modernOnlySchema = twPostalCode(true, { format: '6' })
modernOnlySchema.parse('100001') // ✅ Valid
modernOnlySchema.parse('100')    // ❌ Invalid

// With dashes allowed
const dashSchema = twPostalCode(true, { allowDashes: true })
dashSchema.parse('100-001')  // ✅ Valid (normalized to '100001')

// Specific areas only
const taipeiSchema = twPostalCode(true, {
  allowedPrefixes: ['100', '103', '104', '105', '106']
})
taipeiSchema.parse('100001') // ✅ Valid (Taipei area)
taipeiSchema.parse('200001') // ❌ Invalid (not in allowlist)

// Optional postal code
const optionalPostal = twPostalCode(false)
```

## 🌐 Internationalization

Zod Kit supports multiple languages for error messages:

```typescript
import { setLocale } from '@hy_ong/zod-kit'

// Set global locale
setLocale('zh-TW') // Traditional Chinese
setLocale('en')    // English (default)

// Or use custom messages per validator
const emailSchema = email(true, {
  i18n: {
    en: {
      required: 'Email is required',
      invalid: 'Please enter a valid email address'
    },
    'zh-TW': {
      required: '請輸入電子郵件',
      invalid: '請輸入有效的電子郵件格式'
    }
  }
})
```

## 🎨 Advanced Usage

### Optional Fields

Make any field optional by passing `false` as the first argument:

```typescript
const optionalEmail = email(false)

optionalEmail.parse(null)      // ✅ null
optionalEmail.parse('')        // ✅ null
optionalEmail.parse('test@example.com') // ✅ "test@example.com"
```

### Custom Transformations

Transform values during validation:

```typescript
const trimmedText = text(true, {
  transform: (val) => val.trim().toLowerCase(),
  minLength: 1
})

trimmedText.parse('  HELLO  ') // ✅ "hello"
```

### Default Values

Provide default values for empty inputs:

```typescript
const emailWithDefault = email(true, {
  defaultValue: 'default@example.com'
})

emailWithDefault.parse('')   // ✅ "default@example.com"
emailWithDefault.parse(null) // ✅ "default@example.com"
```

### Whitelist Validation

Allow specific values regardless of format:

```typescript
const flexibleId = id(true, {
  type: 'uuid',
  whitelist: ['admin', 'system', 'test-user']
})

flexibleId.parse('admin')                    // ✅ "admin"
flexibleId.parse('550e8400-e29b-41d4-a716-446655440000') // ✅ Valid UUID
```

### Combining Validators

Use with Zod's composition features:

```typescript
import { z } from 'zod'
import { email, password } from '@hy_ong/zod-kit'

const userSchema = z.object({
  email: email(true),
  password: password(true, { min: 8 }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match"
})
```

### Form Input Types

`number`, `boolean` and `text` are typed as `ZodType<Output, Input>`, so `z.input` reflects the raw form values they accept (such as `''`), while `z.output` reflects the parsed result:

| Validator | `z.input` | `z.output` (required / optional) |
|-----------|-----------|----------------------------------|
| `number` | `string \| number \| null \| undefined` | `number` / `number \| EmptyValue` |
| `boolean` | `boolean \| string \| number \| null \| undefined` | `boolean` / `boolean \| EmptyValue` |
| `text` | `string \| null \| undefined` | `string` / `string \| null` |

`EmptyValue` is inferred from the `emptyValue` option (default `null`).
If you declare options containing `emptyValue` as a variable first, specify the generic explicitly (e.g. `const opts: NumberOptions<false, undefined> = { emptyValue: undefined }`); otherwise the type falls back to the default `null`.

This lets form libraries keep raw input values and parsed values separate, e.g. with react-hook-form:

```typescript
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { number, text } from '@hy_ong/zod-kit'

const schema = z.object({
  name: text(true),
  age: number(false, { emptyValue: undefined })
})

const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { name: '', age: '' } // '' is a valid input value
})
// handleSubmit receives { name: string; age: number | undefined }
```

> **Note:** If you previously annotated these validators' return values as `z.ZodNumber`, `z.ZodString` or `z.ZodBoolean`, change the annotation to `z.ZodType` (e.g. `z.ZodType<number>`).

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/hy-ong/zod-kit.git
cd zod-kit

# Install dependencies
npm install

# Run tests
npm test

# Build the package
npm run build

# Run tests in watch mode
npx vitest --watch
```

## 🧪 Testing

The library includes comprehensive tests covering:

- ✅ All validator functions
- ✅ Edge cases and error conditions
- ✅ Internationalization
- ✅ TypeScript type safety
- ✅ Taiwan-specific format validation

```bash
npm test                    # Run all tests
npx vitest --coverage      # Run with coverage report
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/hy-ong/zod-kit?style=social)
![GitHub forks](https://img.shields.io/github/forks/hy-ong/zod-kit?style=social)
![GitHub issues](https://img.shields.io/github/issues/hy-ong/zod-kit)

## 🙏 Acknowledgments

- Built on top of the amazing [Zod](https://github.com/colinhacks/zod) library
- Inspired by real-world validation needs in Taiwan's tech ecosystem
- Thanks to all contributors and users

---

**Made with ❤️ by [Ong Hoe Yuan](https://github.com/hy-ong)**

For questions or support, please [open an issue](https://github.com/hy-ong/zod-kit/issues) on GitHub.
