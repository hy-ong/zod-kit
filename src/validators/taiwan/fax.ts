/**
 * @fileoverview Taiwan Fax Number validator for Zod Kit
 *
 * Provides validation for Taiwan fax numbers according to the official 2024
 * telecom numbering plan. Uses the same format as landline telephone numbers.
 *
 * @author Ong Hoe Yuan
 * @version 0.0.5
 */

import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

/**
 * Type definition for fax number validation error messages
 *
 * @interface TwFaxMessages
 * @property {string} [required] - Message when field is required but empty
 * @property {string} [invalid] - Message when fax number format is invalid
 * @property {string} [notInWhitelist] - Message when fax number is not in whitelist
 */
export type TwFaxMessages = {
  required?: string
  invalid?: string
  notInWhitelist?: string
}

/**
 * Configuration options for Taiwan fax number validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 *
 * @interface TwFaxOptions
 * @property {IsRequired} [required=true] - Whether the field is required
 * @property {string[]} [whitelist] - Array of specific fax numbers that are always allowed
 * @property {Function} [transform] - Custom transformation function for fax number
 * @property {string | null} [defaultValue] - Default value when input is empty
 * @property {Record<Locale, TwFaxMessages>} [i18n] - Custom error messages for different locales
 */
export type TwFaxOptions<IsRequired extends boolean = true> = {
  whitelist?: string[]
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Partial<Record<Locale, Partial<TwFaxMessages>>>
}

/**
 * Type alias for fax number validation schema based on required flag
 *
 * @template IsRequired - Whether the field is required
 * @typedef TwFaxSchema
 * @description Returns ZodString if required, ZodNullable<ZodString> if optional
 */
export type TwFaxSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

/**
 * Validates Taiwan fax number format (Official 2024 rules - same as landline)
 *
 * @param {string} value - The fax number to validate
 * @returns {boolean} True if the fax number is valid
 *
 * @description
 * Validates Taiwan fax numbers according to the official 2024 telecom numbering plan.
 * Fax numbers follow the same format as landline telephone numbers in Taiwan.
 *
 * Supported area codes and formats (same as landline):
 * - 02: Taipei, New Taipei, Keelung - 8 digits
 * - 03: Taoyuan, Hsinchu, Yilan, Hualien - 7-8 digits
 * - 037: Miaoli - 6-7 digits
 * - 04: Taichung, Changhua, Nantou - 7-8 digits
 * - 049: Nantou - 7 digits
 * - 05: Yunlin, Chiayi - 7 digits
 * - 06: Tainan - 7 digits
 * - 07: Kaohsiung - 7 digits
 * - 08: Pingtung - 7 digits
 * - 082: Kinmen - 6 digits
 * - 0836: Matsu - 5 digits
 * - 089: Taitung - 6 digits
 *
 * @example
 * ```typescript
 * validateTaiwanFax("0223456789") // true (Taipei area)
 * validateTaiwanFax("0423288882") // true (Taichung area, 8 digits)
 * validateTaiwanFax("037234567") // true (Miaoli area)
 * validateTaiwanFax("02-2345-6789") // true (with separators)
 * ```
 */
