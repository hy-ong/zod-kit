/**
 * @fileoverview DateTime validator for Zod Kit
 *
 * Provides comprehensive datetime validation with support for multiple formats,
 * timezone handling, range validation, and internationalization.
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
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"

// Initialize dayjs plugins for extended functionality
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.extend(customParseFormat)
dayjs.extend(isToday)
dayjs.extend(weekday)
dayjs.extend(timezone)
dayjs.extend(utc)

/**
 * Type definition for datetime validation error messages
 *
 * @interface DateTimeMessages
 * @property {string} [required] - Message when field is required but empty
 * @property {string} [invalid] - Message when datetime format is invalid
 * @property {string} [format] - Message when datetime doesn't match expected format
 * @property {string} [min] - Message when datetime is before minimum allowed
 * @property {string} [max] - Message when datetime is after maximum allowed
 * @property {string} [includes] - Message when datetime doesn't include required string
 * @property {string} [excludes] - Message when datetime contains excluded string
 * @property {string} [past] - Message when datetime must be in the past
 * @property {string} [future] - Message when datetime must be in the future
 * @property {string} [today] - Message when datetime must be today
 * @property {string} [notToday] - Message when datetime must not be today
 * @property {string} [weekday] - Message when datetime must be a weekday
 * @property {string} [weekend] - Message when datetime must be a weekend
 * @property {string} [hour] - Message when hour is outside allowed range
 * @property {string} [minute] - Message when minute doesn't match step requirement
 * @property {string} [customRegex] - Message when custom regex validation fails
 * @property {string} [notInWhitelist] - Message when value is not in whitelist
 */
export type DateTimeMessages = {
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
  weekend?: string
  hour?: string
  minute?: string
  customRegex?: string
  notInWhitelist?: string
}

/**
 * Supported datetime formats for validation
 *
 * @typedef {string} DateTimeFormat
 *
 * Standard formats:
 * - YYYY-MM-DD HH:mm: ISO-style date with 24-hour time (2024-03-15 14:30)
 * - YYYY-MM-DD HH:mm:ss: ISO-style date with seconds (2024-03-15 14:30:45)
 * - YYYY-MM-DD hh:mm A: ISO-style date with 12-hour time (2024-03-15 02:30 PM)
 * - YYYY-MM-DD hh:mm:ss A: ISO-style date with 12-hour time and seconds (2024-03-15 02:30:45 PM)
 *
 * Regional formats:
 * - DD/MM/YYYY HH:mm: European format (15/03/2024 14:30)
 * - DD/MM/YYYY HH:mm:ss: European format with seconds (15/03/2024 14:30:45)
 * - DD/MM/YYYY hh:mm A: European format with 12-hour time (15/03/2024 02:30 PM)
 * - MM/DD/YYYY HH:mm: US format (03/15/2024 14:30)
 * - MM/DD/YYYY hh:mm A: US format with 12-hour time (03/15/2024 02:30 PM)
 * - YYYY/MM/DD HH:mm: Alternative slash format (2024/03/15 14:30)
 * - DD-MM-YYYY HH:mm: European dash format (15-03-2024 14:30)
 * - MM-DD-YYYY HH:mm: US dash format (03-15-2024 14:30)
 *
 * Special formats:
 * - ISO: ISO 8601 format (2024-03-15T14:30:45.000Z)
 * - RFC: RFC 2822 format (Fri, 15 Mar 2024 14:30:45 GMT)
 * - UNIX: Unix timestamp (1710508245)
 */
export type DateTimeFormat =
  | "YYYY-MM-DD HH:mm" // 2024-03-15 14:30
  | "YYYY-MM-DD HH:mm:ss" // 2024-03-15 14:30:45
  | "YYYY-MM-DD hh:mm A" // 2024-03-15 02:30 PM
  | "YYYY-MM-DD hh:mm:ss A" // 2024-03-15 02:30:45 PM
  | "DD/MM/YYYY HH:mm" // 15/03/2024 14:30
  | "DD/MM/YYYY HH:mm:ss" // 15/03/2024 14:30:45
  | "DD/MM/YYYY hh:mm A" // 15/03/2024 02:30 PM
  | "MM/DD/YYYY HH:mm" // 03/15/2024 14:30
  | "MM/DD/YYYY hh:mm A" // 03/15/2024 02:30 PM
  | "YYYY/MM/DD HH:mm" // 2024/03/15 14:30
  | "DD-MM-YYYY HH:mm" // 15-03-2024 14:30
  | "MM-DD-YYYY HH:mm" // 03-15-2024 14:30
  | "ISO" // ISO 8601: 2024-03-15T14:30:45.000Z
  | "RFC" // RFC 2822: Fri, 15 Mar 2024 14:30:45 GMT
  | "UNIX" // Unix timestamp: 1710508245

