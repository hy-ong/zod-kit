/**
 * @fileoverview ID validator for Zod Kit
 *
 * Provides comprehensive ID validation with support for multiple ID formats,
 * auto-detection, custom patterns, and flexible validation options.
 *
 * @author Ong Hoe Yuan
 * @version 0.0.5
 */

import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

/**
 * Type definition for ID validation error messages
 *
 * @interface IdMessages
 * @property {string} [required] - Message when field is required but empty
 * @property {string} [invalid] - Message when ID format is invalid
 * @property {string} [minLength] - Message when ID is too short
 * @property {string} [maxLength] - Message when ID is too long
 * @property {string} [numeric] - Message when numeric ID format is invalid
 * @property {string} [uuid] - Message when UUID format is invalid
 * @property {string} [objectId] - Message when MongoDB ObjectId format is invalid
 * @property {string} [nanoid] - Message when Nano ID format is invalid
 * @property {string} [snowflake] - Message when Snowflake ID format is invalid
 * @property {string} [cuid] - Message when CUID format is invalid
 * @property {string} [ulid] - Message when ULID format is invalid
 * @property {string} [shortid] - Message when ShortId format is invalid
 * @property {string} [customFormat] - Message when custom regex format is invalid
 * @property {string} [includes] - Message when ID doesn't contain required string
 * @property {string} [excludes] - Message when ID contains forbidden string
 * @property {string} [startsWith] - Message when ID doesn't start with required string
 * @property {string} [endsWith] - Message when ID doesn't end with required string
 */
export type IdMessages = {
  required?: string
  invalid?: string
  minLength?: string
  maxLength?: string
  numeric?: string
  uuid?: string
  objectId?: string
  nanoid?: string
  snowflake?: string
  cuid?: string
  ulid?: string
  shortid?: string
  customFormat?: string
  includes?: string
  excludes?: string
  startsWith?: string
  endsWith?: string
}

/**
 * Supported ID types for validation
 *
 * @typedef {string} IdType
 *
 * Available types:
 * - numeric: Pure numeric IDs (1, 123, 999999)
 * - uuid: UUID v4 format (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
 * - objectId: MongoDB ObjectId (24-character hexadecimal)
 * - nanoid: Nano ID format (21-character URL-safe)
 * - snowflake: Twitter Snowflake (19-digit number)
 * - cuid: CUID format (25-character starting with 'c')
 * - ulid: ULID format (26-character case-insensitive)
 * - shortid: ShortId format (7-14 character URL-safe)
 * - auto: Auto-detect format from the value
 */
export type IdType =
  | "numeric" // Pure numeric IDs (1, 123, 999999)
  | "uuid" // UUID v4 format
  | "objectId" // MongoDB ObjectId (24-character hexadecimal)
  | "nanoid" // Nano ID
  | "snowflake" // Twitter Snowflake (19-digit number)
  | "cuid" // CUID format
  | "ulid" // ULID format
  | "shortid" // ShortId format
  | "auto" // Auto-detect format

/**
 * Configuration options for ID validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 *
 * @interface IdOptions
 * @property {IsRequired} [required=true] - Whether the field is required
 * @property {IdType} [type="auto"] - Expected ID type or auto-detection
 * @property {number} [minLength] - Minimum length of ID
 * @property {number} [maxLength] - Maximum length of ID
 * @property {IdType[]} [allowedTypes] - Multiple allowed ID types (overrides type)
 * @property {RegExp} [customRegex] - Custom regex pattern (overrides type validation)
 * @property {string} [includes] - String that must be included in ID
 * @property {string | string[]} [excludes] - String(s) that must not be included
 * @property {string} [startsWith] - String that ID must start with
 * @property {string} [endsWith] - String that ID must end with
 * @property {boolean} [caseSensitive=true] - Whether validation is case-sensitive
 * @property {Function} [transform] - Custom transformation function for ID
 * @property {string | null} [defaultValue] - Default value when input is empty
 * @property {Record<Locale, IdMessages>} [i18n] - Custom error messages for different locales
 */
export type IdOptions<IsRequired extends boolean = true> = {
  type?: IdType
  minLength?: number
  maxLength?: number
  allowedTypes?: IdType[]
  customRegex?: RegExp
  includes?: string
  excludes?: string | string[]
  startsWith?: string
  endsWith?: string
  caseSensitive?: boolean
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Record<Locale, IdMessages>
}

