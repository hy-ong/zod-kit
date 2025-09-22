/**
 * @fileoverview Taiwan National ID (身分證/居留證) validator for Zod Kit
 *
 * Provides validation for Taiwan National ID cards (身分證) and
 * Resident Certificates (居留證) with support for both old and new formats.
 *
 * @author Ong Hoe Yuan
 * @version 0.0.5
 */

import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

/**
 * Type definition for national ID validation error messages
 *
 * @interface NationalIdMessages
 * @property {string} [required] - Message when field is required but empty
 * @property {string} [invalid] - Message when national ID format or checksum is invalid
 */
export type NationalIdMessages = {
  required?: string
  invalid?: string
}

/**
 * Types of Taiwan national identification documents
 *
 * @typedef {"citizen" | "resident" | "both"} NationalIdType
 *
 * Available types:
 * - citizen: National ID card (身分證字號) for Taiwan citizens
 * - resident: Resident certificate (居留證號) for foreign residents
 * - both: Accept both citizen and resident IDs
 */
export type NationalIdType =
  | "citizen"           // National ID card (身分證字號)
  | "resident"          // Resident certificate (居留證號)
  | "both"              // Both citizen and resident IDs accepted

/**
 * Configuration options for Taiwan national ID validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 *
 * @interface NationalIdOptions
 * @property {IsRequired} [required=true] - Whether the field is required
 * @property {NationalIdType} [type="both"] - Type of ID to accept
 * @property {boolean} [allowOldResident=true] - Whether to accept old-style resident certificates
 * @property {Function} [transform] - Custom transformation function for ID
 * @property {string | null} [defaultValue] - Default value when input is empty
 * @property {Record<Locale, NationalIdMessages>} [i18n] - Custom error messages for different locales
 */
export type NationalIdOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  type?: NationalIdType
  allowOldResident?: boolean
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Record<Locale, NationalIdMessages>
}

/**
 * Type alias for national ID validation schema based on required flag
 *
 * @template IsRequired - Whether the field is required
 * @typedef NationalIdSchema
 * @description Returns ZodString if required, ZodNullable<ZodString> if optional
 */
export type NationalIdSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

/**
 * Mapping of Taiwan city/county codes to their numeric values
 *
 * @constant {Record<string, number>} CITY_CODES
 * @description Maps the first letter of Taiwan ID to corresponding numeric code
 */
const CITY_CODES: Record<string, number> = {
  'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17,
  'I': 34, 'J': 18, 'K': 19, 'L': 20, 'M': 21, 'N': 22, 'O': 35, 'P': 23,
  'Q': 24, 'R': 25, 'S': 26, 'T': 27, 'U': 28, 'V': 29, 'W': 32, 'X': 30,
  'Y': 31, 'Z': 33
}

/**
 * Validates Taiwan citizen national ID card (身分證字號)
 *
 * @param {string} value - The citizen ID to validate
 * @returns {boolean} True if the citizen ID is valid
 *
 * @description
 * Validates Taiwan citizen ID format: 1 letter + 1 gender digit (1-2) + 8 digits
 * Uses checksum algorithm with city code conversion and weighted sum.
 *
 * Format: [A-Z][1-2]XXXXXXXX
 * - First letter: City/county code
 * - Second digit: Gender (1=male, 2=female)
 * - Last 8 digits: Serial number + checksum
 *
 * @example
 * ```typescript
 * validateCitizenId("A123456789") // true/false based on checksum
 * validateCitizenId("A323456789") // false (invalid gender digit)
 * ```
 */
const validateCitizenId = (value: string): boolean => {
  // 格式檢查：1個英文字母 + 9個數字
  if (!/^[A-Z][1-2]\d{8}$/.test(value)) {
    return false
  }

  const letter = value[0]
  const digits = value.slice(1).split('').map(Number)

  // 獲取縣市代碼
  const cityCode = CITY_CODES[letter]
  if (!cityCode) return false

  // 計算校驗碼
  const cityDigits = [Math.floor(cityCode / 10), cityCode % 10]
  const coefficients = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1]

  let sum = cityDigits[0] * coefficients[0] + cityDigits[1] * coefficients[1]
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * coefficients[i + 2]
  }

  const checksum = (10 - (sum % 10)) % 10
  return checksum === digits[8]
}

