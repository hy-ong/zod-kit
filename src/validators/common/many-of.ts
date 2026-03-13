/**
 * @fileoverview ManyOf validator for Zod Kit
 *
 * Provides multi-select validation that restricts input to an array of values
 * from a predefined set, with min/max selection, duplicate control, and transformation.
 *
 * @author Ong Hoe Yuan
 * @version 0.2.2
 */

import { z, ZodType } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

/**
 * Type definition for manyOf validation error messages
 *
 * @interface ManyOfMessages
 * @property {string} [required] - Message when field is required but empty
 * @property {string} [invalid] - Message when a value is not in the allowed list
 * @property {string} [minSelect] - Message when fewer than minimum items are selected
 * @property {string} [maxSelect] - Message when more than maximum items are selected
 * @property {string} [duplicate] - Message when duplicate values are found
 */
export type ManyOfMessages = {
  required?: string
  invalid?: string
  minSelect?: string
  maxSelect?: string
  duplicate?: string
}

/**
 * Configuration options for manyOf validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @template T - The type of allowed values
 *
 * @interface ManyOfOptions
 * @property {T[]} values - Array of allowed values
 * @property {T[] | null} [defaultValue] - Default value when input is empty
 * @property {number} [min] - Minimum number of selections
 * @property {number} [max] - Maximum number of selections
 * @property {boolean} [allowDuplicates=false] - Whether to allow duplicate selections
 * @property {boolean} [caseSensitive=true] - Whether string matching is case-sensitive
 * @property {Function} [transform] - Custom transformation function applied to each value
 * @property {Record<Locale, ManyOfMessages>} [i18n] - Custom error messages for different locales
 */
export type ManyOfOptions<IsRequired extends boolean = true, V extends readonly (string | number)[] = readonly (string | number)[]> = {
  values: V
  defaultValue?: IsRequired extends true ? V[number][] : V[number][] | null
  min?: number
  max?: number
  allowDuplicates?: boolean
  caseSensitive?: boolean
  transform?: (value: V[number][]) => V[number][]
  i18n?: Partial<Record<Locale, Partial<ManyOfMessages>>>
}

/**
 * Type alias for manyOf validation schema based on required flag
 *
 * @template IsRequired - Whether the field is required
 * @template T - The type of allowed values
 */
export type ManyOfSchema<IsRequired extends boolean, V extends readonly (string | number)[]> = IsRequired extends true ? ZodType<V[number][]> : ZodType<V[number][] | null>

/**
 * Creates a Zod schema for multi-select validation that restricts values to a predefined set
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @template T - The type of allowed values (string | number)
 * @param {IsRequired} [required=false] - Whether the field is required
 * @param {ManyOfOptions<IsRequired, T>} options - Configuration options (values is required)
 * @returns {ManyOfSchema<IsRequired, T>} Zod schema for manyOf validation
 *
 * @example
 * ```typescript
 * // Basic multi-select (optional by default)
 * const tagsSchema = manyOf(false, { values: ["js", "ts", "rust", "go"] })
 * tagsSchema.parse(["js", "ts"]) // ✓ ["js", "ts"]
 * tagsSchema.parse(null)          // ✓ null
 *
 * // Required with min/max
 * const skillsSchema = manyOf(true, {
 *   values: ["react", "vue", "angular", "svelte"],
 *   min: 1,
 *   max: 3,
 * })
 * skillsSchema.parse(["react"])                        // ✓
 * skillsSchema.parse([])                               // ✗ minSelect
 * skillsSchema.parse(["react", "vue", "angular", "svelte"]) // ✗ maxSelect
 *
 * // Case-insensitive matching
 * const colorsSchema = manyOf(true, {
 *   values: ["red", "green", "blue"],
 *   caseSensitive: false,
 * })
 * colorsSchema.parse(["RED", "Green"]) // ✓ ["red", "green"]
 *
 * // No duplicates (default)
 * const rolesSchema = manyOf(true, { values: ["admin", "editor", "viewer"] })
 * rolesSchema.parse(["admin", "admin"]) // ✗ duplicate
 *
 * // Allow duplicates
 * const itemsSchema = manyOf(true, {
 *   values: [1, 2, 3],
 *   allowDuplicates: true,
 * })
 * itemsSchema.parse([1, 1, 2]) // ✓ [1, 1, 2]
 * ```
 */
export function manyOf<IsRequired extends boolean = false, const V extends readonly (string | number)[] = readonly (string | number)[]>(
  required?: IsRequired,
  options?: Omit<ManyOfOptions<IsRequired, V>, "required">,
): ManyOfSchema<IsRequired, V> {
  const { values = [] as unknown as V, defaultValue = null, min, max, allowDuplicates = false, caseSensitive = true, transform, i18n } = options ?? {}

  const isRequired = required ?? (false as IsRequired)

  const getMessage = (key: keyof ManyOfMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.manyOf.${key}`, params)
  }

  const normalizeItem = (item: unknown): unknown => {
    // Coerce number strings to numbers when values contains numbers
    const hasNumbers = values.some((v) => typeof v === "number")
    if (hasNumbers && typeof item === "string" && !isNaN(Number(item)) && item.trim() !== "") {
      const numVal = Number(item)
      if ((values as readonly number[]).includes(numVal)) return numVal
    }

    // Case-insensitive normalization
    if (!caseSensitive && typeof item === "string") {
      const match = values.find((v) => typeof v === "string" && v.toLowerCase() === item.toLowerCase())
      if (match !== undefined) return match
      return item
    }

    return item
  }

  const preprocessFn = (val: unknown) => {
    if (val === null || val === undefined || val === "") {
      return defaultValue
    }

    if (!Array.isArray(val)) {
      // Accept single value and wrap in array
      return [normalizeItem(val)]
    }

    return val.map(normalizeItem)
  }

  const baseSchema = z.preprocess(preprocessFn, z.any())

  const schema = baseSchema.superRefine((val, ctx) => {
    if (val === null) {
      if (isRequired) {
        ctx.addIssue({ code: "custom", message: getMessage("required") })
      }
      return
    }

    if (!Array.isArray(val)) {
      ctx.addIssue({ code: "custom", message: getMessage("invalid", { values: values.join(", ") }) })
      return
    }

    // Check each item is in the allowed values
    for (const item of val) {
      if (!(values as readonly (string | number)[]).includes(item as V[number])) {
        ctx.addIssue({
          code: "custom",
          message: getMessage("invalid", { values: values.join(", ") }),
        })
        return
      }
    }

    // Duplicate check
    if (!allowDuplicates) {
      const seen = new Set()
      for (const item of val) {
        if (seen.has(item)) {
          ctx.addIssue({ code: "custom", message: getMessage("duplicate") })
          return
        }
        seen.add(item)
      }
    }

    // Min/max selection count
    if (min !== undefined && val.length < min) {
      ctx.addIssue({ code: "custom", message: getMessage("minSelect", { min }) })
      return
    }

    if (max !== undefined && val.length > max) {
      ctx.addIssue({ code: "custom", message: getMessage("maxSelect", { max }) })
      return
    }
  })
  .transform((val) => {
    if (val === null || !Array.isArray(val) || !transform) return val
    return transform(val as V[number][])
  })

  return schema as unknown as ManyOfSchema<IsRequired, V>
}
