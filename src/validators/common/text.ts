/**
 * @fileoverview Text validator for Zod Kit
 *
 * Provides comprehensive text validation with length constraints, content validation,
 * flexible trimming and casing options, and advanced transformation features.
 *
 * @author Ong Hoe Yuan
 * @version 0.0.5
 */

import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

/**
 * Type definition for text validation error messages
 *
 * @interface TextMessages
 * @property {string} [required] - Message when field is required but empty
 * @property {string} [notEmpty] - Message when field must not be empty (whitespace-only)
 * @property {string} [minLength] - Message when text is shorter than minimum length
 * @property {string} [maxLength] - Message when text exceeds maximum length
 * @property {string} [startsWith] - Message when text doesn't start with required string
 * @property {string} [endsWith] - Message when text doesn't end with required string
 * @property {string} [includes] - Message when text doesn't contain required string
 * @property {string} [excludes] - Message when text contains forbidden string
 * @property {string} [invalid] - Message when text doesn't match regex pattern
 */
export type TextMessages = {
  required?: string
  notEmpty?: string
  minLength?: string
  maxLength?: string
  startsWith?: string
  endsWith?: string
  includes?: string
  excludes?: string
  invalid?: string
}

/**
 * Configuration options for text validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 *
 * @interface TextOptions
 * @property {IsRequired} [required=true] - Whether the field is required
 * @property {number} [minLength] - Minimum length of text
 * @property {number} [maxLength] - Maximum length of text
 * @property {string} [startsWith] - String that text must start with
 * @property {string} [endsWith] - String that text must end with
 * @property {string} [includes] - String that must be included in text
 * @property {string | string[]} [excludes] - String(s) that must not be included
 * @property {RegExp} [regex] - Regular expression pattern for validation
 * @property {"trim" | "trimStart" | "trimEnd" | "none"} [trimMode="trim"] - Whitespace handling
 * @property {"upper" | "lower" | "title" | "none"} [casing="none"] - Case transformation
 * @property {Function} [transform] - Custom transformation function for text
 * @property {boolean} [notEmpty] - Whether to reject whitespace-only strings
 * @property {string | null} [defaultValue] - Default value when input is empty
 * @property {Record<Locale, TextMessages>} [i18n] - Custom error messages for different locales
 */
export type TextOptions<IsRequired extends boolean = true> = {
  minLength?: number
  maxLength?: number
  startsWith?: string
  endsWith?: string
  includes?: string
  excludes?: string | string[]
  regex?: RegExp
  trimMode?: "trim" | "trimStart" | "trimEnd" | "none"
  casing?: "upper" | "lower" | "title" | "none"
  transform?: (value: string) => string
  notEmpty?: boolean
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Record<Locale, TextMessages>
}

/**
 * Type alias for text validation schema based on required flag
 *
 * @template IsRequired - Whether the field is required
 * @typedef TextSchema
 * @description Returns ZodString if required, ZodNullable<ZodString> if optional
 */
export type TextSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

/**
 * Creates a Zod schema for text validation with comprehensive string processing
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @param {TextOptions<IsRequired>} [options] - Configuration options for text validation
 * @returns {TextSchema<IsRequired>} Zod schema for text validation
 *
 * @description
 * Creates a comprehensive text validator with length constraints, content validation,
 * flexible trimming and casing options, and advanced transformation features.
 *
 * Features:
 * - Length validation (min/max)
 * - Content validation (startsWith, endsWith, includes, excludes)
 * - Regular expression pattern matching
 * - Flexible trimming options (trim, trimStart, trimEnd, none)
 * - Case transformation (upper, lower, title, none)
 * - Empty string vs whitespace-only validation
 * - Custom transformation functions
 * - Comprehensive internationalization
 *
 * @example
 * ```typescript
 * // Basic text validation (optional by default)
 * const basicSchema = text()
 * basicSchema.parse("Hello World") // ✓ Valid
 * basicSchema.parse(null) // ✓ Valid (optional)
 *
 * // Required text
 * const requiredSchema = text(true)
 * requiredSchema.parse("Hello") // ✓ Valid
 * requiredSchema.parse(null) // ✗ Invalid (required)
 *
 * // Length constraints
 * const lengthSchema = text(true, { minLength: 3, maxLength: 50 })
 * lengthSchema.parse("Hello") // ✓ Valid
 * lengthSchema.parse("Hi") // ✗ Invalid (too short)
 *
 * // Content validation
 * const contentSchema = text(true, {
 *   startsWith: "Hello",
 *   endsWith: "!",
 *   includes: "World"
 * })
 * contentSchema.parse("Hello World!") // ✓ Valid
 *
 * // Case transformation
 * const upperSchema = text(false, { casing: "upper" })
 * upperSchema.parse("hello") // ✓ Valid (converted to "HELLO")
 *
 * // Trim modes
 * const trimStartSchema = text(false, { trimMode: "trimStart" })
 * trimStartSchema.parse("  hello  ") // ✓ Valid (result: "hello  ")
 *
 * // Regex validation
 * const regexSchema = text(true, { regex: /^[a-zA-Z]+$/ })
 * regexSchema.parse("hello") // ✓ Valid
 * regexSchema.parse("hello123") // ✗ Invalid
 *
 * // Not empty (rejects whitespace-only)
 * const notEmptySchema = text(true, { notEmpty: true })
 * notEmptySchema.parse("hello") // ✓ Valid
 * notEmptySchema.parse("   ") // ✗ Invalid
 *
 * // Optional with default
 * const optionalSchema = text(false, { defaultValue: "default text" })
 * ```
 *
 * @throws {z.ZodError} When validation fails with specific error messages
 * @see {@link TextOptions} for all available configuration options
 */
