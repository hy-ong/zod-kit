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
 * @interface TelMessages
 * @property {string} [required] - Message when field is required but empty
 * @property {string} [invalid] - Message when telephone number format is invalid
 * @property {string} [notInWhitelist] - Message when telephone number is not in whitelist
 */
export type TelMessages = {
  required?: string
  invalid?: string
  notInWhitelist?: string
}

/**
 * Configuration options for Taiwan landline telephone validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 *
 * @interface TelOptions
 * @property {IsRequired} [required=true] - Whether the field is required
 * @property {string[]} [whitelist] - Array of specific telephone numbers that are always allowed
 * @property {Function} [transform] - Custom transformation function for telephone number
 * @property {string | null} [defaultValue] - Default value when input is empty
 * @property {Record<Locale, TelMessages>} [i18n] - Custom error messages for different locales
 */
export type TelOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  whitelist?: string[]
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Record<Locale, TelMessages>
}

/**
 * Type alias for telephone validation schema based on required flag
 *
 * @template IsRequired - Whether the field is required
 * @typedef TelSchema
 * @description Returns ZodString if required, ZodNullable<ZodString> if optional
 */
export type TelSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

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
 * - 02: Taipei, New Taipei, Keelung - 8 digits (2&3&5~8+7D)
 * - 03: Taoyuan, Hsinchu, Yilan, Hualien - 7 digits
 * - 037: Miaoli - 6 digits (2~9+5D)
 * - 04: Taichung, Changhua - 7 digits
 * - 049: Nantou - 7 digits (2~9+6D)
 * - 05: Yunlin, Chiayi - 7 digits
 * - 06: Tainan - 7 digits
 * - 07: Kaohsiung - 7 digits (2~9+6D)
 * - 08: Pingtung - 7 digits (4&7&8+6D)
 * - 082: Kinmen - 6 digits (2~5&7~9+5D)
 * - 0826: Wuqiu - 5 digits (6+4D)
 * - 0836: Matsu - 5 digits (2~9+4D)
 * - 089: Taitung - 6 digits (2~9+5D)
 *
 * @example
 * ```typescript
 * validateTaiwanTel("0223456789") // true (Taipei area)
 * validateTaiwanTel("0312345678") // true (Taoyuan area)
 * validateTaiwanTel("037234567") // true (Miaoli area)
 * validateTaiwanTel("082234567") // true (Kinmen area)
 * validateTaiwanTel("02-2345-6789") // true (with separators)
 * validateTaiwanTel("0812345678") // false (invalid for 08 area)
 * ```
 */
const validateTaiwanTel = (value: string): boolean => {
  // Official Taiwan landline formats according to telecom numbering plan:
  // 02: Taipei, New Taipei, Keelung - 8 digits (2&3&5~8+7D)
  // 03: Taoyuan, Hsinchu, Yilan, Hualien - 7 digits
  // 037: Miaoli - 6 digits (2~9+5D)
  // 04: Taichung, Changhua - 7 digits
  // 049: Nantou - 7 digits (2~9+6D)
  // 05: Yunlin, Chiayi - 7 digits
  // 06: Tainan - 7 digits
  // 07: Kaohsiung - 7 digits (2~9+6D)
  // 08: Pingtung - 7 digits (4&7&8+6D)
  // 082: Kinmen - 6 digits (2~5&7~9+5D)
  // 0826: Wuqiu - 5 digits (6+4D)
  // 0836: Matsu - 5 digits (2~9+4D)
  // 089: Taitung - 6 digits (2~9+5D)

  // Remove common separators for validation
  const cleanValue = value.replace(/[-\s]/g, "")

  // Basic format: starts with 0, then area code, then number
  if (!/^0\d{7,10}$/.test(cleanValue)) {
    return false
  }

  // Check 4-digit area codes first
  const areaCode4 = cleanValue.substring(0, 4)
  if (areaCode4 === "0826") {
    // Wuqiu: 0826 + 5 digits (6+4D), total 9 digits
    return cleanValue.length === 9 && /^0826[6]\d{4}$/.test(cleanValue)
  }
  if (areaCode4 === "0836") {
    // Matsu: 0836 + 5 digits (2~9+4D), total 9 digits
    return cleanValue.length === 9 && /^0836[2-9]\d{4}$/.test(cleanValue)
  }

  // Check 3-digit area codes
  const areaCode3 = cleanValue.substring(0, 3)
  if (areaCode3 === "037") {
    // Miaoli: 037 + 6 digits (2~9+5D), total 9 digits
    return cleanValue.length === 9 && /^037[2-9]\d{5}$/.test(cleanValue)
  }
  if (areaCode3 === "049") {
    // Nantou: 049 + 7 digits (2~9+6D), total 10 digits
    return cleanValue.length === 10 && /^049[2-9]\d{6}$/.test(cleanValue)
  }
  if (areaCode3 === "082") {
    // Kinmen: 082 + 6 digits (2~5&7~9+5D), total 9 digits
    return cleanValue.length === 9 && /^082[2-57-9]\d{5}$/.test(cleanValue)
  }
  if (areaCode3 === "089") {
    // Taitung: 089 + 6 digits (2~9+5D), total 9 digits
    return cleanValue.length === 9 && /^089[2-9]\d{5}$/.test(cleanValue)
  }

  // Check 2-digit area codes
  const areaCode2 = cleanValue.substring(0, 2)

  if (areaCode2 === "02") {
    // Taipei, New Taipei, Keelung: 02 + 8 digits (2&3&5~8+7D), total 10 digits
    return cleanValue.length === 10 && /^02[235-8]\d{7}$/.test(cleanValue)
  }
  if (["03", "04", "05", "06"].includes(areaCode2)) {
    // Taoyuan/Hsinchu/Yilan/Hualien (03), Taichung/Changhua (04),
    // Yunlin/Chiayi (05), Tainan (06): 7 digits, total 9 digits
    return cleanValue.length === 9
  }
  if (areaCode2 === "07") {
    // Kaohsiung: 07 + 7 digits (2~9+6D), total 9 digits
    return cleanValue.length === 9 && /^07[2-9]\d{6}$/.test(cleanValue)
  }
  if (areaCode2 === "08") {
    // Pingtung: 08 + 7 digits (4&7&8+6D), total 9 digits
    return cleanValue.length === 9 && /^08[478]\d{6}$/.test(cleanValue)
  }

  return false
}

