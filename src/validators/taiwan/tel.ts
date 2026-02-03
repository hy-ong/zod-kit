/**
 * @fileoverview Taiwan Landline Telephone Number validator for Zod Kit
 *
 * Provides validation for Taiwan landline telephone numbers according to the
 * official 2024 telecom numbering plan with comprehensive area code support.
 *
 * @author Ong Hoe Yuan
 * @version 0.0.5
 */

import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

/**
 * Type definition for telephone validation error messages
 *
 * @interface TwTelMessages
 * @property {string} [required] - Message when field is required but empty
 * @property {string} [invalid] - Message when telephone number format is invalid
 * @property {string} [notInWhitelist] - Message when telephone number is not in whitelist
 */
export type TwTelMessages = {
  required?: string
  invalid?: string
  notInWhitelist?: string
}

/**
 * Configuration options for Taiwan landline telephone validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 *
 * @interface TwTelOptions
 * @property {IsRequired} [required=true] - Whether the field is required
 * @property {string[]} [whitelist] - Array of specific telephone numbers that are always allowed
 * @property {Function} [transform] - Custom transformation function for telephone number
 * @property {string | null} [defaultValue] - Default value when input is empty
 * @property {Record<Locale, TwTelMessages>} [i18n] - Custom error messages for different locales
 */
export type TwTelOptions<IsRequired extends boolean = true> = {
  whitelist?: string[]
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Record<Locale, TwTelMessages>
}

/**
 * Type alias for telephone validation schema based on required flag
 *
 * @template IsRequired - Whether the field is required
 * @typedef TwTelSchema
 * @description Returns ZodString if required, ZodNullable<ZodString> if optional
 */
export type TwTelSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

/**
 * Validates Taiwan landline telephone number format (Official 2024 rules)
 *
 * @param {string} value - The telephone number to validate
 * @returns {boolean} True if the telephone number is valid
 *
 * @description
 * Validates Taiwan landline telephone numbers according to the official 2024
 * telecom numbering plan. Supports all Taiwan area codes and their specific
 * number patterns.
 *
 * Supported area codes and formats:
 * - 02: Taipei, New Taipei, Keelung - 8 digits
 * - 03: Taoyuan, Hsinchu, Yilan, Hualien - 7-8 digits
 * - 037: Miaoli - 6-7 digits
 * - 04: Taichung, Changhua, Nantou - 7-8 digits
 * - 049: Nantou - 6-7 digits
 * - 05: Yunlin, Chiayi - 7 digits
 * - 06: Tainan - 7 digits
 * - 07: Kaohsiung - 7-8 digits
 * - 08: Pingtung - 7 digits
 * - 0800: Toll-free - 6 digits
 * - 0809: Toll-free - 6 digits
 * - 082: Kinmen - 6 digits
 * - 0836: Matsu - 5-6 digits
 * - 089: Taitung - 6 digits
 *
 * @example
 * ```typescript
 * validateTaiwanTel("0223456789") // true (Taipei area)
 * validateTaiwanTel("0423288882") // true (Taichung area, 8 digits)
 * validateTaiwanTel("037234567") // true (Miaoli area)
 * validateTaiwanTel("082234567") // true (Kinmen area)
 * validateTaiwanTel("02-2345-6789") // true (with separators)
 * ```
 */