export function text<IsRequired extends boolean = false>(required?: IsRequired, options?: Omit<TextOptions<IsRequired>, 'required'>): TextSchema<IsRequired> {
  const { minLength, maxLength, startsWith, endsWith, includes, excludes, regex, trimMode = "trim", casing = "none", transform, notEmpty, defaultValue, i18n } = options ?? {}

  const isRequired = required ?? false as IsRequired

  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? (isRequired ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof TextMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.text.${key}`, params)
  }

  // Helper functions to apply trimming based on the mode
  const applyTrim = (str: string): string => {
    switch (trimMode) {
      case "trimStart":
        return str.trimStart()
      case "trimEnd":
        return str.trimEnd()
      case "none":
        return str
      default:
        return str.trim()
    }
  }

  // Helper function to apply casing
  const applyCasing = (str: string): string => {
    switch (casing) {
      case "upper":
        return str.toUpperCase()
      case "lower":
        return str.toLowerCase()
      case "title":
        return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase())
      default:
        return str
    }
  }

  // Preprocessing function with optimized transformations
  const preprocessFn = (val: unknown) => {
    if (val === "" || val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val)
    processed = applyTrim(processed)
    processed = applyCasing(processed)

    if (transform) {
      processed = transform(processed)
    }

    return processed
  }

  const baseSchema = isRequired ? z.preprocess(preprocessFn, z.string()) : z.preprocess(preprocessFn, z.string().nullable())

  // Single refine with all validations for better performance
  const schema = baseSchema.refine((val) => {
    if (val === null) return true

    // Required check
    if (isRequired && (val === "" || val === "null" || val === "undefined")) {
      throw new z.ZodError([{ code: "custom", message: getMessage("required"), path: [] }])
    }

    // Not empty check (different from required - checks whitespace)
    // For notEmpty, we need to check if the original string (before processing) was only whitespace
    if (notEmpty && val !== null && val.trim() === "") {
      throw new z.ZodError([{ code: "custom", message: getMessage("notEmpty"), path: [] }])
    }

    // Length checks
    if (val !== null && minLength !== undefined && val.length < minLength) {
      throw new z.ZodError([{ code: "custom", message: getMessage("minLength", { minLength }), path: [] }])
    }
    if (val !== null && maxLength !== undefined && val.length > maxLength) {
      throw new z.ZodError([{ code: "custom", message: getMessage("maxLength", { maxLength }), path: [] }])
    }

    // String content checks
    if (val !== null && startsWith !== undefined && !val.startsWith(startsWith)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("startsWith", { startsWith }), path: [] }])
    }
    if (val !== null && endsWith !== undefined && !val.endsWith(endsWith)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("endsWith", { endsWith }), path: [] }])
    }
    if (val !== null && includes !== undefined && !val.includes(includes)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("includes", { includes }), path: [] }])
    }
    if (val !== null && excludes !== undefined) {
      const excludeList = Array.isArray(excludes) ? excludes : [excludes]
      for (const exclude of excludeList) {
        if (val.includes(exclude)) {
          throw new z.ZodError([{ code: "custom", message: getMessage("excludes", { excludes: exclude }), path: [] }])
        }
      }
    }
    if (val !== null && regex !== undefined && !regex.test(val)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("invalid", { regex }), path: [] }])
    }

    return true
  })

  return schema as unknown as TextSchema<IsRequired>
}
