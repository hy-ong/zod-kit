/**
 * @fileoverview Taiwan Business ID (統一編號) validator for Zod Kit
 *
 * Provides validation for Taiwan Business Identification Numbers (統一編號) with
 * support for both new (2023+) and legacy validation rules.
 *
 * @author Ong Hoe Yuan
 * @version 0.0.5
 */

import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

/**
 * Type definition for business ID validation error messages
 *
 * @interface BusinessIdMessages
 * @property {string} [required] - Message when field is required but empty
 * @property {string} [invalid] - Message when business ID format or checksum is invalid
 */
export type BusinessIdMessages = {
  required?: string
  invalid?: string
}

/**
 * Configuration options for Taiwan business ID validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 *
 * @interface BusinessIdOptions
 * @property {IsRequired} [required=true] - Whether the field is required
 * @property {Function} [transform] - Custom transformation function for business ID
 * @property {string | null} [defaultValue] - Default value when input is empty
 * @property {Record<Locale, BusinessIdMessages>} [i18n] - Custom error messages for different locales
 */
export type BusinessIdOptions<IsRequired extends boolean = true> = {
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Record<Locale, BusinessIdMessages>
}

/**
 * Type alias for business ID validation schema based on required flag
 *
 * @template IsRequired - Whether the field is required
 * @typedef BusinessIdSchema
 * @description Returns ZodString if required, ZodNullable<ZodString> if optional
 */
export type BusinessIdSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

/**
 * Validates Taiwan Business Identification Number (統一編號)
 *
 * @param {string} value - The business ID to validate
 * @returns {boolean} True if the business ID is valid
 *
 * @description
 * Validates Taiwan Business ID using both new (2023+) and legacy validation rules.
 * The validation includes format checking (8 digits) and checksum verification.
 *
 * Validation rules:
 * 1. Must be exactly 8 digits
 * 2. Weighted sum calculation using coefficients [1,2,1,2,1,2,4] for first 7 digits
 * 3. New rules (2023+): Sum + 8th digit must be divisible by 5
 * 4. Legacy rules: Sum + 8th digit must be divisible by 10
 * 5. Special case: If 7th digit is 7, try alternative calculation with +1
 *
 * @example
 * ```typescript
 * validateTaiwanBusinessId("12345675") // true (if valid checksum)
 * validateTaiwanBusinessId("1234567") // false (not 8 digits)
 * validateTaiwanBusinessId("abcd1234") // false (not all digits)
 * ```
 */
const validateTaiwanBusinessId = (value: string): boolean => {
  // Must be exactly 8 digits
  if (!/^\d{8}$/.test(value)) {
    return false
  }

  const digits = value.split('').map(Number)

  // Coefficients for the first 7 digits
  const coefficients = [1, 2, 1, 2, 1, 2, 4]

  // Calculate weighted sum for first 7 digits
  let sum = 0
  for (let i = 0; i < 7; i++) {
    const product = digits[i] * coefficients[i]
    // Add individual digits of the product (split if >= 10)
    sum += Math.floor(product / 10) + (product % 10)
  }

  // Add the check digit (8th digit)
  sum += digits[7]

  // New rules (2023+): Valid if sum is divisible by 5
  if (sum % 5 === 0) {
    return true
  }

  // Fall back to old rules: Valid if sum is divisible by 10
  if (sum % 10 === 0) {
    return true
  }

  // Special case for old rules: if 7th digit is 7
  if (digits[6] === 7) {
    let altSum = 0
    for (let i = 0; i < 7; i++) {
      const product = digits[i] * coefficients[i]
      altSum += Math.floor(product / 10) + (product % 10)
    }
    // Add 1 and check digit
    altSum += 1 + digits[7]

    // Check both new and old rules
    if (altSum % 5 === 0 || altSum % 10 === 0) {
      return true
    }
  }

  return false
}

