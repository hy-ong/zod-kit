/**
 * @fileoverview Number validator for Zod Kit
 *
 * Provides comprehensive number validation with type constraints, range validation,
 * precision control, and advanced parsing features including comma-separated numbers.
 *
 * @author Ong Hoe Yuan
 * @version 0.0.5
 */

import { z, ZodNullable, ZodNumber } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

/**
 * Type definition for number validation error messages
 *
 * @interface NumberMessages
 * @property {string} [required] - Message when field is required but empty
 * @property {string} [invalid] - Message when value is not a valid number
 * @property {string} [integer] - Message when integer is required but float provided
 * @property {string} [float] - Message when float is required but integer provided
 * @property {string} [min] - Message when number is below minimum value
 * @property {string} [max] - Message when number exceeds maximum value
 * @property {string} [positive] - Message when positive number is required
 * @property {string} [negative] - Message when negative number is required
 * @property {string} [nonNegative] - Message when non-negative number is required
 * @property {string} [nonPositive] - Message when non-positive number is required
 * @property {string} [multipleOf] - Message when number is not a multiple of specified value
 * @property {string} [finite] - Message when finite number is required
 * @property {string} [precision] - Message when number has too many decimal places
 */
export type NumberMessages = {
  required?: string
  invalid?: string
  integer?: string
  float?: string
  min?: string
  max?: string
  positive?: string
  negative?: string
  nonNegative?: string
  nonPositive?: string
  multipleOf?: string
  finite?: string
  precision?: string
}

/**
 * Configuration options for number validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 *
 * @interface NumberOptions
 * @property {IsRequired} [required=true] - Whether the field is required
 * @property {number} [min] - Minimum allowed value
 * @property {number} [max] - Maximum allowed value
 * @property {number | null} [defaultValue] - Default value when input is empty
 * @property {"integer" | "float" | "both"} [type="both"] - Type constraint for the number
 * @property {boolean} [positive] - Whether number must be positive (> 0)
 * @property {boolean} [negative] - Whether number must be negative (< 0)
 * @property {boolean} [nonNegative] - Whether number must be non-negative (>= 0)
 * @property {boolean} [nonPositive] - Whether number must be non-positive (<= 0)
 * @property {number} [multipleOf] - Number must be a multiple of this value
 * @property {number} [precision] - Maximum number of decimal places allowed
 * @property {boolean} [finite=true] - Whether to reject Infinity and -Infinity
 * @property {Function} [transform] - Custom transformation function for number values
 * @property {boolean} [parseCommas=false] - Whether to parse comma-separated numbers (e.g., "1,234")
 * @property {Record<Locale, NumberMessages>} [i18n] - Custom error messages for different locales
 */
export type NumberOptions<IsRequired extends boolean = true> = {
  min?: number
  max?: number
  defaultValue?: IsRequired extends true ? number : number | null
  type?: "integer" | "float" | "both"
  positive?: boolean
  negative?: boolean
  nonNegative?: boolean
  nonPositive?: boolean
  multipleOf?: number
  precision?: number
  finite?: boolean
  transform?: (value: number) => number
  parseCommas?: boolean // Parse "1,234" as 1234
  i18n?: Partial<Record<Locale, Partial<NumberMessages>>>
}

/**
 * Type alias for number validation schema based on required flag
 *
 * @template IsRequired - Whether the field is required
 * @typedef NumberSchema
 * @description Returns ZodNumber if required, ZodNullable<ZodNumber> if optional
 */
export type NumberSchema<IsRequired extends boolean> = IsRequired extends true ? ZodNumber : ZodNullable<ZodNumber>

/**
 * Creates a Zod schema for number validation with comprehensive constraints
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @param required
 * @param {NumberOptions<IsRequired>} [options] - Configuration options for number validation
 * @returns {NumberSchema<IsRequired>} Zod schema for number validation
 *
 * @description
 * Creates a comprehensive number validator with type constraints, range validation,
 * precision control, and advanced parsing features including comma-separated numbers.
 *
 * Features:
 * - Type constraints (integer, float, or both)
 * - Range validation (min/max)
 * - Sign constraints (positive, negative, non-negative, non-positive)
 * - Multiple-of validation
 * - Precision control (decimal places)
 * - Finite number validation
 * - Comma-separated number parsing
 * - Custom transformation functions
 * - Comprehensive internationalization
 *
 * @example
 * ```typescript
 * // Basic number validation (optional by default)
 * const basicSchema = number()
 * basicSchema.parse(42) // ✓ Valid
 * basicSchema.parse("42") // ✓ Valid (converted to number)
 * basicSchema.parse(null) // ✓ Valid (optional)
 *
 * // Required number
 * const requiredSchema = number(true)
 * requiredSchema.parse(42) // ✓ Valid
 * requiredSchema.parse(null) // ✗ Invalid (required)
 *
 * // Integer only
 * const integerSchema = number(false, { type: "integer" })
 * integerSchema.parse(42) // ✓ Valid
 * integerSchema.parse(42.5) // ✗ Invalid
 *
 * // Range validation
 * const rangeSchema = number(true, { min: 0, max: 100 })
 * rangeSchema.parse(50) // ✓ Valid
 * rangeSchema.parse(150) // ✗ Invalid
 *
 * // Positive numbers only
 * const positiveSchema = number(true, { positive: true })
 * positiveSchema.parse(5) // ✓ Valid
 * positiveSchema.parse(-5) // ✗ Invalid
 *
 * // Multiple of constraint
 * const multipleSchema = number(true, { multipleOf: 5 })
 * multipleSchema.parse(10) // ✓ Valid
 * multipleSchema.parse(7) // ✗ Invalid
 *
 * // Precision control
 * const precisionSchema = number(true, { precision: 2 })
 * precisionSchema.parse(3.14) // ✓ Valid
 * precisionSchema.parse(3.14159) // ✗ Invalid
 *
 * // Comma-separated parsing
 * const commaSchema = number(false, { parseCommas: true })
 * commaSchema.parse("1,234.56") // ✓ Valid (parsed as 1234.56)
 *
 * // Optional with default
 * const optionalSchema = number(false, { defaultValue: 0 })
 * ```
 *
 * @throws {z.ZodError} When validation fails with specific error messages
 * @see {@link NumberOptions} for all available configuration options
 */
