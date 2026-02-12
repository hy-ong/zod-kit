/**
 * @fileoverview Boolean validator for Zod Kit
 *
 * Provides flexible boolean validation with support for various truthy/falsy values,
 * strict mode validation, and comprehensive transformation options.
 *
 * @author Ong Hoe Yuan
 * @version 0.0.5
 */

import { z, ZodBoolean, ZodNullable, ZodType } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

/**
 * Type definition for boolean validation error messages
 *
 * @interface BooleanMessages
 * @property {string} [required] - Message when field is required but empty
 * @property {string} [shouldBeTrue] - Message when value should be true but isn't
 * @property {string} [shouldBeFalse] - Message when value should be false but isn't
 * @property {string} [invalid] - Message when value is not a valid boolean
 */
export type BooleanMessages = {
  required?: string
  shouldBeTrue?: string
  shouldBeFalse?: string
  invalid?: string
}

/**
 * Configuration options for boolean validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 *
 * @interface BooleanOptions
 * @property {boolean | null} [defaultValue] - Default value when input is empty
 * @property {boolean} [shouldBe] - Specific boolean value that must be matched
 * @property {unknown[]} [truthyValues] - Array of values that should be treated as true
 * @property {unknown[]} [falsyValues] - Array of values that should be treated as false
 * @property {boolean} [strict=false] - If true, only accepts actual boolean values
 * @property {Function} [transform] - Custom transformation function for boolean values
 * @property {Record<Locale, BooleanMessages>} [i18n] - Custom error messages for different locales
 */
export type BooleanOptions<IsRequired extends boolean = true> = {
  defaultValue?: IsRequired extends true ? boolean : boolean | null
  shouldBe?: boolean
  truthyValues?: unknown[]
  falsyValues?: unknown[]
  strict?: boolean
  transform?: (value: boolean) => boolean
  i18n?: Partial<Record<Locale, Partial<BooleanMessages>>>
}

/**
 * Type alias for boolean validation schema based on required flag
 *
 * @template IsRequired - Whether the field is required
 * @typedef BooleanSchema
 * @description Returns ZodBoolean if required, ZodNullable<ZodBoolean> if optional
 */
export type BooleanSchema<IsRequired extends boolean> = IsRequired extends true ? ZodBoolean : ZodNullable<ZodBoolean>

/**
 * Creates a Zod schema for boolean validation with flexible value interpretation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @param {IsRequired} [required=false] - Whether the field is required
 * @param {Omit<BooleanOptions<IsRequired>, 'required'>} [options] - Configuration options for boolean validation
 * @returns {BooleanSchema<IsRequired>} Zod schema for boolean validation
 *
 * @description
 * Creates a flexible boolean validator that can interpret various values as true/false,
 * supports strict mode for type safety, and provides comprehensive transformation options.
 *
 * Features:
 * - Flexible truthy/falsy value interpretation
 * - Strict mode for type safety
 * - Custom transformation functions
 * - Specific boolean value requirements
 * - Comprehensive internationalization
 * - Default value support
 *
 * @example
 * ```typescript
 * // Basic boolean validation (optional by default)
 * const basicSchema = boolean()
 * basicSchema.parse(true) // ✓ Valid
 * basicSchema.parse("true") // ✓ Valid (converted to true)
 * basicSchema.parse(null) // ✓ Valid (optional)
 *
 * // Required boolean
 * const requiredSchema = boolean(true)
 * requiredSchema.parse(true) // ✓ Valid
 * requiredSchema.parse(null) // ✗ Invalid (required)
 *
 * // Strict mode (only actual booleans)
 * const strictSchema = boolean(false, { strict: true })
 * strictSchema.parse(true) // ✓ Valid
 * strictSchema.parse("true") // ✗ Invalid
 *
 * // Must be true
 * const mustBeTrueSchema = boolean(true, { shouldBe: true })
 * mustBeTrueSchema.parse(true) // ✓ Valid
 * mustBeTrueSchema.parse(false) // ✗ Invalid
 *
 * // Custom truthy/falsy values
 * const customSchema = boolean(false, {
 *   truthyValues: ["yes", "on", 1],
 *   falsyValues: ["no", "off", 0]
 * })
 * customSchema.parse("yes") // ✓ Valid (converted to true)
 *
 * // Optional with default
 * const optionalSchema = boolean(false, { defaultValue: false })
 * ```
 *
 * @throws {z.ZodError} When validation fails with specific error messages
 * @see {@link BooleanOptions} for all available configuration options
 */
export function boolean<IsRequired extends boolean = false>(required?: IsRequired, options?: Omit<BooleanOptions<IsRequired>, 'required'>): BooleanSchema<IsRequired> {
  const {
    defaultValue = null,
    shouldBe,
    truthyValues = [true, "true", 1, "1", "yes", "on"],
    falsyValues = [false, "false", 0, "0", "no", "off"],
    strict = false,
    transform,
    i18n,
  } = options ?? {}

  const isRequired = required ?? false as IsRequired

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof BooleanMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.boolean.${key}`, params)
  }

  let result: ZodType = z.preprocess(
    (val) => {
      if (val === "" || val === undefined || val === null) return defaultValue

      if (strict && typeof val !== "boolean" && val !== null) {
        return val // Let it fail in validation
      }

      // Check truthy values
      if (truthyValues.includes(val)) {
        let processed = true
        if (transform) processed = transform(processed)
        return processed
      }

      // Check falsy values
      if (falsyValues.includes(val)) {
        let processed = false
        if (transform) processed = transform(processed)
        return processed
      }

      return val
    },
    z.union([z.literal(true), z.literal(false), z.literal(null)])
  )

  if (isRequired && defaultValue === null) {
    result = result.refine((val) => val !== null, { message: getMessage("required") })
  }

  if (shouldBe === true) {
    result = result.refine((val) => val === true, { message: getMessage("shouldBeTrue") })
  } else if (shouldBe === false) {
    result = result.refine((val) => val === false, { message: getMessage("shouldBeFalse") })
  }

  if (strict) {
    result = result.refine(
      (val) => {
        return val === null || typeof val === "boolean"
      },
      { message: getMessage("invalid") }
    )
  }

  return result as IsRequired extends true ? ZodBoolean : ZodNullable<ZodBoolean>
}