/**
 * Configuration options for datetime validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 *
 * @interface DateTimeOptions
 * @property {IsRequired} [required=true] - Whether the field is required
 * @property {DateTimeFormat} [format="YYYY-MM-DD HH:mm"] - Expected datetime format
 * @property {string | Date} [min] - Minimum allowed datetime
 * @property {string | Date} [max] - Maximum allowed datetime
 * @property {number} [minHour] - Minimum allowed hour (0-23)
 * @property {number} [maxHour] - Maximum allowed hour (0-23)
 * @property {number[]} [allowedHours] - Specific hours that are allowed
 * @property {number} [minuteStep] - Required minute intervals (e.g., 15 for :00, :15, :30, :45)
 * @property {string} [timezone] - Timezone for parsing and validation (e.g., "Asia/Taipei")
 * @property {string} [includes] - String that must be included in the datetime
 * @property {string | string[]} [excludes] - String(s) that must not be included
 * @property {RegExp} [regex] - Custom regex for validation (overrides format validation)
 * @property {"trim" | "trimStart" | "trimEnd" | "none"} [trimMode="trim"] - Whitespace handling
 * @property {"upper" | "lower" | "none"} [casing="none"] - Case transformation
 * @property {boolean} [mustBePast] - Whether datetime must be in the past
 * @property {boolean} [mustBeFuture] - Whether datetime must be in the future
 * @property {boolean} [mustBeToday] - Whether datetime must be today
 * @property {boolean} [mustNotBeToday] - Whether datetime must not be today
 * @property {boolean} [weekdaysOnly] - Whether datetime must be a weekday (Monday-Friday)
 * @property {boolean} [weekendsOnly] - Whether datetime must be a weekend (Saturday-Sunday)
 * @property {string[]} [whitelist] - Specific datetime strings that are always allowed
 * @property {boolean} [whitelistOnly=false] - If true, only values in whitelist are allowed
 * @property {Function} [transform] - Custom transformation function applied before validation
 * @property {string | null} [defaultValue] - Default value when input is empty
 * @property {Record<Locale, DateTimeMessages>} [i18n] - Custom error messages for different locales
 */
export type DateTimeOptions<IsRequired extends boolean = true> = {
  format?: DateTimeFormat
  min?: string | Date // Minimum datetime
  max?: string | Date // Maximum datetime
  minHour?: number // Minimum hour (0-23)
  maxHour?: number // Maximum hour (0-23)
  allowedHours?: number[] // Specific hours allowed
  minuteStep?: number // Minute intervals
  timezone?: string // Timezone (e.g., "Asia/Taipei")
  includes?: string // Must include specific substring
  excludes?: string | string[] // Must not contain specific substring(s)
  regex?: RegExp // Custom regex validation
  trimMode?: "trim" | "trimStart" | "trimEnd" | "none" // Whitespace handling
  casing?: "upper" | "lower" | "none" // Case transformation
  mustBePast?: boolean // Must be in the past
  mustBeFuture?: boolean // Must be in the future
  mustBeToday?: boolean // Must be today
  mustNotBeToday?: boolean // Must not be today
  weekdaysOnly?: boolean // Only weekdays (Monday-Friday)
  weekendsOnly?: boolean // Only weekends (Saturday-Sunday)
  whitelist?: string[] // Allow specific datetime strings
  whitelistOnly?: boolean // If true, only allow values in whitelist
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Partial<Record<Locale, Partial<DateTimeMessages>>>
}

/**
 * Type alias for datetime validation schema based on required flag
 *
 * @template IsRequired - Whether the field is required
 * @typedef DateTimeSchema
 * @description Returns ZodString if required, ZodNullable<ZodString> if optional
 */
export type DateTimeSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