export function number<IsRequired extends boolean = false>(required?: IsRequired, options?: Omit<NumberOptions<IsRequired>, "required">): NumberSchema<IsRequired> {
  const { min, max, defaultValue, type = "both", positive, negative, nonNegative, nonPositive, multipleOf, precision, finite = true, transform, parseCommas = false, i18n } = options ?? {}

  const isRequired = required ?? (false as IsRequired)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof NumberMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.number.${key}`, params)
  }

  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? null

  const schema = z
    .preprocess(
      (val) => {
        if (val === "" || val === undefined || val === null) {
          return actualDefaultValue
        }

        // Handle string input
        if (typeof val === "string") {
          let processedVal = val.trim()

          // Parse comma-separated numbers like "1,234.56"
          if (parseCommas) {
            processedVal = processedVal.replace(/,/g, "")
          }

          const parsed = Number(processedVal)

          // Return NaN as is so it can be caught in refine
          if (isNaN(parsed)) {
            return parsed
          }

          if (transform) {
            return transform(parsed)
          }

          return parsed
        }

        // Handle existing numbers (including Infinity)
        if (typeof val === "number") {
          if (transform && Number.isFinite(val)) {
            return transform(val)
          }
          return val
        }

        return val
      },
      z.union([z.number(), z.null(), z.nan(), z.custom<number>((val) => val === Infinity || val === -Infinity)])
    )
    .superRefine((val, ctx) => {
      // Required check first
      if (isRequired && val === null) {
        ctx.addIssue({
          code: "custom",
          message: getMessage("required"),
        })
        return
      }

      if (val === null) return

      // Type validation for invalid inputs (NaN)
      if (isNaN(val)) {
        if (type === "integer") {
          ctx.addIssue({
            code: "custom",
            message: getMessage("integer"),
          })
        } else if (type === "float") {
          ctx.addIssue({
            code: "custom",
            message: getMessage("float"),
          })
        } else {
          ctx.addIssue({
            code: "custom",
            message: getMessage("invalid"),
          })
        }
        return
      }

      // Finite check
      if (finite && !Number.isFinite(val)) {
        ctx.addIssue({
          code: "custom",
          message: getMessage("finite"),
        })
        return
      }

      // Type validation for valid numbers
      if (type === "integer" && !Number.isInteger(val)) {
        ctx.addIssue({
          code: "custom",
          message: getMessage("integer"),
        })
        return
      }
      if (type === "float" && Number.isInteger(val)) {
        ctx.addIssue({
          code: "custom",
          message: getMessage("float"),
        })
        return
      }

      // Sign checks (more specific, should come first)
      if (positive && val <= 0) {
        ctx.addIssue({
          code: "custom",
          message: getMessage("positive"),
        })
        return
      }
      if (negative && val >= 0) {
        ctx.addIssue({
          code: "custom",
          message: getMessage("negative"),
        })
        return
      }
      if (nonNegative && val < 0) {
        ctx.addIssue({
          code: "custom",
          message: getMessage("nonNegative"),
        })
        return
      }
      if (nonPositive && val > 0) {
        ctx.addIssue({
          code: "custom",
          message: getMessage("nonPositive"),
        })
        return
      }

      // Range checks
      if (min !== undefined && val < min) {
        ctx.addIssue({
          code: "custom",
          message: getMessage("min", { min }),
        })
        return
      }
      if (max !== undefined && val > max) {
        ctx.addIssue({
          code: "custom",
          message: getMessage("max", { max }),
        })
        return
      }

      // Multiple of check
      if (multipleOf !== undefined && val % multipleOf !== 0) {
        ctx.addIssue({
          code: "custom",
          message: getMessage("multipleOf", { multipleOf }),
        })
        return
      }

      // Precision check
      if (precision !== undefined) {
        const decimalPlaces = (val.toString().split(".")[1] || "").length
        if (decimalPlaces > precision) {
          ctx.addIssue({
            code: "custom",
            message: getMessage("precision", { precision }),
          })
          return
        }
      }
    })

  return schema as unknown as NumberSchema<IsRequired>
}