/**
 * Validates old-style Taiwan resident certificate (舊式居留證號)
 *
 * @param {string} value - The old-style resident ID to validate
 * @returns {boolean} True if the old-style resident ID is valid
 *
 * @description
 * Validates old-style resident ID format: 1 letter + 1 gender letter + 8 digits
 * Uses checksum algorithm with city code and gender code conversion.
 *
 * Format: [A-Z][ABCD]XXXXXXXX
 * - First letter: City/county code
 * - Second letter: Gender code (A/C=male, B/D=female)
 * - Last 8 digits: Serial number + checksum
 *
 * @example
 * ```typescript
 * validateOldResidentId("AA12345678") // true/false based on checksum
 * validateOldResidentId("AE12345678") // false (invalid gender letter)
 * ```
 */
const validateOldResidentId = (value: string): boolean => {
  // 格式檢查：1個英文字母 + [AB或CD] + 8個數字
  if (!/^[A-Z][ABCD]\d{8}$/.test(value)) {
    return false
  }

  const letter = value[0]
  const genderCode = value[1]
  const digits = value.slice(2).split('').map(Number)

  // 獲取縣市代碼
  const cityCode = CITY_CODES[letter]
  if (!cityCode) return false

  // 性別代碼轉換
  const genderValue = genderCode === 'A' || genderCode === 'C' ? 1 : 0

  // 計算校驗碼
  const cityDigits = [Math.floor(cityCode / 10), cityCode % 10]
  const coefficients = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1]

  let sum = cityDigits[0] * coefficients[0] + cityDigits[1] * coefficients[1] + genderValue * coefficients[2]
  for (let i = 0; i < 7; i++) {
    sum += digits[i] * coefficients[i + 3]
  }

  const checksum = (10 - (sum % 10)) % 10
  return checksum === digits[7]
}

/**
 * Validates new-style Taiwan resident certificate (新式居留證號)
 *
 * @param {string} value - The new-style resident ID to validate
 * @returns {boolean} True if the new-style resident ID is valid
 *
 * @description
 * Validates new-style resident ID format: 1 letter + 1 type digit + 8 digits
 * Uses the same checksum algorithm as citizen IDs.
 *
 * Format: [A-Z][89]XXXXXXXX
 * - First letter: City/county code
 * - Second digit: Type indicator (8 or 9)
 * - Last 8 digits: Serial number + checksum
 *
 * @example
 * ```typescript
 * validateNewResidentId("A812345678") // true/false based on checksum
 * validateNewResidentId("A712345678") // false (invalid type digit)
 * ```
 */
const validateNewResidentId = (value: string): boolean => {
  // 格式檢查：1個英文字母 + [89] + 1個數字[0-9] + 7個數字
  if (!/^[A-Z][89]\d{8}$/.test(value)) {
    return false
  }

  const letter = value[0]
  const digits = value.slice(1).split('').map(Number)

  // 獲取縣市代碼
  const cityCode = CITY_CODES[letter]
  if (!cityCode) return false

  // 計算校驗碼 (與身分證字號相同邏輯)
  const cityDigits = [Math.floor(cityCode / 10), cityCode % 10]
  const coefficients = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1]

  let sum = cityDigits[0] * coefficients[0] + cityDigits[1] * coefficients[1]
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * coefficients[i + 2]
  }

  const checksum = (10 - (sum % 10)) % 10
  return checksum === digits[8]
}

/**
 * Main validation function for Taiwan national IDs
 *
 * @param {string} value - The national ID to validate
 * @param {NationalIdType} [type="both"] - Type of ID to accept
 * @param {boolean} [allowOldResident=true] - Whether to accept old-style resident certificates
 * @returns {boolean} True if the national ID is valid
 *
 * @description
 * Validates Taiwan national IDs based on the specified type and options.
 * Supports citizen IDs, resident certificates (both old and new styles).
 *
 * @example
 * ```typescript
 * validateTaiwanNationalId("A123456789", "citizen") // Citizen ID only
 * validateTaiwanNationalId("A812345678", "resident") // Resident ID only
 * validateTaiwanNationalId("A123456789", "both") // Accept any valid format
 * validateTaiwanNationalId("AA12345678", "both", false) // Reject old resident format
 * ```
 */