/**
 * Regular expression patterns for datetime format validation
 *
 * @constant {Record<DateTimeFormat, RegExp>} DATETIME_PATTERNS
 * @description Maps each supported datetime format to its corresponding regex pattern
 *
 * Pattern explanations:
 * - YYYY-MM-DD HH:mm: 4-digit year, 2-digit month, 2-digit day, 24-hour time
 * - ISO: ISO 8601 format with optional milliseconds and timezone
 * - RFC: RFC 2822 format with day name, date, time, and timezone
 * - UNIX: 10-digit Unix timestamp
 */
const DATETIME_PATTERNS: Record<DateTimeFormat, RegExp> = {
  "YYYY-MM-DD HH:mm": /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,
  "YYYY-MM-DD HH:mm:ss": /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
  "YYYY-MM-DD hh:mm A": /^\d{4}-\d{2}-\d{2} \d{1,2}:\d{2} (AM|PM)$/i,
  "YYYY-MM-DD hh:mm:ss A": /^\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}:\d{2} (AM|PM)$/i,
  "DD/MM/YYYY HH:mm": /^\d{1,2}\/\d{1,2}\/\d{4} \d{2}:\d{2}$/,
  "DD/MM/YYYY HH:mm:ss": /^\d{1,2}\/\d{1,2}\/\d{4} \d{2}:\d{2}:\d{2}$/,
  "DD/MM/YYYY hh:mm A": /^\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2} (AM|PM)$/i,
  "MM/DD/YYYY HH:mm": /^\d{1,2}\/\d{1,2}\/\d{4} \d{2}:\d{2}$/,
  "MM/DD/YYYY hh:mm A": /^\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2} (AM|PM)$/i,
  "YYYY/MM/DD HH:mm": /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/,
  "DD-MM-YYYY HH:mm": /^\d{1,2}-\d{1,2}-\d{4} \d{2}:\d{2}$/,
  "MM-DD-YYYY HH:mm": /^\d{1,2}-\d{1,2}-\d{4} \d{2}:\d{2}$/,
  ISO: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
  RFC: /^[A-Za-z]{3}, \d{1,2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} [A-Z]{3}$/,
  UNIX: /^\d{10}$/,
}

/**
 * Validates if a datetime string matches the specified format pattern
 *
 * @param {string} value - The datetime string to validate
 * @param {DateTimeFormat} format - The expected datetime format
 * @returns {boolean} True if the datetime is valid for the given format
 *
 * @description
 * Performs both regex pattern matching and actual datetime parsing validation.
 * Returns false if either the pattern doesn't match or the parsed datetime is invalid.
 *
 * @example
 * ```typescript
 * validateDateTimeFormat("2024-03-15 14:30", "YYYY-MM-DD HH:mm") // true
 * validateDateTimeFormat("2024-03-15 25:30", "YYYY-MM-DD HH:mm") // false (invalid hour)
 * validateDateTimeFormat("15/03/2024", "YYYY-MM-DD HH:mm") // false (wrong format)
 * ```
 */
const validateDateTimeFormat = (value: string, format: DateTimeFormat): boolean => {
  const pattern = DATETIME_PATTERNS[format]
  if (!pattern.test(value.trim())) {
    return false
  }

  // Additional validation: check if the datetime is actually valid
  const parsed = parseDateTimeValue(value, format)
  return parsed !== null
}

/**
 * Parses a datetime string into a dayjs object using the specified format
 *
 * @param {string} value - The datetime string to parse
 * @param {DateTimeFormat} format - The expected datetime format
 * @param {string} [timezone] - Optional timezone for parsing (e.g., "Asia/Taipei")
 * @returns {dayjs.Dayjs | null} Parsed dayjs object or null if parsing fails
 *
 * @description
 * Handles different datetime formats including ISO, RFC, Unix timestamps, and custom formats.
 * Uses strict parsing mode for custom formats to ensure accuracy.
 * Applies timezone conversion if specified.
 *
 * @example
 * ```typescript
 * parseDateTimeValue("2024-03-15 14:30", "YYYY-MM-DD HH:mm")
 * // Returns dayjs object for March 15, 2024 at 2:30 PM
 *
 * parseDateTimeValue("1710508245", "UNIX")
 * // Returns dayjs object for the Unix timestamp
 *
 * parseDateTimeValue("2024-03-15T14:30:45.000Z", "ISO")
 * // Returns dayjs object for the ISO datetime
 * ```
 *
 * @throws {Error} Returns null if parsing fails or datetime is invalid
 */