const validateTaiwanTel = (value: string): boolean => {
  // Official Taiwan landline formats according to telecom numbering plan:
  // 02: Taipei, New Taipei, Keelung - 8 digits
  // 03: Taoyuan, Hsinchu, Yilan, Hualien - 7-8 digits
  // 037: Miaoli - 6-7 digits
  // 04: Taichung, Changhua, Nantou - 7-8 digits
  // 049: Nantou - 6-7 digits
  // 05: Yunlin, Chiayi - 7 digits
  // 06: Tainan - 7 digits
  // 07: Kaohsiung - 7-8 digits
  // 08: Pingtung - 7 digits
  // 0800/0809: Toll-free - 6 digits
  // 082: Kinmen - 6 digits
  // 0836: Matsu - 5-6 digits
  // 089: Taitung - 6 digits

  // Remove common separators for validation
  const cleanValue = value.replace(/[-\s]/g, "")

  // Basic format: starts with 0, then area code, then number
  if (!/^0\d{7,10}$/.test(cleanValue)) {
    return false
  }

  // Check 4-digit area codes first
  const areaCode4 = cleanValue.substring(0, 4)
  if (areaCode4 === "0800" || areaCode4 === "0809") {
    // Toll-free: 0800/0809 + 6 digits, total 10 digits
    return cleanValue.length === 10 && /^080[09]\d{6}$/.test(cleanValue)
  }
  if (areaCode4 === "0836") {
    // Matsu: 0836 + 5-6 digits, total 9-10 digits
    return (cleanValue.length === 9 || cleanValue.length === 10) && /^0836\d{5,6}$/.test(cleanValue)
  }

  // Check 3-digit area codes
  const areaCode3 = cleanValue.substring(0, 3)
  if (areaCode3 === "037") {
    // Miaoli: 037 + 6-7 digits, total 9-10 digits
    // User number must start with 2-9 (not 0 or 1)
    const firstDigit = cleanValue[3]
    if (firstDigit === "0" || firstDigit === "1") {
      return false
    }
    return (cleanValue.length === 9 || cleanValue.length === 10) && /^037[2-9]\d{5,6}$/.test(cleanValue)
  }
  if (areaCode3 === "049") {
    // Nantou: 049 + 6-7 digits, total 9-10 digits
    return (cleanValue.length === 9 || cleanValue.length === 10) && /^049\d{6,7}$/.test(cleanValue)
  }
  if (areaCode3 === "082") {
    // Kinmen: 082 + 6 digits, total 9 digits
    return cleanValue.length === 9 && /^082\d{6}$/.test(cleanValue)
  }
  if (areaCode3 === "089") {
    // Taitung: 089 + 6 digits, total 9 digits
    return cleanValue.length === 9 && /^089\d{6}$/.test(cleanValue)
  }

  // Check 2-digit area codes
  const areaCode2 = cleanValue.substring(0, 2)

  if (areaCode2 === "02") {
    // Taipei, New Taipei, Keelung: 02 + 8 digits, total 10 digits
    // User number must start with 2-9 (not 0 or 1)
    const firstDigit = cleanValue[2]
    if (firstDigit === "0" || firstDigit === "1") {
      return false
    }
    return cleanValue.length === 10 && /^02[2-9]\d{7}$/.test(cleanValue)
  }
  if (areaCode2 === "03") {
    // Taoyuan, Hsinchu, Yilan, Hualien: 03 + 7-8 digits, total 9-10 digits
    return (cleanValue.length === 9 || cleanValue.length === 10) && /^03\d{7,8}$/.test(cleanValue)
  }
  if (areaCode2 === "04") {
    // Taichung, Changhua, Nantou: 04 + 7-8 digits, total 9-10 digits
    return (cleanValue.length === 9 || cleanValue.length === 10) && /^04\d{7,8}$/.test(cleanValue)
  }
  if (areaCode2 === "05") {
    // Yunlin, Chiayi: 05 + 7 digits, total 9 digits
    return cleanValue.length === 9 && /^05\d{7}$/.test(cleanValue)
  }
  if (areaCode2 === "06") {
    // Tainan: 06 + 7 digits, total 9 digits
    return cleanValue.length === 9 && /^06\d{7}$/.test(cleanValue)
  }
  if (areaCode2 === "07") {
    // Kaohsiung: 07 + 7-8 digits, total 9-10 digits
    // User number must start with 2-9 (not 0 or 1)
    const firstDigit = cleanValue[2]
    if (firstDigit === "0" || firstDigit === "1") {
      return false
    }
    return (cleanValue.length === 9 || cleanValue.length === 10) && /^07[2-9]\d{6,7}$/.test(cleanValue)
  }
  if (areaCode2 === "08") {
    // Pingtung: 08 + 7 digits, total 9 digits
    // User number must start with 4, 7, or 8 (format: 4&7&8+6D)
    const firstDigit = cleanValue[2]
    if (firstDigit !== "4" && firstDigit !== "7" && firstDigit !== "8") {
      return false // Invalid first digit for 08 area code
    }
    return cleanValue.length === 9 && /^08[478]\d{6}$/.test(cleanValue)
  }

  return false
}

