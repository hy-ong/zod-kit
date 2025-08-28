# Zod Kit

A TypeScript library that provides common validation schemas built on top of [Zod](https://github.com/colinhacks/zod) with internationalization support.

## Features

- 🔍 Pre-built validation schemas for common data types
- 🌐 Internationalization support (English and Traditional Chinese)
- 📝 TypeScript-first with full type safety
- ⚡ Built on top of Zod for robust validation
- 🎯 Configurable validation options

## Installation

```bash
npm install zod-kit 
```

## Quick Start

```typescript
import { email, password, text, number } from '@hy_ong/zod-kit'

// Email validation
const emailSchema = email({ label: 'Email' })
emailSchema.parse('user@example.com') // ✅

// Password validation with requirements
const passwordSchema = password({
  label: 'Password',
  min: 8,
  uppercase: true,
  lowercase: true,
  digits: true,
  special: true
})

// Text validation
const nameSchema = text({
  label: 'Name',
  min: 2,
  max: 50
})
```

## Available Schemas

### Email

```typescript
email({
  label: string,           // Field label for error messages
  required? : boolean,      // Default: true
  domain? : string,         // Restrict to specific domain
  min? : number,           // Minimum length
  max? : number,           // Maximum length
  includes? : string       // Must include substring
})
```

### Password

```typescript
password({
  label: string,          // Field label for error messages
  required? : boolean,     // Default: true
  min? : number,          // Minimum length
  max? : number,          // Maximum length
  uppercase? : boolean,   // Require uppercase letters
  lowercase? : boolean,   // Require lowercase letters
  digits? : boolean,      // Require digits
  special? : boolean      // Require special characters
})
```

### Text

```typescript
text({
  label: string,          // Field label for error messages
  required? : boolean,     // Default: true
  min? : number,          // Minimum length
  max? : number,          // Maximum length
  includes? : string,     // Must include substring
  regex? : RegExp         // Custom regex pattern
})
```

### Number

```typescript
number({
  label: string,          // Field label for error messages
  required? : boolean,     // Default: true
  min? : number,          // Minimum value
  max? : number,          // Maximum value
  positive? : boolean,    // Must be positive
  negative? : boolean,    // Must be negative
  finite? : boolean       // Must be finite
})
```

### Integer

```typescript
integer({
  label: string,          // Field label for error messages
  required? : boolean,     // Default: true
  min? : number,          // Minimum value
  max? : number,          // Maximum value
  positive? : boolean,    // Must be positive
  negative? : boolean     // Must be negative
})
```

### URL

```typescript
url({
  label: string,          // Field label for error messages
  required? : boolean,     // Default: true
  protocol? : string[]     // Allowed protocols (e.g., ['https'])
})
```

### Boolean

```typescript
boolean({
  label: string,          // Field label for error messages
  required? : boolean      // Default: true
})
```

## Internationalization

Set the locale for error messages:

```typescript
import { setLocale } from '@hy_ong/zod-kit'

// Set to Traditional Chinese (default is English)
setLocale('zh-TW')

// Set to English (default)
setLocale('en')
```

## Optional Fields

All schemas support optional validation by setting `required: false`:

```typescript
const optionalEmail = email({
  label: 'Email',
  required: false
})

optionalEmail.parse(null) // ✅ null
optionalEmail.parse('') // ✅ null
optionalEmail.parse('user@example.com') // ✅ 'user@example.com'
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build the package
npm run build
```

## License

MIT

## Author

Ong Hoe Yuan