const parseDateTimeValue = (value: string, format: DateTimeFormat, timezone?: string): dayjs.Dayjs | null => {
  try {
    const cleanValue = value.trim()

    let parsed: dayjs.Dayjs

    switch (format) {
      case "ISO":
        parsed = dayjs(cleanValue)
        break
      case "RFC":
        parsed = dayjs(cleanValue)
        break
      case "UNIX":
        parsed = dayjs.unix(parseInt(cleanValue, 10))
        break
      default:
        parsed = dayjs(cleanValue, format, true) // strict parsing
        break
    }

    if (!parsed.isValid()) {
      return null
    }

    // Apply timezone if specified
    if (timezone) {
      parsed = parsed.tz(timezone)
    }

    return parsed
  } catch {
    return null
  }
}

/**
 * Normalizes a datetime string to the specified format
 *
 * @param {string} value - The datetime string to normalize
 * @param {DateTimeFormat} format - The target datetime format
 * @param {string} [timezone] - Optional timezone for formatting
 * @returns {string | null} Normalized datetime string or null if parsing fails
 *
 * @description
 * Parses the input datetime and formats it according to the specified format.
 * Handles special formats like ISO, RFC, and Unix timestamps appropriately.
 * Returns null if the input datetime cannot be parsed.
 *
 * @example
 * ```typescript
 * normalizeDateTimeValue("2024-3-15 2:30 PM", "YYYY-MM-DD HH:mm")
 * // Returns "2024-03-15 14:30"
 *
 * normalizeDateTimeValue("1710508245", "ISO")
 * // Returns "2024-03-15T14:30:45.000Z"
 * ```
 */
const normalizeDateTimeValue = (value: string, format: DateTimeFormat, timezone?: string): string | null => {
  const parsed = parseDateTimeValue(value, format, timezone)
  if (!parsed) return null

  switch (format) {
    case "ISO":
      return parsed.toISOString()
    case "RFC":
      return parsed.format("ddd, DD MMM YYYY HH:mm:ss [GMT]")
    case "UNIX":
      return parsed.unix().toString()
    default:
      return parsed.format(format)
  }
}

/**
 * Creates a Zod schema for datetime validation with comprehensive options
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @param {IsRequired} [required=false] - Whether the field is required
 * @param {Omit<ValidatorOptions<IsRequired>, 'required'>} [options] - Configuration options for validation
 * @returns {DateTimeSchema<IsRequired>} Zod schema for datetime validation
 *
 * @description
 * Creates a comprehensive datetime validator that supports multiple formats, timezone handling,
 * range validation, temporal constraints, and extensive customization options.
 *
 * Features:
 * - Multiple datetime formats (ISO, RFC, Unix, regional formats)
 * - Timezone support and conversion
 * - Range validation (min/max datetime)
 * - Hour and minute constraints
 * - Temporal validation (past/future/today)
 * - Weekday/weekend validation
 * - Whitelist/blacklist support
 * - Custom regex patterns
 * - String transformation and case handling
 * - Comprehensive internationalization
 *
 * @example
 * ```typescript
 * // Basic datetime validation
 * const basicSchema = datetime() // optional by default
 * basicSchema.parse("2024-03-15 14:30") // ✓ Valid
 * basicSchema.parse(null) // ✓ Valid (optional)
 *
 * // Required validation
 * const requiredSchema = parse("2024-03-15 14:30") // ✓ Valid
(true)
 * requiredSchema.parse(null) // ✗ Invalid (required)
 *
 *
 * // Business hours validation
 * const businessHours = datetime({
 *   format: "YYYY-MM-DD HH:mm",
 *   minHour: 9,
 *   maxHour: 17,
 *   weekdaysOnly: true
 * })
 *
 * // Timezone-aware validation
 * const timezoneSchema = datetime(false, {
 *   timezone: "Asia/Taipei",
 *   mustBeFuture: true
 * })
 *
 * // Multiple format support
 * const flexibleSchema = datetime(false, {
 *   format: "DD/MM/YYYY HH:mm"
 * })
 * flexibleSchema.parse("15/03/2024 14:30") // ✓ Valid
 *
 * // Optional with default
 * const optionalSchema = datetime(false, {
 *   defaultValue: "2024-01-01 00:00"
 * })
 * ```
 *
 * @throws {z.ZodError} When validation fails with specific error messages
 * @see {@link DateTimeOptions} for all available configuration options
 * @see {@link DateTimeFormat} for supported datetime formats
 */
