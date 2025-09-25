# Zod Kit

[![npm version](https://badge.fury.io/js/%40hy_ong%2Fzod-kit.svg)](https://badge.fury.io/js/%40hy_ong%2Fzod-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A comprehensive TypeScript library that provides pre-built validation schemas on top of [Zod](https://github.com/colinhacks/zod) with full internationalization support. Streamline your form validation with battle-tested schemas for common data types and Taiwan-specific formats.

## ✨ Features

- 🔍 **Pre-built schemas** - Common validation patterns ready to use
- 🌐 **i18n support** - English and Traditional Chinese localization
- 📝 **TypeScript-first** - Full type safety and IntelliSense support
- ⚡ **Zero dependencies** - Built on top of Zod (peer dependency)
- 🎯 **Highly configurable** - Flexible options for every use case
- 🇹🇼 **Taiwan-specific** - National ID, business ID, phone numbers, postal codes, etc.
- ⏰ **Date/Time support** - Comprehensive datetime, time, and date validation
- 📎 **File validation** - MIME type filtering, size constraints, and file type checking
- 🧪 **Battle-tested** - Comprehensive test suite with 500+ tests

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

> **Note**: Zod is a peer dependency and must be installed separately.

## 🚀 Quick Start

```typescript
import { email, password, text, mobile, datetime, time, postalCode } from '@hy_ong/zod-kit'

// Simple email validation
const emailSchema = email()
emailSchema.parse('user@example.com') // ✅ "user@example.com"

// Password with complexity requirements
const passwordSchema = password({
  minLength: 8,
  requireUppercase: true,
  requireDigits: true,
  requireSpecialChars: true
})

// Taiwan mobile phone validation
const phoneSchema = mobile()
phoneSchema.parse('0912345678') // ✅ "0912345678"

// DateTime validation
const datetimeSchema = datetime()
datetimeSchema.parse('2024-03-15 14:30') // ✅ "2024-03-15 14:30"

// Time validation
const timeSchema = time()
timeSchema.parse('14:30') // ✅ "14:30"

// Taiwan postal code validation
const postalSchema = postalCode()
postalSchema.parse('100001') // ✅ "100001"
```

## 📚 API Reference

### Common Validators

#### `email(options?)`

Validates email addresses with comprehensive format checking.

```typescript
import { email } from '@hy_ong/zod-kit'

// Basic usage
const basicEmail = email()

// With options
const advancedEmail = email({
  required: true,           // Default: true
  allowedDomains: ['gmail.com', 'company.com'],
  minLength: 5,
  maxLength: 100,
  transform: (val) => val.toLowerCase(),
  i18n: {
    en: { invalid: 'Please enter a valid email' }
  }
})
```

#### `password(options?)`

Validates passwords with customizable complexity requirements.

```typescript
import { password } from '@hy_ong/zod-kit'

const passwordSchema = password({
  minLength: 8,             // Minimum length
  maxLength: 128,           // Maximum length
  requireUppercase: true,   // Require A-Z
  requireLowercase: true,   // Require a-z
  requireDigits: true,      // Require 0-9
  requireSpecialChars: true,// Require !@#$%^&*
  customPatterns: [
    { pattern: /[A-Z]/, message: 'Need uppercase' }
  ]
})
```

#### `text(options?)`

General text validation with length and pattern constraints.

```typescript
import { text } from '@hy_ong/zod-kit'

const nameSchema = text({
  minLength: 2,
  maxLength: 50,
  pattern: /^[a-zA-Z\s]+$/,
  transform: (val) => val.trim()
})
```

#### `number(options?)`

Validates numeric values with range and type constraints.

```typescript
import { number } from '@hy_ong/zod-kit'

const ageSchema = number({
  min: 0,
  max: 150,
  integer: true,
  positive: true
})
```

#### `url(options?)`

URL validation with protocol and domain restrictions.

```typescript
import { url } from '@hy_ong/zod-kit'

const urlSchema = url({
  protocols: ['https'],         // Only HTTPS allowed
  allowedDomains: ['safe.com'], // Domain whitelist
  requireTLD: true             // Require top-level domain
})
```

#### `boolean(options?)`

Boolean validation with flexible input handling.

```typescript
import { boolean } from '@hy_ong/zod-kit'

const consentSchema = boolean({
  required: true,
  trueValues: ['yes', '1', 'true'],  // Custom truthy values
  falseValues: ['no', '0', 'false'] // Custom falsy values
})
```

#### `datetime(options?)`

Validates datetime with comprehensive format support and timezone handling.

```typescript
import { datetime } from '@hy_ong/zod-kit'

// Basic datetime validation
const basicSchema = datetime()
basicSchema.parse('2024-03-15 14:30') // ✓ Valid

// Business hours validation
const businessHours = datetime({
  format: 'YYYY-MM-DD HH:mm',
  minHour: 9,
  maxHour: 17,
  weekdaysOnly: true
})

// Timezone-aware validation
const timezoneSchema = datetime({
  timezone: 'Asia/Taipei',
  mustBeFuture: true
})

// Multiple format support
const flexibleSchema = datetime({
  format: 'DD/MM/YYYY HH:mm'
})
flexibleSchema.parse('15/03/2024 14:30') // ✓ Valid
```

#### `time(options?)`

Time validation with multiple formats and constraints.

```typescript
import { time } from '@hy_ong/zod-kit'

// Basic time validation (24-hour format)
const basicSchema = time()
basicSchema.parse('14:30') // ✓ Valid

// 12-hour format with AM/PM
const ampmSchema = time({ format: 'hh:mm A' })
ampmSchema.parse('02:30 PM') // ✓ Valid

// Business hours validation
const businessHours = time({
  format: 'HH:mm',
  minHour: 9,
  maxHour: 17,
  minuteStep: 15 // Only :00, :15, :30, :45
})

// Time range validation
const timeRangeSchema = time({
  min: '09:00',
  max: '17:00'
})
```

#### `date(options?)`

Date validation with range and format constraints.

```typescript
import { date } from '@hy_ong/zod-kit'

const birthdateSchema = date({
  format: 'YYYY-MM-DD',
  minDate: '1900-01-01',
  maxDate: new Date(),
  timezone: 'Asia/Taipei'
})
```

#### `file(options?)`

File validation with MIME type filtering and size constraints.

```typescript
import { file } from '@hy_ong/zod-kit'

// Basic file validation
const basicSchema = file()
basicSchema.parse(new File(['content'], 'test.txt'))

// Size restrictions
const sizeSchema = file({
  maxSize: 1024 * 1024, // 1MB
  minSize: 1024 // 1KB
})

// Extension restrictions
const imageSchema = file({
  extension: ['.jpg', '.png', '.gif'],
  maxSize: 5 * 1024 * 1024 // 5MB
})

// MIME type restrictions
const documentSchema = file({
  type: ['application/pdf', 'application/msword'],
  maxSize: 10 * 1024 * 1024 // 10MB
})

// Image files only
const imageOnlySchema = file({ imageOnly: true })
```

#### `id(options?)`

Flexible ID validation supporting multiple formats.

```typescript
import { id } from '@hy_ong/zod-kit'

const userIdSchema = id({
  type: 'uuid',              // 'uuid', 'nanoid', 'objectId', 'auto', etc.
  allowedTypes: ['uuid', 'nanoid'], // Multiple allowed types
  customRegex: /^USR_[A-Z0-9]+$/    // Custom pattern
})
```

### Taiwan-Specific Validators

#### `nationalId(options?)`

Validates Taiwan National ID (身份證字號).

```typescript
import { nationalId } from '@hy_ong/zod-kit'

const idSchema = nationalId({
  required: true,
  normalize: true,  // Convert to uppercase
  whitelist: ['A123456789'] // Allow specific IDs
})

idSchema.parse('A123456789') // ✅ Valid Taiwan National ID
```

#### `businessId(options?)`

Validates Taiwan Business ID (統一編號).

```typescript
import { businessId } from '@hy_ong/zod-kit'

const bizSchema = businessId()
bizSchema.parse('12345675') // ✅ Valid business ID with checksum
```

#### `mobile(options?)`

Validates Taiwan mobile phone numbers.

```typescript
import { mobile } from '@hy_ong/zod-kit'

const phoneSchema = mobile({
  allowInternational: true,  // Allow +886 prefix
  allowSeparators: true,     // Allow 0912-345-678
  operators: ['09']          // Restrict to specific operators
})
```

#### `tel(options?)`

Validates Taiwan landline telephone numbers.

```typescript
import { tel } from '@hy_ong/zod-kit'

const landlineSchema = tel({
  allowSeparators: true,     // Allow 02-1234-5678
  areaCodes: ['02', '03']    // Restrict to specific areas
})
```

#### `fax(options?)`

Validates Taiwan fax numbers (same format as landline).

```typescript
import { fax } from '@hy_ong/zod-kit'

const faxSchema = fax()
faxSchema.parse('02-2345-6789') // ✅ Valid fax number
```

#### `postalCode(options?)`

Validates Taiwan postal codes with support for 3-digit, 5-digit, and 6-digit formats.

```typescript
import { postalCode } from '@hy_ong/zod-kit'

// Accept 3-digit or 6-digit formats (recommended)
const modernSchema = postalCode()
modernSchema.parse('100')     // ✅ Valid 3-digit
modernSchema.parse('100001')  // ✅ Valid 6-digit

// Accept all formats
const flexibleSchema = postalCode({ format: 'all' })
flexibleSchema.parse('100')     // ✅ Valid
flexibleSchema.parse('10001')   // ✅ Valid (5-digit legacy)
flexibleSchema.parse('100001')  // ✅ Valid

// Only 6-digit format (current standard)
const modernOnlySchema = postalCode({ format: '6' })
modernOnlySchema.parse('100001') // ✅ Valid
modernOnlySchema.parse('100')    // ❌ Invalid

// With dashes allowed
const dashSchema = postalCode({ allowDashes: true })
dashSchema.parse('100-001')  // ✅ Valid (normalized to '100001')

// Specific areas only
const taipeiSchema = postalCode({
  allowedPrefixes: ['100', '103', '104', '105', '106']
})
taipeiSchema.parse('100001') // ✅ Valid (Taipei area)
taipeiSchema.parse('200001') // ❌ Invalid (not in allowlist)
```

## 🌐 Internationalization

Zod Kit supports multiple languages for error messages:

```typescript
import { setLocale } from '@hy_ong/zod-kit'

// Set global locale
setLocale('zh-TW') // Traditional Chinese
setLocale('en')    // English (default)

// Or use custom messages per validator
const emailSchema = email({
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

Make any field optional by setting `required: false`:

```typescript
const optionalEmail = email({ required: false })

optionalEmail.parse(null)      // ✅ null
optionalEmail.parse('')        // ✅ null
optionalEmail.parse('test@example.com') // ✅ "test@example.com"
```

### Custom Transformations

Transform values during validation:

```typescript
const trimmedText = text({
  transform: (val) => val.trim().toLowerCase(),
  minLength: 1
})

trimmedText.parse('  HELLO  ') // ✅ "hello"
```

### Whitelist Validation

Allow specific values regardless of format:

```typescript
const flexibleId = id({
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
  email: email(),
  password: password({ minLength: 8 }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match"
})
```

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
npm run test:watch
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
npm run test:coverage      # Run with coverage report
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