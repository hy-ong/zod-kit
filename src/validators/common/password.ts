/**
 * @fileoverview Password validator for Zod Kit
 *
 * Provides comprehensive password validation with strength analysis, character requirements,
 * security checks, and protection against common weak passwords.
 *
 * @author Ong Hoe Yuan
 * @version 0.0.5
 */

import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

/**
 * Type definition for password validation error messages
 *
 * @interface PasswordMessages
 * @property {string} [required] - Message when field is required but empty
 * @property {string} [min] - Message when password is too short
 * @property {string} [max] - Message when password is too long
 * @property {string} [uppercase] - Message when uppercase letters are required
 * @property {string} [lowercase] - Message when lowercase letters are required
 * @property {string} [digits] - Message when digits are required
 * @property {string} [special] - Message when special characters are required
 * @property {string} [noRepeating] - Message when repeating characters are forbidden
 * @property {string} [noSequential] - Message when sequential characters are forbidden
 * @property {string} [noCommonWords] - Message when common passwords are forbidden
 * @property {string} [minStrength] - Message when password strength is insufficient
 * @property {string} [excludes] - Message when password contains forbidden strings
 * @property {string} [includes] - Message when password doesn't contain required string
 * @property {string} [invalid] - Message when password doesn't match custom regex
 */
export type PasswordMessages = {
  required?: string
  min?: string
  max?: string
  uppercase?: string
  lowercase?: string
  digits?: string
  special?: string
  noRepeating?: string
  noSequential?: string
  noCommonWords?: string
  minStrength?: string
  excludes?: string
  includes?: string
  invalid?: string
}

/**
 * Password strength levels used for validation
 *
 * @typedef {"weak" | "medium" | "strong" | "very-strong"} PasswordStrength
 * @description
 * - weak: Basic passwords with minimal requirements
 * - medium: Passwords with some character variety
 * - strong: Passwords with good character variety and length
 * - very-strong: Passwords with excellent character variety, length, and complexity
 */
export type PasswordStrength = "weak" | "medium" | "strong" | "very-strong"

/**
 * Configuration options for password validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 *
 * @interface PasswordOptions
 * @property {IsRequired} [required=true] - Whether the field is required
 * @property {number} [min] - Minimum length of password
 * @property {number} [max] - Maximum length of password
 * @property {boolean} [uppercase] - Whether uppercase letters are required
 * @property {boolean} [lowercase] - Whether lowercase letters are required
 * @property {boolean} [digits] - Whether digits are required
 * @property {boolean} [special] - Whether special characters are required
 * @property {boolean} [noRepeating] - Whether to forbid repeating characters (3+ in a row)
 * @property {boolean} [noSequential] - Whether to forbid sequential characters (abc, 123)
 * @property {boolean} [noCommonWords] - Whether to forbid common weak passwords
 * @property {PasswordStrength} [minStrength] - Minimum required password strength
 * @property {string | string[]} [excludes] - String(s) that must not be included
 * @property {string} [includes] - String that must be included in password
 * @property {RegExp} [regex] - Custom regex pattern for validation
 * @property {Function} [transform] - Custom transformation function for password
 * @property {string | null} [defaultValue] - Default value when input is empty
 * @property {Record<Locale, PasswordMessages>} [i18n] - Custom error messages for different locales
 */
export type PasswordOptions<IsRequired extends boolean = true> = {
  min?: number
  max?: number
  uppercase?: boolean
  lowercase?: boolean
  digits?: boolean
  special?: boolean
  noRepeating?: boolean
  noSequential?: boolean
  noCommonWords?: boolean
  minStrength?: PasswordStrength
  excludes?: string | string[]
  includes?: string
  regex?: RegExp
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Partial<Record<Locale, Partial<PasswordMessages>>>
}

/**
 * Type alias for password validation schema based on required flag
 *
 * @template IsRequired - Whether the field is required
 * @typedef PasswordSchema
 * @description Returns ZodString if required, ZodNullable<ZodString> if optional
 */
export type PasswordSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

/**
 * List of common weak passwords to check against
 *
 * @constant {string[]} COMMON_PASSWORDS
 * @description Contains frequently used weak passwords that should be avoided
 */
