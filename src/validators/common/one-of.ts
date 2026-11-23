/**
 * @fileoverview OneOf validator for Zod Kit
 *
 * Provides single-select validation that restricts input to a predefined set of allowed values,
 * with support for case-insensitive matching, default values, and transformation.
 *
 * When required=true, z.input is narrowed to V[number] (no empty/null/undefined),
 * making it fully compatible with React Hook Form resolvers and type-aware form libraries.
 *
 * @author Ong Hoe Yuan
 * @version 0.2.6
 */

import { z, ZodType } from "zod"
import { t } from "../../i18n"
import { isDescribable, rejectInput } from "../../utils/safe-value"
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
 * @template V - The tuple type of allowed values, preserving literal types
 *
 * @interface OneOfOptions
 * @property {V} values - Array of allowed values
 * @property {V[number] | null} [defaultValue] - Default value when input is empty
 * @property {boolean} [caseSensitive=true] - Whether string matching is case-sensitive
 * @property {Function} [transform] - Custom transformation function applied after validation
 * @property {Record<Locale, OneOfMessages>} [i18n] - Custom error messages for different locales
 * @property {boolean} [directIssue=false] - When true, a non-empty invalid value reports the `invalid` message
 *   directly as the top-level issue (`issues[0].message`), instead of a generic union issue with the real
 *   message nested inside. Empty values keep the same behavior (required → `required`, optional → null/default).
 * @property {boolean} [whitespaceAsEmpty=false] - When true, a string that is empty after trimming (e.g. `"  "`) is treated
 *   as empty (required → `required`, optional → null/default), same as the option of the same name on number/text.
 *   The empty check runs before matching `values`, so whitespace-only input is empty even if `values` contains `" "`.
 *   When false (default), whitespace-only input is matched as-is (invalid unless it is one of `values`).
 */
export type OneOfOptions<IsRequired extends boolean = true, V extends readonly (string | number)[] = readonly (string | number)[]> = {
  values: V
  defaultValue?: IsRequired extends true ? V[number] : V[number] | null
  caseSensitive?: boolean
  transform?: (value: V[number]) => V[number]
  i18n?: Partial<Record<Locale, Partial<OneOfMessages>>>
  directIssue?: boolean
  whitespaceAsEmpty?: boolean
}

/**
 * Type alias for oneOf validation schema based on required flag
 *
 * @template IsRequired - Whether the field is required
 * @template V - The tuple type of allowed values
 */
export type OneOfSchema<IsRequired extends boolean, V extends readonly (string | number)[]> = IsRequired extends true
  ? ZodType<V[number], V[number]>
  : ZodType<V[number] | null, V[number] | "" | null | undefined>

/**
 * Creates a Zod schema for single-select validation that restricts values to a predefined set
 *
 * When required=true, z.input is narrowed to V[number] only (no empty/null/undefined),
 * ensuring full compatibility with React Hook Form and other type-aware form libraries.
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @template V - The tuple type of allowed values (inferred via const type parameter)
 * @param {IsRequired} [required=false] - Whether the field is required
 * @param {OneOfOptions<IsRequired, V>} options - Configuration options (values is required)
 * @returns {OneOfSchema<IsRequired, V>} Zod schema for oneOf validation
 *
 * @example
 * ```typescript
 * // Basic single-select validation (optional by default)
 * const roleSchema = oneOf(false, { values: ["admin", "editor", "viewer"] })
 * roleSchema.parse("admin") // ✓ "admin"
 * roleSchema.parse(null)    // ✓ null
 *
 * // Required — z.input and z.output are both "active" | "inactive" | "pending"
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
 *
 * // Top-level invalid message for safeParse (opt-in)
 * const planSchema = oneOf(true, { values: ["basic", "pro"], directIssue: true })
 * planSchema.safeParse("gold").error?.issues[0].message // "Must be one of: basic, pro"
 *
 * // Treat whitespace-only input as empty (opt-in)
 * const channelSchema = oneOf(true, { values: ["b2b", "b2c"], whitespaceAsEmpty: true })
 * channelSchema.safeParse("  ").error?.issues[0].message // "Required"
 * ```
 */