/**
 * Creates a Zod schema for Taiwan Business ID validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @param {BusinessIdOptions<IsRequired>} [options] - Configuration options for business ID validation
 * @returns {BusinessIdSchema<IsRequired>} Zod schema for business ID validation
 *
 * @description
 * Creates a comprehensive Taiwan Business ID validator that validates the format
 * and checksum according to Taiwan government specifications.
 *
 * Features:
 * - 8-digit format validation
 * - Checksum verification (supports both new 2023+ and legacy rules)
 * - Automatic trimming and preprocessing
 * - Custom transformation functions
 * - Comprehensive internationalization
 * - Optional field support
 *
 * @example
 * ```typescript
 * // Basic business ID validation
 * const basicSchema = businessId() // optional by default
 * basicSchema.parse("12345675") // ✓ Valid (if checksum correct)
 * basicSchema.parse(null) // ✓ Valid (optional)
 *
 * // Required validation
 * const requiredSchema = parse("12345675") // ✓ Valid (if checksum correct)
(true)
 * requiredSchema.parse(null) // ✗ Invalid (required)
 *
 * basicSchema.parse("1234567") // ✗ Invalid (not 8 digits)
 *
 * // Optional business ID
 * const optionalSchema = businessId(false)
 * optionalSchema.parse("") // ✓ Valid (returns null)
 * optionalSchema.parse("12345675") // ✓ Valid (if checksum correct)
 *
 * // With custom transformation
 * const transformSchema = businessId(false, {
 *   transform: (value) => value.replace(/[^0-9]/g, '') // Remove non-digits
 * })
 * transformSchema.parse("1234-5675") // ✓ Valid (if checksum correct after cleaning)
 *
 * // With custom error messages
 * const customSchema = businessId(false, {
 *   i18n: {
 *     en: { invalid: "Please enter a valid Taiwan Business ID" },
 *     'zh-TW': { invalid: "請輸入有效的統一編號" }
 *   }
 * })
 * ```
 *
 * @throws {z.ZodError} When validation fails with specific error messages
 * @see {@link BusinessIdOptions} for all available configuration options
 * @see {@link validateTaiwanBusinessId} for validation logic details
 */
export function businessId<IsRequired extends boolean = false>(required?: IsRequired, options?: Omit<BusinessIdOptions<IsRequired>, 'required'>): BusinessIdSchema<IsRequired> {
  const {
    transform,
    defaultValue,
    i18n
  } = options ?? {}

  const isRequired = required ?? false as IsRequired

  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? (isRequired ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof BusinessIdMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`taiwan.businessId.${key}`, params)
  }

  // Preprocessing function
  const preprocessFn = (val: unknown) => {
    if (val === "" || val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val).trim()

    // If after trimming we have an empty string and the field is optional, return null
    if (processed === "" && !required) {
      return null
    }

    if (transform) {
      processed = transform(processed)
    }

    return processed
  }

  const baseSchema = isRequired ? z.preprocess(preprocessFn, z.string()) : z.preprocess(preprocessFn, z.string().nullable())

  const schema = baseSchema.refine((val) => {
    if (val === null) return true

    // Required check
    if (isRequired && (val === "" || val === "null" || val === "undefined")) {
      throw new z.ZodError([{ code: "custom", message: getMessage("required"), path: [] }])
    }

    if (val === null) return true
    if (!isRequired && val === "") return true

    // Taiwan Business ID format validation (8 digits + checksum)
    if (!validateTaiwanBusinessId(val)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("invalid"), path: [] }])
    }

    return true
  })

  return schema as unknown as BusinessIdSchema<IsRequired>
}

/**
 * Utility function exported for external use
 *
 * @description
 * The validation function can be used independently for business ID validation
 * without creating a full Zod schema.
 *
 * @example
 * ```typescript
 * import { validateTaiwanBusinessId } from './business-id'
 *
 * // Direct validation
 * const isValid = validateTaiwanBusinessId("12345675") // boolean
 * ```
 */
export { validateTaiwanBusinessId }