const COMMON_PASSWORDS = [
  "password",
  "123456",
  "123456789",
  "12345678",
  "12345",
  "1234567",
  "admin",
  "qwerty",
  "abc123",
  "password123",
  "letmein",
  "welcome",
  "monkey",
  "dragon",
  "sunshine",
  "princess",
]

/**
 * Calculates password strength based on various criteria
 *
 * @param {string} password - The password to analyze
 * @returns {PasswordStrength} The calculated strength level
 *
 * @description
 * Analyzes password strength using multiple factors:
 * - Length bonuses (8+, 12+, 16+ characters)
 * - Character variety (lowercase, uppercase, digits, special characters)
 * - Deductions for repeating or sequential patterns
 *
 * Scoring system:
 * - 0-2 points: weak
 * - 3-4 points: medium
 * - 5-6 points: strong
 * - 7+ points: very-strong
 *
 * @example
 * ```typescript
 * calculatePasswordStrength("password") // "weak"
 * calculatePasswordStrength("Password123") // "medium"
 * calculatePasswordStrength("MyStr0ng!P@ssw0rd") // "very-strong"
 * ```
 */
const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0

  // Length bonus
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1

  // Character variety
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 1

  // Deductions
  if (/(.)\1{2,}/.test(password)) score -= 1 // Repeating characters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) score -= 1 // Sequential

  if (score <= 2) return "weak"
  if (score <= 4) return "medium"
  if (score <= 6) return "strong"
  return "very-strong"
}

/**
 * Creates a Zod schema for password validation with comprehensive security checks
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @param {IsRequired} [required=false] - Whether the field is required
 * @param {Omit<ValidatorOptions<IsRequired>, 'required'>} [options] - Configuration options for validation
 * @returns {PasswordSchema<IsRequired>} Zod schema for password validation
 *
 * @description
 * Creates a comprehensive password validator with strength analysis, character requirements,
 * security checks, and protection against common weak passwords.
 *
 * Features:
 * - Length validation (min/max)
 * - Character requirements (uppercase, lowercase, digits, special)
 * - Security checks (no repeating, no sequential patterns)
 * - Common password detection
 * - Strength analysis with configurable minimum levels
 * - Content inclusion/exclusion
 * - Custom regex patterns
 * - Custom transformation functions
 * - Comprehensive internationalization
 *
 * @example
 * ```typescript
 * // Basic password validation
 * const basicSchema = password() // optional by default
 * basicSchema.parse("MyPassword123!") // ✓ Valid
 * basicSchema.parse(null) // ✓ Valid (optional)
 *
 * // Required validation
 * const requiredSchema = parse("MyPassword123!") // ✓ Valid
(true)
 * requiredSchema.parse(null) // ✗ Invalid (required)
 *
 *
 * // Strong password requirements
 * const strongSchema = password(false, {
 *   min: 12,
 *   uppercase: true,
 *   lowercase: true,
 *   digits: true,
 *   special: true,
 *   minStrength: "strong"
 * })
 *
 * // No common passwords
 * const secureSchema = password(false, {
 *   noCommonWords: true,
 *   noRepeating: true,
 *   noSequential: true
 * })
 * secureSchema.parse("password123") // ✗ Invalid (common password)
 * secureSchema.parse("aaa123") // ✗ Invalid (repeating characters)
 * secureSchema.parse("abc123") // ✗ Invalid (sequential characters)
 *
 * // Custom requirements
 * const customSchema = password(false, {
 *   min: 8,
 *   includes: "@", // Must contain @
 *   excludes: ["admin", "user"], // Cannot contain these words
 *   regex: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/ // Custom pattern
 * })
 *
 * // Minimum strength requirement
 * const strengthSchema = password(false, { minStrength: "very-strong" })
 * strengthSchema.parse("weak") // ✗ Invalid (insufficient strength)
 * strengthSchema.parse("MyVeryStr0ng!P@ssw0rd2024") // ✓ Valid
 *
 * // Optional with default
 * const optionalSchema = password(false, {
 *   defaultValue: null
 * })
 * ```
 *
 * @throws {z.ZodError} When validation fails with specific error messages
 * @see {@link PasswordOptions} for all available configuration options
 * @see {@link PasswordStrength} for strength level definitions
 * @see {@link calculatePasswordStrength} for strength calculation logic
 */