export function oneOf<IsRequired extends boolean = false, const V extends readonly (string | number)[] = readonly (string | number)[]>(
  required?: IsRequired,
  options?: Omit<OneOfOptions<IsRequired, V>, "required">
): OneOfSchema<IsRequired, V> {
  const { values = [] as unknown as V, defaultValue = null, caseSensitive = true, transform, i18n, directIssue = false, whitespaceAsEmpty = false } = options ?? {}

  const isRequired = required ?? (false as IsRequired)
  const valuesArr = values as readonly (string | number)[]
  const isAllStrings = valuesArr.every((v) => typeof v === "string")

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

  const isEmpty = (v: unknown) => v === "" || v === null || v === undefined

  // Outer preprocess gives the schema optin "optional" (like number/text), so a missing z.object key runs the
  // empty-value logic (null / defaultValue / required) instead of failing with "expected nonoptional".
  // Opt-in whitespaceAsEmpty: whitespace-only strings become empty here, before any matching against values.
  // A value Zod cannot inspect (e.g. a revoked Proxy) would make the inner schema throw; it is rejected with the "invalid" message instead.
  const withOptionalIn = (inner: ZodType) =>
    z.preprocess((input, ctx) => {
      if (!isDescribable(input)) return rejectInput(ctx, getMessage("invalid", { values: valuesArr.join(", ") }))
      return whitespaceAsEmpty && typeof input === "string" && input.trim() === "" ? undefined : input
    }, inner)

  // Build the value-matching schema using z.enum() or z.union(z.literal())
  let valueSchema: ZodType
  if (isAllStrings && valuesArr.length > 0) {
    valueSchema = z.enum(valuesArr as unknown as readonly [string, ...string[]], {
      error: (issue) => {
        if (isEmpty(issue.input)) return getMessage("required")
        return getMessage("invalid", { values: valuesArr.join(", ") })
      },
    })
  } else if (valuesArr.length >= 2) {
    const literals = valuesArr.map((v) => z.literal(v))
    valueSchema = z.union(literals as unknown as readonly [ZodType, ZodType, ...ZodType[]], {
      error: () => getMessage("invalid", { values: valuesArr.join(", ") }),
    })
  } else if (valuesArr.length === 1) {
    valueSchema = z.literal(valuesArr[0])
  } else {
    valueSchema = z.never()
  }

  // Case-insensitive: normalize string input to the matching option; non-string input (e.g. numbers) passes through unchanged
  if (!caseSensitive) {
    valueSchema = z.preprocess((v) => {
      if (typeof v !== "string") return v
      const match = valuesArr.find((val) => typeof val === "string" && val.toLowerCase() === v.toLowerCase())
      return match ?? v
    }, valueSchema)
  }

  // User transform (applied after validation)
  if (transform) {
    valueSchema = valueSchema.transform((v) => transform(v as V[number]))
  }

  // Handle required vs optional
  const fallback = defaultValue as V[number] | null

  // Opt-in: dispatch manually so a non-empty invalid value yields the "invalid" message as the top-level issue
  if (directIssue) {
    const candidates: ZodType[] = [valueSchema]
    if (!isAllStrings) {
      candidates.push(
        z
          .string()
          .transform((v) => {
            // Blank strings are not coerced (Number("") === Number(" ") === 0); "" is handled as empty, whitespace stays invalid
            if (v.trim() === "") return v
            const n = Number(v)
            return isNaN(n) ? v : n
          })
          .pipe(valueSchema as ZodType<any, any>)
      )
    }

    return withOptionalIn(
      z.unknown().transform((input, ctx) => {
        if (isEmpty(input)) {
          if (isRequired && fallback === null) {
            ctx.addIssue({ code: "custom", message: getMessage("required") })
            return z.NEVER
          }
          return fallback
        }

        for (const candidate of candidates) {
          const result = candidate.safeParse(input)
          if (result.success) return result.data
        }

        ctx.addIssue({ code: "custom", message: getMessage("invalid", { values: valuesArr.join(", ") }) })
        return z.NEVER
      })
    ) as unknown as OneOfSchema<IsRequired, V>
  }
  const emptySchema = z.union([z.literal("" as const), z.null(), z.undefined()]).transform(() => fallback)

  if (isRequired && fallback === null) {
    // Required, no default: empty values should fail with "required" message
    const emptyRejectSchema = z.union([z.literal("" as const), z.null(), z.undefined()]).refine(() => false, { message: getMessage("required") })

    // For numeric values from forms (string "3" → number 3)
    if (!isAllStrings) {
      const numCoerceSchema = z
        .string()
        .transform((v) => {
          // Blank strings are not coerced (Number("") === Number(" ") === 0); "" is handled as empty, whitespace stays invalid
          if (v.trim() === "") return v
          const n = Number(v)
          return isNaN(n) ? v : n
        })
        .pipe(valueSchema as ZodType<any, any>)
      return withOptionalIn(z.union([valueSchema, numCoerceSchema, emptyRejectSchema])) as unknown as OneOfSchema<IsRequired, V>
    }

    return withOptionalIn(z.union([valueSchema, emptyRejectSchema])) as unknown as OneOfSchema<IsRequired, V>
  }

  // Required with default or optional: empty values → fallback
  if (!isAllStrings) {
    const numCoerceSchema = z
      .string()
      .transform((v) => {
        // Blank strings are not coerced (Number("") === Number(" ") === 0); "" is handled as empty, whitespace stays invalid
        if (v.trim() === "") return v
        const n = Number(v)
        return isNaN(n) ? v : n
      })
      .pipe(valueSchema as ZodType<any, any>)
    return withOptionalIn(z.union([valueSchema, numCoerceSchema, emptySchema])) as unknown as OneOfSchema<IsRequired, V>
  }

  return withOptionalIn(z.union([valueSchema, emptySchema])) as unknown as OneOfSchema<IsRequired, V>
}