export function datetime<IsRequired extends boolean = false>(required?: IsRequired, options?: Omit<DateTimeOptions<IsRequired>, 'required'>): DateTimeSchema<IsRequired> {
  const {
    format = "YYYY-MM-DD HH:mm",
    min,
    max,
    minHour,
    maxHour,
    allowedHours,
    minuteStep,
    timezone,
    includes,
    excludes,
    regex,
    trimMode = "trim",
    casing = "none",
    mustBePast,
    mustBeFuture,
    mustBeToday,
    mustNotBeToday,
    weekdaysOnly,
    weekendsOnly,
    whitelist,
    whitelistOnly = false,
    transform,
    defaultValue,
    i18n,
  } = options ?? {}

  const isRequired = required ?? false as IsRequired

  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? (isRequired ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof DateTimeMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.datetime.${key}`, params)
  }

  // Preprocessing function
  const preprocessFn = (val: unknown) => {
    if (val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val)

    // Apply trim mode
    switch (trimMode) {
      case "trim":
        processed = processed.trim()
        break
      case "trimStart":
        processed = processed.trimStart()
        break
      case "trimEnd":
        processed = processed.trimEnd()
        break
      case "none":
        // No trimming
        break
    }

    // If after trimming we have an empty string
    if (processed === "") {
      // If empty string is in whitelist, return it as is
      if (whitelist && whitelist.includes("")) {
        return ""
      }
      // If the field is optional and empty string not in whitelist, return default value
      if (!isRequired) {
        return actualDefaultValue
      }
      // If a field is required, return the default value (will be validated later)
      return actualDefaultValue
    }

    // Apply case transformation
    switch (casing) {
      case "upper":
        processed = processed.toUpperCase()
        break
      case "lower":
        processed = processed.toLowerCase()
        break
      case "none":
        // No case transformation
        break
    }

    if (transform) {
      processed = transform(processed)
    }

    return processed
  }

  const baseSchema = isRequired ? z.preprocess(preprocessFn, z.string()) : z.preprocess(preprocessFn, z.string().nullable())

  const schema = baseSchema.superRefine((val, ctx) => {
    if (val === null) return

    // Required check
    if (isRequired && (val === "" || val === "null" || val === "undefined")) {
      ctx.addIssue({ code: "custom", message: getMessage("required") })
      return
    }

    if (val === null) return
    if (!isRequired && val === "") return

    // Whitelist check
    if (whitelist && whitelist.length > 0) {
      if (whitelist.includes(val)) {
        return
      }
      // If whitelistOnly is true, reject values not in whitelist
      if (whitelistOnly) {
        ctx.addIssue({ code: "custom", message: getMessage("notInWhitelist") })
        return
      }
      // Otherwise, continue with normal validation
    }

    // Custom regex validation (overrides format validation)
    if (regex) {
      if (!regex.test(val)) {
        ctx.addIssue({ code: "custom", message: getMessage("customRegex") })
        return
      }
    } else {
      // DateTime format validation (only if no regex is provided)
      if (!validateDateTimeFormat(val, format)) {
        ctx.addIssue({ code: "custom", message: getMessage("format", { format }) })
        return
      }
    }

    // String content checks
    if (includes && !val.includes(includes)) {
      ctx.addIssue({ code: "custom", message: getMessage("includes", { includes }) })
      return
    }

    if (excludes) {
      const excludeList = Array.isArray(excludes) ? excludes : [excludes]
      for (const exclude of excludeList) {
        if (val.includes(exclude)) {
          ctx.addIssue({ code: "custom", message: getMessage("excludes", { excludes: exclude }) })
          return
        }
      }
    }

    // Skip datetime parsing and range validation if using custom regex
    if (regex) {
      return
    }

    // Parse datetime for validation
    const parsed = parseDateTimeValue(val, format, timezone)
    if (!parsed) {
      // Check if it's a format issue or parsing issue
      const pattern = DATETIME_PATTERNS[format]
      if (!pattern.test(val.trim())) {
        ctx.addIssue({ code: "custom", message: getMessage("format", { format }) })
        return
      } else {
        ctx.addIssue({ code: "custom", message: getMessage("invalid") })
        return
      }
    }

    // Hour validation
    const hour = parsed.hour()
    if (minHour !== undefined && hour < minHour) {
      ctx.addIssue({ code: "custom", message: getMessage("hour", { minHour, maxHour: maxHour ?? 23 }) })
      return
    }
    if (maxHour !== undefined && hour > maxHour) {
      ctx.addIssue({ code: "custom", message: getMessage("hour", { minHour: minHour ?? 0, maxHour }) })
      return
    }

    // Allowed hours check
    if (allowedHours && allowedHours.length > 0) {
      if (!allowedHours.includes(hour)) {
        ctx.addIssue({ code: "custom", message: getMessage("hour", { allowedHours: allowedHours.join(", ") }) })
        return
      }
    }

    // Minute step validation
    const minute = parsed.minute()
    if (minuteStep !== undefined && minute % minuteStep !== 0) {
      ctx.addIssue({ code: "custom", message: getMessage("minute", { minuteStep }) })
      return
    }

    // DateTime range validation (min/max)
    if (min) {
      const minParsed = typeof min === "string" ? parseDateTimeValue(min, format, timezone) : dayjs(min)
      if (minParsed && parsed.isBefore(minParsed)) {
        const minFormatted = typeof min === "string" ? min : minParsed.format(format)
        ctx.addIssue({ code: "custom", message: getMessage("min", { min: minFormatted }) })
        return
      }
    }

    if (max) {
      const maxParsed = typeof max === "string" ? parseDateTimeValue(max, format, timezone) : dayjs(max)
      if (maxParsed && parsed.isAfter(maxParsed)) {
        const maxFormatted = typeof max === "string" ? max : maxParsed.format(format)
        ctx.addIssue({ code: "custom", message: getMessage("max", { max: maxFormatted }) })
        return
      }
    }

    // Time-based validations
    const now = timezone ? dayjs().tz(timezone) : dayjs()

    if (mustBePast && !parsed.isBefore(now)) {
      ctx.addIssue({ code: "custom", message: getMessage("past") })
      return
    }

    if (mustBeFuture && !parsed.isAfter(now)) {
      ctx.addIssue({ code: "custom", message: getMessage("future") })
      return
    }

    if (mustBeToday && !parsed.isSame(now, "day")) {
      ctx.addIssue({ code: "custom", message: getMessage("today") })
      return
    }

    if (mustNotBeToday && parsed.isSame(now, "day")) {
      ctx.addIssue({ code: "custom", message: getMessage("notToday") })
      return
    }

    // Weekday validations
    const dayOfWeek = parsed.day() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    if (weekdaysOnly && (dayOfWeek === 0 || dayOfWeek === 6)) {
      ctx.addIssue({ code: "custom", message: getMessage("weekday") })
      return
    }

    if (weekendsOnly && dayOfWeek !== 0 && dayOfWeek !== 6) {
      ctx.addIssue({ code: "custom", message: getMessage("weekend") })
      return
    }
  })

  return schema as unknown as DateTimeSchema<IsRequired>
}

/**
 * Utility functions and constants exported for external use
 *
 * @description
 * These utilities can be used independently for datetime parsing, validation, and normalization
 * without creating a full Zod schema. Useful for custom validation logic or preprocessing.
 *
 * @example
 * ```typescript
 * import { validateDateTimeFormat, parseDateTimeValue, DATETIME_PATTERNS } from './datetime'
 *
 * // Check if a string matches a format
 * const isValid = validateDateTimeFormat("2024-03-15 14:30", "YYYY-MM-DD HH:mm")
 *
 * // Parse to dayjs object
 * const parsed = parseDateTimeValue("2024-03-15 14:30", "YYYY-MM-DD HH:mm")
 *
 * // Access regex patterns
 * const pattern = DATETIME_PATTERNS["YYYY-MM-DD HH:mm"]
 * ```
 */
export { validateDateTimeFormat, parseDateTimeValue, normalizeDateTimeValue, DATETIME_PATTERNS }