/**
 * Type alias for ID validation schema based on required flag
 *
 * @template IsRequired - Whether the field is required
 * @typedef IdSchema
 * @description Returns ZodString if required, ZodNullable<ZodString> if optional
 */
export type IdSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

/**
 * Regular expression patterns for different ID formats
 *
 * @constant {Record<string, RegExp>} ID_PATTERNS
 * @description Maps each ID type to its corresponding regex pattern
 */
const ID_PATTERNS = {
  numeric: /^\d+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  objectId: /^[0-9a-f]{24}$/i,
  nanoid: /^[A-Za-z0-9_-]{21}$/,
  snowflake: /^\d{19}$/,
  cuid: /^c[a-z0-9]{24}$/,
  ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
  shortid: /^[A-Za-z0-9_-]{7,14}$/,
} as const

/**
 * Detects the ID type of a given value using pattern matching
 *
 * @param {string} value - The ID value to analyze
 * @returns {IdType | null} The detected ID type or null if no pattern matches
 *
 * @description
 * Attempts to identify the ID type by testing against known patterns.
 * Patterns are ordered by specificity to avoid false positives.
 * More specific patterns (UUID, ObjectId) are tested before generic ones (numeric, shortid).
 *
 * @example
 * ```typescript
 * detectIdType("550e8400-e29b-41d4-a716-446655440000") // "uuid"
 * detectIdType("507f1f77bcf86cd799439011") // "objectId"
 * detectIdType("V1StGXR8_Z5jdHi6B-myT") // "nanoid"
 * detectIdType("123456789") // "numeric"
 * detectIdType("invalid-id") // null
 * ```
 */
const detectIdType = (value: string): IdType | null => {
  // 按優先順序檢查（從最具體到最通用）
  const orderedTypes: Array<[IdType, RegExp]> = [
    ["uuid", ID_PATTERNS.uuid],
    ["objectId", ID_PATTERNS.objectId],
    ["snowflake", ID_PATTERNS.snowflake],
    ["cuid", ID_PATTERNS.cuid],
    ["ulid", ID_PATTERNS.ulid],
    ["nanoid", ID_PATTERNS.nanoid],
    ["numeric", ID_PATTERNS.numeric],
    ["shortid", ID_PATTERNS.shortid], // 放最後，因為最通用
  ]

  for (const [type, pattern] of orderedTypes) {
    if (pattern.test(value)) {
      return type
    }
  }
  return null
}

/**
 * Validates if a value matches the specified ID type
 *
 * @param {string} value - The ID value to validate
 * @param {IdType} type - The expected ID type
 * @returns {boolean} True if the value matches the specified type
 *
 * @description
 * Validates a specific ID type using regex patterns or auto-detection.
 * For "auto" type, uses detectIdType to check if any known pattern matches.
 *
 * @example
 * ```typescript
 * validateIdType("123456", "numeric") // true
 * validateIdType("abc123", "numeric") // false
 * validateIdType("550e8400-e29b-41d4-a716-446655440000", "uuid") // true
 * validateIdType("invalid-uuid", "uuid") // false
 * ```
 */
const validateIdType = (value: string, type: IdType): boolean => {
  if (type === "auto") {
    return detectIdType(value) !== null
  }
  const pattern = ID_PATTERNS[type as keyof typeof ID_PATTERNS]
  return pattern ? pattern.test(value) : false
}

