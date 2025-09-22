/**
 * @fileoverview Date validator for Zod Kit
 *
 * Provides comprehensive date validation with format support, range validation,
 * temporal constraints, and weekday/weekend filtering using dayjs library.
 *
 * @author Ong Hoe Yuan
 * @version 0.0.5
 */

import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import isToday from "dayjs/plugin/isToday"
import weekday from "dayjs/plugin/weekday"

// Initialize dayjs plugins for extended date functionality
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.extend(customParseFormat)
dayjs.extend(isToday)
dayjs.extend(weekday)

/**
 * Type definition for date validation error messages
 *
 * @interface DateMessages
 * @property {string} [required] - Message when field is required but empty
 * @property {string} [invalid] - Message when date is invalid
 * @property {string} [format] - Message when date doesn't match expected format
 * @property {string} [min] - Message when date is before minimum allowed
 * @property {string} [max] - Message when date is after maximum allowed
 * @property {string} [includes] - Message when date string doesn't contain required text
 * @property {string} [excludes] - Message when date string contains forbidden text
 * @property {string} [past] - Message when date must be in the past
 * @property {string} [future] - Message when date must be in the future
 * @property {string} [today] - Message when date must be today
 * @property {string} [notToday] - Message when date must not be today
 * @property {string} [weekday] - Message when date must be a weekday
 * @property {string} [notWeekday] - Message when date must not be a weekday
 * @property {string} [weekend] - Message when date must be a weekend
 * @property {string} [notWeekend] - Message when date must not be a weekend
 */
export type DateMessages = {
  required?: string
  invalid?: string
  format?: string
  min?: string
  max?: string
  includes?: string
  excludes?: string
  past?: string
  future?: string
  today?: string
  notToday?: string
  weekday?: string
  notWeekday?: string
  weekend?: string
  notWeekend?: string
}

/**
 * Configuration options for date validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 *
 * @interface DateOptions
 * @property {IsRequired} [required=true] - Whether the field is required
 * @property {string} [min] - Minimum allowed date (in same format as specified)
 * @property {string} [max] - Maximum allowed date (in same format as specified)
 * @property {string} [format="YYYY-MM-DD"] - Date format for parsing and validation
 * @property {string} [includes] - String that must be included in the date
 * @property {string | string[]} [excludes] - String(s) that must not be included
 * @property {boolean} [mustBePast] - Whether date must be in the past
 * @property {boolean} [mustBeFuture] - Whether date must be in the future
 * @property {boolean} [mustBeToday] - Whether date must be today
 * @property {boolean} [mustNotBeToday] - Whether date must not be today
 * @property {boolean} [weekdaysOnly] - Whether date must be a weekday (Monday-Friday)
 * @property {boolean} [weekendsOnly] - Whether date must be a weekend (Saturday-Sunday)
 * @property {Function} [transform] - Custom transformation function for date strings
 * @property {string | null} [defaultValue] - Default value when input is empty
 * @property {Record<Locale, DateMessages>} [i18n] - Custom error messages for different locales
 */
export type DateOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  min?: string
  max?: string
  format?: string
  includes?: string
  excludes?: string | string[]
  mustBePast?: boolean
  mustBeFuture?: boolean
  mustBeToday?: boolean
  mustNotBeToday?: boolean
  weekdaysOnly?: boolean
  weekendsOnly?: boolean
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Record<Locale, DateMessages>
}

/**
 * Type alias for date validation schema based on required flag
 *
 * @template IsRequired - Whether the field is required
 * @typedef DateSchema
 * @description Returns ZodString if required, ZodNullable<ZodString> if optional
 */
export type DateSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