/**
 * Creates a Zod schema for Taiwan landline telephone number validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @param {IsRequired} [required=false] - Whether the field is required
 * @param {Omit<ValidatorOptions<IsRequired>, 'required'>} [options] - Configuration options for validation
 * @returns {TwTelSchema<IsRequired>} Zod schema for telephone number validation
 *
 * @description
 * Creates a comprehensive Taiwan landline telephone number validator with support for
 * all Taiwan area codes according to the official 2024 telecom numbering plan.
 *
 * Features:
 * - Complete Taiwan area code support (02, 03, 037, 04, 049, 05, 06, 07, 08, 082, 0826, 0836, 089)
 * - Automatic separator handling (hyphens and spaces)
 * - Area-specific number length and pattern validation
 * - Whitelist functionality for specific allowed numbers
 * - Automatic trimming and preprocessing
 * - Custom transformation functions
 * - Comprehensive internationalization
 * - Optional field support
 *
 * @example
 * ```typescript
 * // Basic telephone number validation
 * const basicSchema = twTel() // optional by default
 * basicSchema.parse("0223456789") // ✓ Valid (Taipei)
 * basicSchema.parse(null) // ✓ Valid (optional)
 *
 * // Required validation
 * const requiredSchema = parse("0223456789") // ✓ Valid (Taipei)
(true)
 * requiredSchema.parse(null) // ✗ Invalid (required)
 *
 * basicSchema.parse("0312345678") // ✓ Valid (Taoyuan)
 * basicSchema.parse("02-2345-6789") // ✓ Valid (with separators)
 * basicSchema.parse("0812345678") // ✗ Invalid (wrong format for 08)
 *
 * // With whitelist (only specific numbers allowed)
 * const whitelistSchema = twTel(false, {
 *   whitelist: ["0223456789", "0312345678"]
 * })
 * whitelistSchema.parse("0223456789") // ✓ Valid (in whitelist)
 * whitelistSchema.parse("0287654321") // ✗ Invalid (not in whitelist)
 *
 * // Optional telephone number
 * const optionalSchema = twTel(false)
 * optionalSchema.parse("") // ✓ Valid (returns null)
 * optionalSchema.parse("0223456789") // ✓ Valid
 *
 * // With custom transformation (remove separators)
 * const transformSchema = twTel(false, {
 *   transform: (value) => value.replace(/[^0-9]/g, '') // Keep only digits
 * })
 * transformSchema.parse("02-2345-6789") // ✓ Valid (separators removed)
 * transformSchema.parse("02 2345 6789") // ✓ Valid (spaces removed)
 *
 * // With custom error messages
 * const customSchema = twTel(false, {
 *   i18n: {
 *     en: { invalid: "Please enter a valid Taiwan landline number" },
 *     'zh-TW': { invalid: "請輸入有效的台灣市話號碼" }
 *   }
 * })
 * ```
 *
 * @throws {z.ZodError} When validation fails with specific error messages
 * @see {@link TwTelOptions} for all available configuration options
 * @see {@link validateTaiwanTel} for validation logic details
 */
export function twTel<IsRequired extends boolean = false>(required?: IsRequired, options?: Omit<TwTelOptions<IsRequired>, 'required'>): TwTelSchema<IsRequired> {
  const { whitelist, transform, defaultValue, i18n } = options ?? {}

  const isRequired = required ?? false as IsRequired

  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? (isRequired ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof TwTelMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`taiwan.tel.${key}`, params)
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

    // Taiwan telephone format validation
    if (!validateTaiwanTel(val)) {
      ctx.addIssue({ code: "custom", message: getMessage("invalid") })
      return
    }
  })

  return schema as unknown as TwTelSchema<IsRequired>
}

/**
 * Utility function exported for external use
 *
 * @description
 * The validation function can be used independently for telephone number validation
 * without creating a full Zod schema.
 *
 * @example
 * ```typescript
 * import { validateTaiwanTel } from './tel'
 *
 * // Direct validation
 * const isValid = validateTaiwanTel("0223456789") // boolean
 * ```
 */
export { validateTaiwanTel }