/**
 * Creates a Zod schema for ID validation with comprehensive format support
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @param {IsRequired} [required=false] - Whether the field is required
 * @param {Omit<ValidatorOptions<IsRequired>, 'required'>} [options] - Configuration options for validation
 * @returns {IdSchema<IsRequired>} Zod schema for ID validation
 *
 * @description
 * Creates a comprehensive ID validator with support for multiple ID formats,
 * auto-detection, custom patterns, and flexible validation options.
 *
 * Features:
 * - Multiple ID format support (UUID, ObjectId, Snowflake, etc.)
 * - Auto-detection of ID types
 * - Custom regex pattern support
 * - Length validation
 * - Content validation (includes, excludes, startsWith, endsWith)
 * - Case sensitivity control
 * - Multiple allowed types
 * - Custom transformation functions
 * - Comprehensive internationalization
 *
 * @example
 * ```typescript
 * // Auto-detect ID format
 * const autoSchema = id()
 * autoSchema.parse("550e8400-e29b-41d4-a716-446655440000") // ✓ Valid (UUID)
 * autoSchema.parse("507f1f77bcf86cd799439011") // ✓ Valid (ObjectId)
 * autoSchema.parse("123456") // ✓ Valid (numeric)
 *
 * // Specific ID type
 * const uuidSchema = id(false, { type: "uuid" })
 * uuidSchema.parse("550e8400-e29b-41d4-a716-446655440000") // ✓ Valid
 * uuidSchema.parse("invalid-uuid") // ✗ Invalid
 *
 * // Multiple allowed types
 * const multiSchema = id(false, { allowedTypes: ["uuid", "objectId"] })
 * multiSchema.parse("550e8400-e29b-41d4-a716-446655440000") // ✓ Valid (UUID)
 * multiSchema.parse("507f1f77bcf86cd799439011") // ✓ Valid (ObjectId)
 * multiSchema.parse("123456") // ✗ Invalid (numeric not allowed)
 *
 * // Custom regex pattern
 * const customSchema = id(false, { customRegex: /^CUST_\d{6}$/ })
 * customSchema.parse("CUST_123456") // ✓ Valid
 * customSchema.parse("invalid") // ✗ Invalid
 *
 * // Content validation
 * const prefixSchema = id(false, {
 *   type: "auto",
 *   startsWith: "user_",
 *   minLength: 10
 * })
 * prefixSchema.parse("user_123456") // ✓ Valid
 *
 * // Case insensitive
 * const caseInsensitiveSchema = id(false, {
 *   type: "uuid",
 *   caseSensitive: false
 * })
 * caseInsensitiveSchema.parse("550E8400-E29B-41D4-A716-446655440000") // ✓ Valid
 *
 * // Optional with default
 * const optionalSchema = id(false, {
 *   defaultValue: null
 * })
 * ```
 *
 * @throws {z.ZodError} When validation fails with specific error messages
 * @see {@link IdOptions} for all available configuration options
 * @see {@link IdType} for supported ID types
 * @see {@link detectIdType} for auto-detection logic
 * @see {@link validateIdType} for type-specific validation
 */
