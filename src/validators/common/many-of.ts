/**
 * @fileoverview ManyOf validator for Zod Kit
 *
 * Provides multi-select validation that restricts input to an array of values
 * from a predefined set, with min/max selection, duplicate control, and transformation.
 *
 * Avoids z.preprocess() to preserve z.input types for React Hook Form compatibility.
 *
 * @author Ong Hoe Yuan
 * @version 0.2.5
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
 * @template V - The tuple type of allowed values, preserving literal types
 *
 * @interface ManyOfOptions
 * @property {V} values - Array of allowed values
 * @property {V[number][] | null} [defaultValue] - Default value when input is empty
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
 * @template V - The tuple type of allowed values
 */
export type ManyOfSchema<IsRequired extends boolean, V extends readonly (string | number)[]> = IsRequired extends true
  ? ZodType<V[number][], V[number][] | "" | null | undefined>
  : ZodType<V[number][] | null, V[number][] | "" | null | undefined>

/**
 * Creates a Zod schema for multi-select validation that restricts values to a predefined set
 *
 * Avoids z.preprocess() to preserve z.input types for React Hook Form compatibility.
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @template V - The tuple type of allowed values (inferred via const type parameter)
 * @param {IsRequired} [required=false] - Whether the field is required
 * @param {ManyOfOptions<IsRequired, V>} options - Configuration options (values is required)
 * @returns {ManyOfSchema<IsRequired, V>} Zod schema for manyOf validation
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
  const valuesArr = values as readonly (string | number)[]

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
    const hasNumbers = valuesArr.some((v) => typeof v === "number")
    if (hasNumbers && typeof item === "string" && !isNaN(Number(item)) && item.trim() !== "") {
      const numVal = Number(item)
      if ((valuesArr as readonly number[]).includes(numVal)) return numVal
    }

    // Case-insensitive normalization
    if (!caseSensitive && typeof item === "string") {
      const match = valuesArr.find((v) => typeof v === "string" && v.toLowerCase() === item.toLowerCase())
      if (match !== undefined) return match
      return item
    }

    return item
  }

  // Build an array schema that validates + normalizes items, then applies superRefine for constraints
  const arraySchema = z
    .array(z.any())
    .transform((arr) => arr.map(normalizeItem))
    .superRefine((val, ctx) => {
      // Check each item is in the allowed values
      for (const item of val) {
        if (!(valuesArr as readonly (string | number)[]).includes(item as string | number)) {
          ctx.addIssue({
            code: "custom",
            message: getMessage("invalid", { values: valuesArr.join(", ") }),
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
      if (!transform) return val as V[number][]
      return transform(val as V[number][])
    })

  // Single value → wrap in array
  const singleToArray = z.union([z.string(), z.number()]).transform((v) => [normalizeItem(v)])
    .pipe(arraySchema)

  // Handle required vs optional
  const fallback = defaultValue as V[number][] | null

  if (isRequired && fallback === null) {
    // Required, no default: empty values should fail with "required" message
    const emptyRejectSchema = z
      .union([z.literal("" as const), z.null(), z.undefined()])
      .refine(() => false, { message: getMessage("required") })

    return z.union([arraySchema, singleToArray, emptyRejectSchema]) as unknown as ManyOfSchema<IsRequired, V>
  }

  // Optional or has default: empty values → fallback
  const emptySchema = z
    .union([z.literal("" as const), z.null(), z.undefined()])
    .transform(() => fallback)

  return z.union([arraySchema, singleToArray, emptySchema]) as unknown as ManyOfSchema<IsRequired, V>
}