const validateTaiwanNationalId = (value: string, type: NationalIdType = "both", allowOldResident: boolean = true): boolean => {
  if (!/^[A-Z].{9}$/.test(value)) {
    return false
  }

  switch (type) {
    case "citizen":
      return validateCitizenId(value)
    case "resident":
      return (allowOldResident ? validateOldResidentId(value) : false) || validateNewResidentId(value)
    case "both":
      return validateCitizenId(value) || (allowOldResident ? validateOldResidentId(value) : false) || validateNewResidentId(value)
    default:
      return false
  }
}

/**
 * Creates a Zod schema for Taiwan National ID validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @param {NationalIdOptions<IsRequired>} [options] - Configuration options for national ID validation
 * @returns {NationalIdSchema<IsRequired>} Zod schema for national ID validation
 *
 * @description
 * Creates a comprehensive Taiwan National ID validator that supports both
 * citizen IDs and resident certificates with configurable validation rules.
 *
 * Features:
 * - Citizen ID validation (身分證字號)
 * - Resident certificate validation (居留證號, old and new formats)
 * - Configurable ID type acceptance
 * - Automatic case conversion to uppercase
 * - Checksum verification
 * - Custom transformation functions
 * - Comprehensive internationalization
 * - Optional field support
 *
 * @example
 * ```typescript
 * // Accept any valid Taiwan ID
 * const anyIdSchema = nationalId()
 * anyIdSchema.parse("A123456789") // ✓ Valid citizen ID
 * anyIdSchema.parse("A812345678") // ✓ Valid new resident ID
 * anyIdSchema.parse("AA12345678") // ✓ Valid old resident ID
 *
 * // Citizen IDs only
 * const citizenSchema = nationalId({ type: "citizen" })
 * citizenSchema.parse("A123456789") // ✓ Valid
 * citizenSchema.parse("A812345678") // ✗ Invalid (resident ID)
 *
 * // Resident IDs only (new format only)
 * const residentSchema = nationalId({
 *   type: "resident",
 *   allowOldResident: false
 * })
 * residentSchema.parse("A812345678") // ✓ Valid
 * residentSchema.parse("AA12345678") // ✗ Invalid (old format)
 *
 * // Optional with custom transformation
 * const optionalSchema = nationalId({
 *   required: false,
 *   transform: (value) => value.replace(/[^A-Z0-9]/g, '') // Remove special chars
 * })
 *
 * // With custom error messages
 * const customSchema = nationalId({
 *   i18n: {
 *     en: { invalid: "Please enter a valid Taiwan National ID" },
 *     'zh-TW': { invalid: "請輸入有效的身分證或居留證號碼" }
 *   }
 * })
 * ```
 *
 * @throws {z.ZodError} When validation fails with specific error messages
 * @see {@link NationalIdOptions} for all available configuration options
 * @see {@link NationalIdType} for supported ID types
 * @see {@link validateTaiwanNationalId} for validation logic details
 */
export function nationalId<IsRequired extends boolean = true>(options?: NationalIdOptions<IsRequired>): NationalIdSchema<IsRequired> {
  const {
    required = true,
    type = "both",
    allowOldResident = true,
    transform,
    defaultValue,
    i18n
  } = options ?? {}

  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? (required ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof NationalIdMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`taiwan.nationalId.${key}`, params)
  }

  // Preprocessing function
  const preprocessFn = (val: unknown) => {
    if (val === "" || val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val).trim().toUpperCase()

    // If after trimming we have an empty string and the field is optional, return null
    if (processed === "" && !required) {
      return null
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

    // Taiwan National ID validation
    if (!validateTaiwanNationalId(val, type, allowOldResident)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("invalid"), path: [] }])
    }

    return true
  })

  return schema as unknown as NationalIdSchema<IsRequired>
}

/**
 * Utility functions exported for external use
 *
 * @description
 * These validation functions can be used independently for national ID validation
 * without creating a full Zod schema. Useful for custom validation logic.
 *
 * @example
 * ```typescript
 * import {
 *   validateTaiwanNationalId,
 *   validateCitizenId,
 *   validateOldResidentId,
 *   validateNewResidentId
 * } from './national-id'
 *
 * // General validation
 * const isValid = validateTaiwanNationalId("A123456789", "both") // boolean
 *
 * // Specific format validation
 * const isCitizen = validateCitizenId("A123456789") // boolean
 * const isOldResident = validateOldResidentId("AA12345678") // boolean
 * const isNewResident = validateNewResidentId("A812345678") // boolean
 * ```
 */
export { validateTaiwanNationalId, validateCitizenId, validateOldResidentId, validateNewResidentId }