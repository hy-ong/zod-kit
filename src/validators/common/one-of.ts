/**
 * @fileoverview OneOf validator for Zod Kit
 *
 * Provides single-select validation that restricts input to a predefined set of allowed values,
 * with support for case-insensitive matching, default values, and transformation.
 *
 * @author Ong Hoe Yuan
 * @version 0.2.2
 */

import { z, ZodType } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

/**
 * Type definition for oneOf validation error messages
 *
 * @interface OneOfMessages
 * @property {string} [required] - Message when field is required but empty
 * @property {string} [invalid] - Message when value is not in the allowed list
 */
export type OneOfMessages = {
  required?: string
  invalid?: string
}

/**
 * Configuration options for oneOf validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @template T - The type of allowed values
 *
 * @interface OneOfOptions
 * @property {T[]} values - Array of allowed values
 * @property {T | null} [defaultValue] - Default value when input is empty
 * @property {boolean} [caseSensitive=true] - Whether string matching is case-sensitive
 * @property {Function} [transform] - Custom transformation function applied after validation
 * @property {Record<Locale, OneOfMessages>} [i18n] - Custom error messages for different locales
 */
export type OneOfOptions<IsRequired extends boolean = true, T extends string | number = string | number> = {
  values: T[]
  defaultValue?: IsRequired extends true ? T : T | null
  caseSensitive?: boolean
  transform?: (value: T) => T
  i18n?: Partial<Record<Locale, Partial<OneOfMessages>>>
}

/**
 * Type alias for oneOf validation schema based on required flag
 *
 * @template IsRequired - Whether the field is required
 * @template T - The type of allowed values
 */
export type OneOfSchema<IsRequired extends boolean, T> = IsRequired extends true ? ZodType<T> : ZodType<T | null>

/**
 * Creates a Zod schema for single-select validation that restricts values to a predefined set
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @template T - The type of allowed values (string | number)
 * @param {IsRequired} [required=false] - Whether the field is required
 * @param {OneOfOptions<IsRequired, T>} options - Configuration options (values is required)
 * @returns {OneOfSchema<IsRequired, T>} Zod schema for oneOf validation
 *
 * @example
 * ```typescript
 * // Basic single-select validation (optional by default)
 * const roleSchema = oneOf(false, { values: ["admin", "editor", "viewer"] })
 * roleSchema.parse("admin") // ✓ "admin"
 * roleSchema.parse(null)    // ✓ null
 *
 * // Required
 * const statusSchema = oneOf(true, { values: ["active", "inactive", "pending"] })
 * statusSchema.parse("active") // ✓ "active"
 * statusSchema.parse(null)     // ✗ Required
 * statusSchema.parse("banned") // ✗ Invalid
 *
 * // Numeric values
 * const prioritySchema = oneOf(true, { values: [1, 2, 3, 4, 5] })
 * prioritySchema.parse(3)  // ✓ 3
 * prioritySchema.parse(10) // ✗ Invalid
 *
 * // Case-insensitive matching
 * const colorSchema = oneOf(true, {
 *   values: ["red", "green", "blue"],
 *   caseSensitive: false
 * })
 * colorSchema.parse("RED")   // ✓ "red" (normalized to match original)
 * colorSchema.parse("Green") // ✓ "green"
 *
 * // With default value
 * const tierSchema = oneOf(false, {
 *   values: ["free", "pro", "enterprise"],
 *   defaultValue: "free"
 * })
 * tierSchema.parse(null) // ✓ "free"
 *
 * // With transform
 * const sizeSchema = oneOf(true, {
 *   values: ["s", "m", "l", "xl"],
 *   transform: (val) => val.toUpperCase() as any
 * })
 * sizeSchema.parse("m") // ✓ "M"
 * ```
 */
export function oneOf<IsRequired extends boolean = false, T extends string | number = string | number>(
  required?: IsRequired,
  options?: Omit<OneOfOptions<IsRequired, T>, "required">,
): OneOfSchema<IsRequired, T> {
  const { values = [] as unknown as T[], defaultValue = null, caseSensitive = true, transform, i18n } = options ?? {}

  const isRequired = required ?? (false as IsRequired)

  const getMessage = (key: keyof OneOfMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.oneOf.${key}`, params)
  }

  const preprocessFn = (val: unknown) => {
    if (val === "" || val === null || val === undefined) {
      return defaultValue
    }

    // Coerce number strings to numbers when values contains numbers
    const hasNumbers = values.some((v) => typeof v === "number")
    if (hasNumbers && typeof val === "string" && !isNaN(Number(val)) && val.trim() !== "") {
      const numVal = Number(val)
      if ((values as number[]).includes(numVal)) return numVal
    }

    // Case-insensitive normalization for string values
    if (!caseSensitive && typeof val === "string") {
      const match = values.find((v) => typeof v === "string" && v.toLowerCase() === val.toLowerCase())
      if (match !== undefined) return match
      return val
    }

    return val
  }

  const baseSchema = z.preprocess(preprocessFn, z.any())

  const schema = baseSchema
    .superRefine((val, ctx) => {
      if (val === null) {
        if (isRequired) {
          ctx.addIssue({ code: "custom", message: getMessage("required") })
        }
        return
      }

      if (!values.includes(val as T)) {
        ctx.addIssue({
          code: "custom",
          message: getMessage("invalid", { values: values.join(", ") }),
        })
      }
    })
    .transform((val) => {
      if (val === null || !transform) return val
      return transform(val as T)
    })

  return schema as unknown as OneOfSchema<IsRequired, T>
}