/**
 * Creates a Zod schema for Taiwan landline telephone number validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @param {TelOptions<IsRequired>} [options] - Configuration options for telephone validation
 * @returns {TelSchema<IsRequired>} Zod schema for telephone number validation
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
 * const basicSchema = tel()
 * basicSchema.parse("0223456789") // ✓ Valid (Taipei)
 * basicSchema.parse("0312345678") // ✓ Valid (Taoyuan)
 * basicSchema.parse("02-2345-6789") // ✓ Valid (with separators)
 * basicSchema.parse("0812345678") // ✗ Invalid (wrong format for 08)
 *
 * // With whitelist (only specific numbers allowed)
 * const whitelistSchema = tel({
 *   whitelist: ["0223456789", "0312345678"]
 * })
 * whitelistSchema.parse("0223456789") // ✓ Valid (in whitelist)
 * whitelistSchema.parse("0287654321") // ✗ Invalid (not in whitelist)
 *
 * // Optional telephone number
 * const optionalSchema = tel({ required: false })
 * optionalSchema.parse("") // ✓ Valid (returns null)
 * optionalSchema.parse("0223456789") // ✓ Valid
 *
 * // With custom transformation (remove separators)
 * const transformSchema = tel({
 *   transform: (value) => value.replace(/[^0-9]/g, '') // Keep only digits
 * })
 * transformSchema.parse("02-2345-6789") // ✓ Valid (separators removed)
 * transformSchema.parse("02 2345 6789") // ✓ Valid (spaces removed)
 *
 * // With custom error messages
 * const customSchema = tel({
 *   i18n: {
 *     en: { invalid: "Please enter a valid Taiwan landline number" },
 *     'zh-TW': { invalid: "請輸入有效的台灣市話號碼" }
 *   }
 * })
 * ```
 *
 * @throws {z.ZodError} When validation fails with specific error messages
 * @see {@link TelOptions} for all available configuration options
 * @see {@link validateTaiwanTel} for validation logic details
 */
export function tel<IsRequired extends boolean = true>(options?: TelOptions<IsRequired>): TelSchema<IsRequired> {
  const { required = true, whitelist, transform, defaultValue, i18n } = options ?? {}

  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? (required ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof TelMessages, params?: Record<string, any>) => {
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
      if (!required) {
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

  const baseSchema = required ? z.preprocess(preprocessFn, z.string()) : z.preprocess(preprocessFn, z.string().nullable())

  const schema = baseSchema.refine((val) => {
    if (val === null) return true

    // Required check
    if (required && (val === "" || val === "null" || val === "undefined")) {
      throw new z.ZodError([{ code: "custom", message: getMessage("required"), path: [] }])
    }

    if (val === null) return true
    if (!required && val === "") return true

    // Allowlist check (if an allowlist is provided, only allow values in the allowlist)
    if (whitelist && whitelist.length > 0) {
      if (whitelist.includes(val)) {
        return true
      }
      // If not in the allowlist, reject regardless of format
      throw new z.ZodError([{ code: "custom", message: getMessage("notInWhitelist"), path: [] }])
    }

    // Taiwan telephone format validation (only if no allowlist or allowlist is empty)
    if (!validateTaiwanTel(val)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("invalid"), path: [] }])
    }

    return true
  })

  return schema as unknown as TelSchema<IsRequired>
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