/**
 * Creates a Zod schema for date validation with temporal constraints
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @param {DateOptions<IsRequired>} [options] - Configuration options for date validation
 * @returns {DateSchema<IsRequired>} Zod schema for date validation
 *
 * @description
 * Creates a comprehensive date validator with format support, range validation,
 * temporal constraints, and weekday/weekend filtering using dayjs library.
 *
 * Features:
 * - Flexible date format parsing (default: YYYY-MM-DD)
 * - Range validation (min/max dates)
 * - Temporal validation (past/future/today)
 * - Weekday/weekend filtering
 * - Content inclusion/exclusion
 * - Custom transformation functions
 * - Comprehensive internationalization
 * - Strict date parsing with format validation
 *
 * @example
 * ```typescript
 * // Basic date validation (YYYY-MM-DD)
 * const basicSchema = date()
 * basicSchema.parse("2024-03-15") // ✓ Valid
 * basicSchema.parse("2024-13-01") // ✗ Invalid (month 13)
 *
 * // Custom format
 * const customFormatSchema = date({ format: "DD/MM/YYYY" })
 * customFormatSchema.parse("15/03/2024") // ✓ Valid
 * customFormatSchema.parse("2024-03-15") // ✗ Invalid (wrong format)
 *
 * // Date range validation
 * const rangeSchema = date({
 *   min: "2024-01-01",
 *   max: "2024-12-31"
 * })
 * rangeSchema.parse("2024-06-15") // ✓ Valid
 * rangeSchema.parse("2023-12-31") // ✗ Invalid (before min)
 *
 * // Future dates only
 * const futureSchema = date({ mustBeFuture: true })
 * futureSchema.parse("2030-01-01") // ✓ Valid (assuming current date < 2030)
 * futureSchema.parse("2020-01-01") // ✗ Invalid (past date)
 *
 * // Weekdays only (Monday-Friday)
 * const weekdaySchema = date({ weekdaysOnly: true })
 * weekdaySchema.parse("2024-03-15") // ✓ Valid (if Friday)
 * weekdaySchema.parse("2024-03-16") // ✗ Invalid (if Saturday)
 *
 * // Business date validation
 * const businessSchema = date({
 *   format: "YYYY-MM-DD",
 *   mustBeFuture: true,
 *   weekdaysOnly: true
 * })
 *
 * // Optional with default
 * const optionalSchema = date({
 *   required: false,
 *   defaultValue: "2024-01-01"
 * })
 * ```
 *
 * @throws {z.ZodError} When validation fails with specific error messages
 * @see {@link DateOptions} for all available configuration options
 */
export function date<IsRequired extends boolean = true>(options?: DateOptions<IsRequired>): DateSchema<IsRequired> {
  const {
    required = true,
    min,
    max,
    format = "YYYY-MM-DD",
    includes,
    excludes,
    mustBePast,
    mustBeFuture,
    mustBeToday,
    mustNotBeToday,
    weekdaysOnly,
    weekendsOnly,
    transform,
    defaultValue = null,
    i18n,
  } = options ?? {}

  const actualDefaultValue = defaultValue ?? (required ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof DateMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.date.${key}`, params)
  }

  // Preprocessing function with transformations
  const preprocessFn = (val: unknown) => {
    if (val === "" || val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val).trim()

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

    // Format validation
    if (val !== null && !dayjs(val, format, true).isValid()) {
      throw new z.ZodError([{ code: "custom", message: getMessage("format", { format }), path: [] }])
    }

    const dateObj = dayjs(val, format)

    // Range checks
    if (val !== null && min !== undefined && !dateObj.isSameOrAfter(dayjs(min, format))) {
      throw new z.ZodError([{ code: "custom", message: getMessage("min", { min }), path: [] }])
    }
    if (val !== null && max !== undefined && !dateObj.isSameOrBefore(dayjs(max, format))) {
      throw new z.ZodError([{ code: "custom", message: getMessage("max", { max }), path: [] }])
    }

    // String content checks
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

    // Time-based validations
    const today = dayjs().startOf('day')
    const targetDate = dateObj.startOf('day')

    if (val !== null && mustBePast && !targetDate.isBefore(today)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("past"), path: [] }])
    }
    if (val !== null && mustBeFuture && !targetDate.isAfter(today)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("future"), path: [] }])
    }
    if (val !== null && mustBeToday && !targetDate.isSame(today)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("today"), path: [] }])
    }
    if (val !== null && mustNotBeToday && targetDate.isSame(today)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("notToday"), path: [] }])
    }

    // Weekday/weekend validations
    if (val !== null && weekdaysOnly && (dateObj.day() === 0 || dateObj.day() === 6)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("weekday"), path: [] }])
    }
    if (val !== null && weekendsOnly && dateObj.day() !== 0 && dateObj.day() !== 6) {
      throw new z.ZodError([{ code: "custom", message: getMessage("weekend"), path: [] }])
    }

    return true
  })

  return schema as unknown as DateSchema<IsRequired>
}