export function password<IsRequired extends boolean = false>(required?: IsRequired, options?: Omit<PasswordOptions<IsRequired>, 'required'>): PasswordSchema<IsRequired> {
  const {
    min,
    max,
    uppercase,
    lowercase,
    digits,
    special,
    noRepeating,
    noSequential,
    noCommonWords,
    minStrength,
    excludes,
    includes,
    regex,
    transform,
    defaultValue,
    i18n,
  } = options ?? {}

  const isRequired = required ?? false as IsRequired

  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? (isRequired ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof PasswordMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.password.${key}`, params)
  }

  // Preprocessing function
  const preprocessFn = (val: unknown) => {
    if (val === "" || val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val)
    if (transform) {
      processed = transform(processed)
    }

    return processed
  }

  const baseSchema = isRequired ? z.preprocess(preprocessFn, z.string()) : z.preprocess(preprocessFn, z.string().nullable())

  const schema = baseSchema.superRefine((val, ctx) => {
    if (val === null) return

    // Required check
    if (isRequired && (val === "" || val === "null" || val === "undefined")) {
      ctx.addIssue({ code: "custom", message: getMessage("required") })
      return
    }

    // Length checks
    if (val !== null && min !== undefined && val.length < min) {
      ctx.addIssue({ code: "custom", message: getMessage("min", { min }) })
      return
    }
    if (val !== null && max !== undefined && val.length > max) {
      ctx.addIssue({ code: "custom", message: getMessage("max", { max }) })
      return
    }

    // Character requirements
    if (val !== null && uppercase && !/[A-Z]/.test(val)) {
      ctx.addIssue({ code: "custom", message: getMessage("uppercase") })
      return
    }
    if (val !== null && lowercase && !/[a-z]/.test(val)) {
      ctx.addIssue({ code: "custom", message: getMessage("lowercase") })
      return
    }
    if (val !== null && digits && !/[0-9]/.test(val)) {
      ctx.addIssue({ code: "custom", message: getMessage("digits") })
      return
    }
    if (val !== null && special && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(val)) {
      ctx.addIssue({ code: "custom", message: getMessage("special") })
      return
    }

    // Advanced security checks
    if (val !== null && noRepeating && /(.)\1{2,}/.test(val)) {
      ctx.addIssue({ code: "custom", message: getMessage("noRepeating") })
      return
    }
    if (val !== null && noSequential && /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(val)) {
      ctx.addIssue({ code: "custom", message: getMessage("noSequential") })
      return
    }
    if (val !== null && noCommonWords && COMMON_PASSWORDS.some((common) => val.toLowerCase().includes(common.toLowerCase()))) {
      ctx.addIssue({ code: "custom", message: getMessage("noCommonWords") })
      return
    }
    if (val !== null && minStrength) {
      const strength = calculatePasswordStrength(val)
      const strengthLevels = ["weak", "medium", "strong", "very-strong"]
      const currentLevel = strengthLevels.indexOf(strength)
      const requiredLevel = strengthLevels.indexOf(minStrength)
      if (currentLevel < requiredLevel) {
        ctx.addIssue({ code: "custom", message: getMessage("minStrength", { minStrength }) })
        return
      }
    }

    // Content checks
    if (val !== null && includes !== undefined && !val.includes(includes)) {
      ctx.addIssue({ code: "custom", message: getMessage("includes", { includes }) })
      return
    }
    if (val !== null && excludes !== undefined) {
      const excludeList = Array.isArray(excludes) ? excludes : [excludes]
      for (const exclude of excludeList) {
        if (val.includes(exclude)) {
          ctx.addIssue({ code: "custom", message: getMessage("excludes", { excludes: exclude }) })
          return
        }
      }
    }
    if (val !== null && regex !== undefined && !regex.test(val)) {
      ctx.addIssue({ code: "custom", message: getMessage("invalid", { regex }) })
      return
    }
  })

  return schema as unknown as PasswordSchema<IsRequired>
}