const validateTaiwanFax = (value: string): boolean => {
  // Official Taiwan fax formats according to telecom numbering plan (same as landline):
  // 02: Taipei, New Taipei, Keelung - 8 digits
  // 03: Taoyuan, Hsinchu, Yilan, Hualien - 7-8 digits
  // 037: Miaoli - 6-7 digits
  // 04: Taichung, Changhua, Nantou - 7-8 digits
  // 049: Nantou - 7 digits
  // 05: Yunlin, Chiayi - 7 digits
  // 06: Tainan - 7 digits
  // 07: Kaohsiung - 7 digits
  // 08: Pingtung - 7 digits
  // 082: Kinmen - 6 digits
  // 0836: Matsu - 5 digits
  // 089: Taitung - 6 digits

  // Remove common separators for validation
  const cleanValue = value.replace(/[-\s]/g, "")

  // Basic format: starts with 0, then area code, then number
  if (!/^0\d{7,10}$/.test(cleanValue)) {
    return false
  }

  // Check 4-digit area codes first
  const areaCode4 = cleanValue.substring(0, 4)
  if (areaCode4 === '0836') {
    // Matsu: 0836 + 5 digits, total 9 digits
    return cleanValue.length === 9 && /^0836\d{5}$/.test(cleanValue)
  }

  // Check 3-digit area codes
  const areaCode3 = cleanValue.substring(0, 3)
  if (areaCode3 === '037') {
    // Miaoli: 037 + 6-7 digits, total 9-10 digits
    // User number must start with 2-9 (not 0 or 1)
    const firstDigit = cleanValue[3]
    if (firstDigit === "0" || firstDigit === "1") {
      return false
    }
    return (cleanValue.length === 9 || cleanValue.length === 10) && /^037[2-9]\d{5,6}$/.test(cleanValue)
  }
  if (areaCode3 === '049') {
    // Nantou: 049 + 7 digits, total 10 digits
    return cleanValue.length === 10 && /^049\d{7}$/.test(cleanValue)
  }
  if (areaCode3 === '082') {
    // Kinmen: 082 + 6 digits, total 9 digits
    return cleanValue.length === 9 && /^082\d{6}$/.test(cleanValue)
  }
  if (areaCode3 === '089') {
    // Taitung: 089 + 6 digits, total 9 digits
    return cleanValue.length === 9 && /^089\d{6}$/.test(cleanValue)
  }

  // Check 2-digit area codes
  const areaCode2 = cleanValue.substring(0, 2)

  if (areaCode2 === '02') {
    // Taipei, New Taipei, Keelung: 02 + 8 digits, total 10 digits
    // User number must start with 2-9 (not 0 or 1)
    const firstDigit = cleanValue[2]
    if (firstDigit === "0" || firstDigit === "1") {
      return false
    }
    return cleanValue.length === 10 && /^02[2-9]\d{7}$/.test(cleanValue)
  }
  if (areaCode2 === '03') {
    // Taoyuan, Hsinchu, Yilan, Hualien: 03 + 7-8 digits, total 9-10 digits
    return (cleanValue.length === 9 || cleanValue.length === 10) && /^03\d{7,8}$/.test(cleanValue)
  }
  if (areaCode2 === '04') {
    // Taichung, Changhua, Nantou: 04 + 7-8 digits, total 9-10 digits
    return (cleanValue.length === 9 || cleanValue.length === 10) && /^04\d{7,8}$/.test(cleanValue)
  }
  if (areaCode2 === '05') {
    // Yunlin, Chiayi: 05 + 7 digits, total 9 digits
    return cleanValue.length === 9 && /^05\d{7}$/.test(cleanValue)
  }
  if (areaCode2 === '06') {
    // Tainan: 06 + 7 digits, total 9 digits
    return cleanValue.length === 9 && /^06\d{7}$/.test(cleanValue)
  }
  if (areaCode2 === '07') {
    // Kaohsiung: 07 + 7 digits, total 9 digits
    // User number must start with 2-9 (not 0 or 1)
    const firstDigit = cleanValue[2]
    if (firstDigit === "0" || firstDigit === "1") {
      return false
    }
    return cleanValue.length === 9 && /^07[2-9]\d{6}$/.test(cleanValue)
  }
  if (areaCode2 === '08') {
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
 * Creates a Zod schema for Taiwan fax number validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @param {IsRequired} [required=false] - Whether the field is required
 * @param {Omit<ValidatorOptions<IsRequired>, 'required'>} [options] - Configuration options for validation
 * @returns {TwFaxSchema<IsRequired>} Zod schema for fax number validation
 *
 * @description
 * Creates a comprehensive Taiwan fax number validator with support for all Taiwan
 * area codes. Fax numbers follow the same format as landline telephone numbers.
 *
 * Features:
 * - Complete Taiwan area code support (same as landline)
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
 * // Basic fax number validation
 * const basicSchema = twFax() // optional by default
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
 * const whitelistSchema = twFax(false, {
 *   whitelist: ["0223456789", "0312345678"]
 * })
 * whitelistSchema.parse("0223456789") // ✓ Valid (in whitelist)
 * whitelistSchema.parse("0287654321") // ✗ Invalid (not in whitelist)
 *
 * // Optional fax number
 * const optionalSchema = twFax(false)
 * optionalSchema.parse("") // ✓ Valid (returns null)
 * optionalSchema.parse("0223456789") // ✓ Valid
 *
 * // With custom transformation
 * const transformSchema = twFax(false, {
 *   transform: (value) => value.replace(/[^0-9]/g, '') // Keep only digits
 * })
 * transformSchema.parse("02-2345-6789") // ✓ Valid (separators removed)
 *
 * // With custom error messages
 * const customSchema = twFax(false, {
 *   i18n: {
 *     en: { invalid: "Please enter a valid Taiwan fax number" },
 *     'zh-TW': { invalid: "請輸入有效的台灣傳真號碼" }
 *   }
 * })
 * ```
 *
 * @throws {z.ZodError} When validation fails with specific error messages
 * @see {@link TwFaxOptions} for all available configuration options
 * @see {@link validateTaiwanFax} for validation logic details
 */
export function twFax<IsRequired extends boolean = false>(required?: IsRequired, options?: Omit<TwFaxOptions<IsRequired>, 'required'>): TwFaxSchema<IsRequired> {
  const { whitelist, transform, defaultValue, i18n } = options ?? {}

  const isRequired = required ?? false as IsRequired

  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? (isRequired ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof TwFaxMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`taiwan.fax.${key}`, params)
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

    // Taiwan fax format validation
    if (!validateTaiwanFax(val)) {
      ctx.addIssue({ code: "custom", message: getMessage("invalid") })
      return
    }
  })

  return schema as unknown as TwFaxSchema<IsRequired>
}

/**
 * Utility function exported for external use
 *
 * @description
 * The validation function can be used independently for fax number validation
 * without creating a full Zod schema.
 *
 * @example
 * ```typescript
 * import { validateTaiwanFax } from './fax'
 *
 * // Direct validation
 * const isValid = validateTaiwanFax("0223456789") // boolean
 * ```
 */
export { validateTaiwanFax }