export function id<IsRequired extends boolean = false>(required?: IsRequired, options?: Omit<IdOptions<IsRequired>, 'required'>): IdSchema<IsRequired> {
  const {
    type = "auto",
    minLength,
    maxLength,
    allowedTypes,
    customRegex,
    includes,
    excludes,
    startsWith,
    endsWith,
    caseSensitive = true,
    transform,
    defaultValue,
    i18n,
  } = options ?? {}

  const isRequired = required ?? false as IsRequired

  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? (isRequired ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof IdMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.id.${key}`, params)
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

  const schema = baseSchema
    .refine((val) => {
      if (val === null) return true

      // Required check
      if (isRequired && (val === "" || val === "null" || val === "undefined")) {
        throw new z.ZodError([{ code: "custom", message: getMessage("required"), path: [] }])
      }

      // Create comparison value for case-insensitive checks
      const comparisonVal = !caseSensitive ? val.toLowerCase() : val

      // Length checks
      if (val !== null && minLength !== undefined && val.length < minLength) {
        throw new z.ZodError([{ code: "custom", message: getMessage("minLength", { minLength }), path: [] }])
      }
      if (val !== null && maxLength !== undefined && val.length > maxLength) {
        throw new z.ZodError([{ code: "custom", message: getMessage("maxLength", { maxLength }), path: [] }])
      }

      // Check if we have content-based validations that override format checking
      const hasContentValidations = customRegex !== undefined || startsWith !== undefined || endsWith !== undefined || includes !== undefined || excludes !== undefined

      // Custom regex validation (overrides ID format validation)
      if (val !== null && customRegex !== undefined) {
        if (!customRegex.test(val)) {
          throw new z.ZodError([{ code: "custom", message: getMessage("customFormat"), path: [] }])
        }
      } else if (val !== null && !hasContentValidations) {
        // ID type validation (only if no custom regex or content validations)
        let isValidId: boolean

        if (allowedTypes && allowedTypes.length > 0) {
          // Check if ID matches any of the allowed types
          isValidId = allowedTypes.some((allowedType) => validateIdType(val, allowedType))
          if (!isValidId) {
            const typeNames = allowedTypes.join(", ")
            throw new z.ZodError([{ code: "custom", message: getMessage("invalid") + ` (allowed types: ${typeNames})`, path: [] }])
          }
        } else if (type !== "auto") {
          // Validate specific type
          isValidId = validateIdType(val, type)
          if (!isValidId) {
            throw new z.ZodError([{ code: "custom", message: getMessage(type as keyof IdMessages) || getMessage("invalid"), path: [] }])
          }
        } else {
          // Auto-detection - must match at least one known pattern
          isValidId = detectIdType(val) !== null
          if (!isValidId) {
            throw new z.ZodError([{ code: "custom", message: getMessage("invalid"), path: [] }])
          }
        }
      } else if (val !== null && hasContentValidations && type !== "auto" && !customRegex) {
        // Still validate specific types even with content validations (but not auto)
        if (allowedTypes && allowedTypes.length > 0) {
          const isValidType = allowedTypes.some((allowedType) => validateIdType(val, allowedType))
          if (!isValidType) {
            const typeNames = allowedTypes.join(", ")
            throw new z.ZodError([{ code: "custom", message: getMessage("invalid") + ` (allowed types: ${typeNames})`, path: [] }])
          }
        } else {
          if (!validateIdType(val, type)) {
            throw new z.ZodError([{ code: "custom", message: getMessage(type as keyof IdMessages) || getMessage("invalid"), path: [] }])
          }
        }
      }

      // String content checks (using comparisonVal for case sensitivity)
      const searchStartsWith = !caseSensitive && startsWith ? startsWith.toLowerCase() : startsWith
      const searchEndsWith = !caseSensitive && endsWith ? endsWith.toLowerCase() : endsWith
      const searchIncludes = !caseSensitive && includes ? includes.toLowerCase() : includes

      if (val !== null && startsWith !== undefined && !comparisonVal.startsWith(searchStartsWith!)) {
        throw new z.ZodError([{ code: "custom", message: getMessage("startsWith", { startsWith }), path: [] }])
      }
      if (val !== null && endsWith !== undefined && !comparisonVal.endsWith(searchEndsWith!)) {
        throw new z.ZodError([{ code: "custom", message: getMessage("endsWith", { endsWith }), path: [] }])
      }
      if (val !== null && includes !== undefined && !comparisonVal.includes(searchIncludes!)) {
        throw new z.ZodError([{ code: "custom", message: getMessage("includes", { includes }), path: [] }])
      }
      if (val !== null && excludes !== undefined) {
        const excludeList = Array.isArray(excludes) ? excludes : [excludes]
        for (const exclude of excludeList) {
          const searchExclude = !caseSensitive ? exclude.toLowerCase() : exclude
          if (comparisonVal.includes(searchExclude)) {
            throw new z.ZodError([{ code: "custom", message: getMessage("excludes", { excludes: exclude }), path: [] }])
          }
        }
      }

      return true
    })
    .transform((val) => {
      if (val === null) return val

      // Handle case transformations
      const shouldPreserveCase = type === "uuid" || type === "objectId"

      if (!caseSensitive && !shouldPreserveCase) {
        return val.toLowerCase()
      }

      return val // preserve the original case for UUID/ObjectId or when case-sensitive
    })

  return schema as unknown as IdSchema<IsRequired>
}

/**
 * Utility functions and constants exported for external use
 *
 * @description
 * These utilities can be used independently for ID validation, type detection,
 * and pattern matching without creating a full Zod schema.
 *
 * @example
 * ```typescript
 * import { detectIdType, validateIdType, ID_PATTERNS } from './id'
 *
 * // Detect ID type
 * const type = detectIdType("550e8400-e29b-41d4-a716-446655440000") // "uuid"
 *
 * // Validate specific type
 * const isValid = validateIdType("123456", "numeric") // true
 *
 * // Access regex patterns
 * const uuidPattern = ID_PATTERNS.uuid
 * ```
 */
export { detectIdType, validateIdType, ID_PATTERNS }
