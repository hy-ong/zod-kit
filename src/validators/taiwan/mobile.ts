/**
 * @fileoverview Taiwan Mobile Phone Number validator for Zod Kit
 *
 * Provides validation for Taiwan mobile phone numbers with support for
 * all Taiwan mobile network operators and whitelist functionality.
 *
 * @author Ong Hoe Yuan
 * @version 0.0.5
 */

import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

/**
 * Type definition for mobile phone validation error messages
 *
 * @interface TwMobileMessages
 * @property {string} [required] - Message when field is required but empty
 * @property {string} [invalid] - Message when mobile number format is invalid
 * @property {string} [notInWhitelist] - Message when mobile number is not in whitelist
 */
export type TwMobileMessages = {
  required?: string
  invalid?: string
  notInWhitelist?: string
}

/**
 * Configuration options for Taiwan mobile phone validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 *
 * @interface TwMobileOptions
 * @property {IsRequired} [required=true] - Whether the field is required
 * @property {string[]} [whitelist] - Array of specific mobile numbers that are always allowed
 * @property {Function} [transform] - Custom transformation function for mobile number
 * @property {string | null} [defaultValue] - Default value when input is empty
 * @property {Record<Locale, TwMobileMessages>} [i18n] - Custom error messages for different locales
 */
export type TwMobileOptions<IsRequired extends boolean = true> = {
  whitelist?: string[]
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Record<Locale, TwMobileMessages>
}

/**
 * Type alias for mobile phone validation schema based on required flag
 *
 * @template IsRequired - Whether the field is required
 * @typedef TwMobileSchema
 * @description Returns ZodString if required, ZodNullable<ZodString> if optional
 */
export type TwMobileSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

/**
 * Validates Taiwan mobile phone number format
 *
 * @param {string} value - The mobile phone number to validate
 * @returns {boolean} True if the mobile number is valid
 *
 * @description
 * Validates Taiwan mobile phone numbers according to the official numbering plan.
 * Taiwan mobile numbers use the format: 09X-XXXX-XXXX (10 digits total).
 *
 * Valid prefixes: 090, 091, 092, 093, 094, 095, 096, 097, 098, 099
 * - All major Taiwan mobile operators are covered
 * - Format: 09[0-9] followed by 7 additional digits
 *
 * @example
 * ```typescript
 * validateTaiwanMobile("0912345678") // true
 * validateTaiwanMobile("0987654321") // true
 * validateTaiwanMobile("0812345678") // false (invalid prefix)
 * validateTaiwanMobile("091234567") // false (too short)
 * ```
 */
const validateTaiwanMobile = (value: string): boolean => {
  // Taiwan mobile phone format: 09 + 8 digits
  // Valid prefixes: 090, 091, 092, 093, 094, 095, 096, 097, 098, 099

  // Remove common separators for validation
  const cleanValue = value.replace(/[-\s]/g, "")

  return /^09[0-9]\d{7}$/.test(cleanValue)
}

/**
 * Creates a Zod schema for Taiwan mobile phone number validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @param {IsRequired} [required=false] - Whether the field is required
 * @param {Omit<ValidatorOptions<IsRequired>, 'required'>} [options] - Configuration options for validation
 * @returns {TwMobileSchema<IsRequired>} Zod schema for mobile phone validation
 *
 * @description
 * Creates a comprehensive Taiwan mobile phone number validator with support for
 * all Taiwan mobile network operators and optional whitelist functionality.
 *
 * Features:
 * - Taiwan mobile number format validation (09X-XXXX-XXXX)
 * - Support for all Taiwan mobile operators (090-099 prefixes)
 * - Whitelist functionality for specific allowed numbers
 * - Automatic trimming and preprocessing
 * - Custom transformation functions
 * - Comprehensive internationalization
 * - Optional field support
 *
 * @example
 * ```typescript
 * // Basic mobile number validation
 * const basicSchema = twMobile() // optional by default
 * basicSchema.parse("0912345678") // ✓ Valid
 * basicSchema.parse(null) // ✓ Valid (optional)
 *
 * // Required validation
 * const requiredSchema = parse("0912345678") // ✓ Valid
(true)
 * requiredSchema.parse(null) // ✗ Invalid (required)
 *
 * basicSchema.parse("0987654321") // ✓ Valid
 * basicSchema.parse("0812345678") // ✗ Invalid (wrong prefix)
 *
 * // With whitelist (only specific numbers allowed)
 * const whitelistSchema = twMobile(false, {
 *   whitelist: ["0912345678", "0987654321"]
 * })
 * whitelistSchema.parse("0912345678") // ✓ Valid (in whitelist)
 * whitelistSchema.parse("0911111111") // ✗ Invalid (not in whitelist)
 *
 * // Optional mobile number
 * const optionalSchema = twMobile(false)
 * optionalSchema.parse("") // ✓ Valid (returns null)
 * optionalSchema.parse("0912345678") // ✓ Valid
 *
 * // With custom transformation
 * const transformSchema = twMobile(false, {
 *   transform: (value) => value.replace(/[^0-9]/g, '') // Remove non-digits
 * })
 * transformSchema.parse("091-234-5678") // ✓ Valid (formatted input)
 * transformSchema.parse("091 234 5678") // ✓ Valid (spaced input)
 *
 * // With custom error messages
 * const customSchema = twMobile(false, {
 *   i18n: {
 *     en: { invalid: "Please enter a valid Taiwan mobile number" },
 *     'zh-TW': { invalid: "請輸入有效的台灣手機號碼" }
 *   }
 * })
 * ```
 *
 * @throws {z.ZodError} When validation fails with specific error messages
 * @see {@link TwMobileOptions} for all available configuration options
 * @see {@link validateTaiwanMobile} for validation logic details
 */
export function twMobile<IsRequired extends boolean = false>(required?: IsRequired, options?: Omit<TwMobileOptions<IsRequired>, 'required'>): TwMobileSchema<IsRequired> {
  const { whitelist, transform, defaultValue, i18n } = options ?? {}

  const isRequired = required ?? false as IsRequired

  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? (isRequired ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof TwMobileMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`taiwan.mobile.${key}`, params)
  }

  // Preprocessing function
  const preprocessFn = (val: unknown) => {
    if (val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val).trim()

    // If after trimming we have an empty string
    if (processed === "") {
      // If empty string is in allowlist, return it as is
      if (whitelist && whitelist.includes("")) {
        return ""
      }
      // If the field is optional and empty string not in allowlist, return default value
      if (!isRequired) {
        return actualDefaultValue
      }
      // If a field is required, return the default value (will be validated later)
      return actualDefaultValue
    }

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

    if (val === null) return
    if (!isRequired && val === "") return

    // Allowlist check (if in allowlist, accept regardless of format)
    if (whitelist && whitelist.length > 0 && whitelist.includes(val)) {
      return
    }

    // Taiwan mobile phone format validation
    if (!validateTaiwanMobile(val)) {
      ctx.addIssue({ code: "custom", message: getMessage("invalid") })
      return
    }
  })

  return schema as unknown as TwMobileSchema<IsRequired>
}

/**
 * Utility function exported for external use
 *
 * @description
 * The validation function can be used independently for mobile number validation
 * without creating a full Zod schema.
 *
 * @example
 * ```typescript
 * import { validateTaiwanMobile } from './mobile'
 *
 * // Direct validation
 * const isValid = validateTaiwanMobile("0912345678") // boolean
 * ```
 */
export { validateTaiwanMobile }
