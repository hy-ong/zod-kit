/**
 * @fileoverview Time validator for Zod Kit
 *
 * Provides comprehensive time validation with support for multiple time formats,
 * hour/minute constraints, and advanced time-based validation options.
 *
 * @author Ong Hoe Yuan
 * @version 0.0.5
 */

import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

/**
 * Type definition for time validation error messages
 *
 * @interface TimeMessages
 * @property {string} [required] - Message when field is required but empty
 * @property {string} [invalid] - Message when time format is invalid
 * @property {string} [format] - Message when time doesn't match expected format
 * @property {string} [min] - Message when time is before minimum allowed
 * @property {string} [max] - Message when time is after maximum allowed
 * @property {string} [hour] - Message when hour is outside allowed range
 * @property {string} [minute] - Message when minute doesn't match step requirement
 * @property {string} [second] - Message when second doesn't match step requirement
 * @property {string} [includes] - Message when time doesn't contain required string
 * @property {string} [excludes] - Message when time contains forbidden string
 * @property {string} [customRegex] - Message when custom regex validation fails
 * @property {string} [notInWhitelist] - Message when value is not in whitelist
 */
export type TimeMessages = {
  required?: string
  invalid?: string
  format?: string
  min?: string
  max?: string
  hour?: string
  minute?: string
  second?: string
  includes?: string
  excludes?: string
  customRegex?: string
  notInWhitelist?: string
}

/**
 * Supported time formats for validation
 *
 * @typedef {string} TimeFormat
 *
 * Available formats:
 * - HH:mm: 24-hour format with leading zeros (14:30, 09:30)
 * - HH:mm:ss: 24-hour format with seconds (14:30:45, 09:30:15)
 * - hh:mm A: 12-hour format with AM/PM (02:30 PM, 09:30 AM)
 * - hh:mm:ss A: 12-hour format with seconds and AM/PM (02:30:45 PM)
 * - H:mm: 24-hour format without leading zeros (14:30, 9:30)
 * - h:mm A: 12-hour format without leading zeros (2:30 PM, 9:30 AM)
 */
export type TimeFormat =
  | "HH:mm"           // 24-hour format (14:30)
  | "HH:mm:ss"        // 24-hour with seconds (14:30:45)
  | "hh:mm A"         // 12-hour format (02:30 PM)
  | "hh:mm:ss A"      // 12-hour with seconds (02:30:45 PM)
  | "H:mm"            // 24-hour no leading zero (14:30, 9:30)
  | "h:mm A"          // 12-hour no leading zero (2:30 PM, 9:30 AM)

/**
 * Configuration options for time validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 *
 * @interface TimeOptions
 * @property {IsRequired} [required=true] - Whether the field is required
 * @property {TimeFormat} [format="HH:mm"] - Expected time format
 * @property {string} [min] - Minimum allowed time (e.g., "09:00")
 * @property {string} [max] - Maximum allowed time (e.g., "17:00")
 * @property {number} [minHour] - Minimum allowed hour (0-23)
 * @property {number} [maxHour] - Maximum allowed hour (0-23)
 * @property {number[]} [allowedHours] - Specific hours that are allowed
 * @property {number} [minuteStep] - Required minute intervals (e.g., 15 for :00, :15, :30, :45)
 * @property {number} [secondStep] - Required second intervals
 * @property {string} [includes] - String that must be included in the time
 * @property {string | string[]} [excludes] - String(s) that must not be included
 * @property {RegExp} [regex] - Custom regex for validation (overrides format validation)
 * @property {"trim" | "trimStart" | "trimEnd" | "none"} [trimMode="trim"] - Whitespace handling
 * @property {"upper" | "lower" | "none"} [casing="none"] - Case transformation
 * @property {string[]} [whitelist] - Specific time strings that are always allowed
 * @property {boolean} [whitelistOnly=false] - If true, only values in whitelist are allowed
 * @property {Function} [transform] - Custom transformation function applied before validation
 * @property {string | null} [defaultValue] - Default value when input is empty
 * @property {Record<Locale, TimeMessages>} [i18n] - Custom error messages for different locales
 */
export type TimeOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  format?: TimeFormat
  min?: string        // Minimum time (e.g., "09:00")
  max?: string        // Maximum time (e.g., "17:00")
  minHour?: number    // Minimum hour (0-23)
  maxHour?: number    // Maximum hour (0-23)
  allowedHours?: number[]  // Specific hours allowed
  minuteStep?: number // Minute intervals (e.g., 15 for :00, :15, :30, :45)
  secondStep?: number // Second intervals
  includes?: string   // Must include specific substring
  excludes?: string | string[] // Must not contain specific substring(s)
  regex?: RegExp      // Custom regex validation (overrides format)
  trimMode?: "trim" | "trimStart" | "trimEnd" | "none" // Whitespace handling
  casing?: "upper" | "lower" | "none" // Case transformation
  whitelist?: string[] // Allow specific time strings
  whitelistOnly?: boolean // If true, only allow values in whitelist (default: false)
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Record<Locale, TimeMessages>
}

/**
 * Type alias for time validation schema based on required flag
 *
 * @template IsRequired - Whether the field is required
 * @typedef TimeSchema
 * @description Returns ZodString if required, ZodNullable<ZodString> if optional
 */
export type TimeSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

/**
 * Regular expression patterns for time format validation
 *
 * @constant {Record<TimeFormat, RegExp>} TIME_PATTERNS
 * @description Maps each supported time format to its corresponding regex pattern
 */
const TIME_PATTERNS: Record<TimeFormat, RegExp> = {
  "HH:mm": /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  "HH:mm:ss": /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/,
  "hh:mm A": /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i,
  "hh:mm:ss A": /^(0?[1-9]|1[0-2]):[0-5][0-9]:[0-5][0-9]\s?(AM|PM)$/i,
  "H:mm": /^([0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
  "h:mm A": /^([1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i,
}

/**
 * Parses a time string to minutes since midnight for comparison
 *
 * @param {string} timeStr - The time string to parse
 * @param {TimeFormat} format - The expected time format
 * @returns {number | null} Minutes since midnight (0-1439) or null if parsing fails
 *
 * @description
 * Converts time strings to minutes since midnight for easy comparison and validation.
 * Handles both 12-hour and 24-hour formats with proper AM/PM conversion.
 *
 * @example
 * ```typescript
 * parseTimeToMinutes("14:30", "HH:mm") // 870 (14*60 + 30)
 * parseTimeToMinutes("2:30 PM", "h:mm A") // 870 (14*60 + 30)
 * parseTimeToMinutes("12:00 AM", "hh:mm A") // 0 (midnight)
 * parseTimeToMinutes("12:00 PM", "hh:mm A") // 720 (noon)
 * ```
 */
const parseTimeToMinutes = (timeStr: string, format: TimeFormat): number | null => {
  const cleanTime = timeStr.trim()

  try {
    if (format.includes("A")) {
      // 12-hour format
      const match = cleanTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s?(AM|PM)$/i)
      if (!match) return null

      const [, hourStr, minuteStr, , period] = match
      let hour = parseInt(hourStr, 10)
      const minute = parseInt(minuteStr, 10)

      // Validate ranges for 12-hour format
      if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
        return null
      }

      if (period.toUpperCase() === "PM" && hour !== 12) {
        hour += 12
      } else if (period.toUpperCase() === "AM" && hour === 12) {
        hour = 0
      }

      return hour * 60 + minute
    } else {
      // 24-hour format
      const match = cleanTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
      if (!match) return null

      const [, hourStr, minuteStr] = match
      const hour = parseInt(hourStr, 10)
      const minute = parseInt(minuteStr, 10)

      // Validate ranges for 24-hour format
      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        return null
      }

      return hour * 60 + minute
    }
  } catch {
    return null
  }
}

/**
 * Validates if a time string matches the specified format pattern
 *
 * @param {string} value - The time string to validate
 * @param {TimeFormat} format - The expected time format
 * @returns {boolean} True if the time matches the format pattern
 *
 * @description
 * Performs regex pattern matching to validate time format.
 * Does not validate actual time values (e.g., 25:00 would pass pattern but fail logic).
 *
 * @example
 * ```typescript
 * validateTimeFormat("14:30", "HH:mm") // true
 * validateTimeFormat("2:30 PM", "h:mm A") // true
 * validateTimeFormat("25:00", "HH:mm") // true (pattern matches)
 * validateTimeFormat("14:30", "h:mm A") // false (wrong format)
 * ```
 */
const validateTimeFormat = (value: string, format: TimeFormat): boolean => {
  const pattern = TIME_PATTERNS[format]
  return pattern.test(value.trim())
}

/**
 * Normalizes time to 24-hour format for internal processing
 *
 * @param {string} timeStr - The time string to normalize
 * @param {TimeFormat} format - The current time format
 * @returns {string | null} Normalized time string or null if parsing fails
 *
 * @description
 * Converts time strings to a standardized 24-hour format for consistent processing.
 * Handles AM/PM conversion and leading zero normalization.
 *
 * @example
 * ```typescript
 * normalizeTime("2:30 PM", "h:mm A") // "14:30"
 * normalizeTime("12:00 AM", "hh:mm A") // "00:00"
 * normalizeTime("9:30", "H:mm") // "09:30"
 * normalizeTime("14:30:45", "HH:mm:ss") // "14:30:45"
 * ```
 */
const normalizeTime = (timeStr: string, format: TimeFormat): string | null => {
  const cleanTime = timeStr.trim()

  if (format.includes("A")) {
    // Convert 12-hour to 24-hour
    const match = cleanTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s?(AM|PM)$/i)
    if (!match) return null

    const [, hourStr, minuteStr, secondStr = "00", period] = match
    let hour = parseInt(hourStr, 10)
    const minute = parseInt(minuteStr, 10)
    const second = parseInt(secondStr, 10)

    if (period.toUpperCase() === "PM" && hour !== 12) {
      hour += 12
    } else if (period.toUpperCase() === "AM" && hour === 12) {
      hour = 0
    }

    return format.includes("ss")
      ? `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`
      : `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
  }

  // Already 24-hour format, just normalize
  if (format === "H:mm") {
    const match = cleanTime.match(/^(\d{1,2}):(\d{2})$/)
    if (!match) return null
    const [, hourStr, minuteStr] = match
    return `${hourStr.padStart(2, "0")}:${minuteStr}`
  }

  return cleanTime
}

/**
 * Creates a Zod schema for time validation with comprehensive options
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @param {TimeOptions<IsRequired>} [options] - Configuration options for time validation
 * @returns {TimeSchema<IsRequired>} Zod schema for time validation
 *
 * @description
 * Creates a comprehensive time validator that supports multiple time formats,
 * hour/minute constraints, step validation, and extensive customization options.
 *
 * Features:
 * - Multiple time formats (24-hour, 12-hour, with/without seconds)
 * - Time range validation (min/max)
 * - Hour and minute constraints
 * - Step validation (e.g., 15-minute intervals)
 * - Whitelist/blacklist support
 * - Custom regex patterns
 * - String transformation and case handling
 * - Comprehensive internationalization
 *
 * @example
 * ```typescript
 * // Basic time validation (24-hour format)
 * const basicSchema = time()
 * basicSchema.parse("14:30") // ✓ Valid
 * basicSchema.parse("2:30 PM") // ✗ Invalid (wrong format)
 *
 * // 12-hour format with AM/PM
 * const ampmSchema = time({ format: "hh:mm A" })
 * ampmSchema.parse("02:30 PM") // ✓ Valid
 * ampmSchema.parse("14:30") // ✗ Invalid (wrong format)
 *
 * // Business hours validation
 * const businessHours = time({
 *   format: "HH:mm",
 *   minHour: 9,
 *   maxHour: 17,
 *   minuteStep: 15 // Only :00, :15, :30, :45
 * })
 * businessHours.parse("09:15") // ✓ Valid
 * businessHours.parse("18:00") // ✗ Invalid (after maxHour)
 * businessHours.parse("09:05") // ✗ Invalid (not 15-minute step)
 *
 * // Time range validation
 * const timeRangeSchema = time({
 *   min: "09:00",
 *   max: "17:00"
 * })
 * timeRangeSchema.parse("12:30") // ✓ Valid
 * timeRangeSchema.parse("08:00") // ✗ Invalid (before min)
 *
 * // Allowed hours only
 * const specificHours = time({
 *   allowedHours: [9, 12, 15, 18]
 * })
 * specificHours.parse("12:30") // ✓ Valid
 * specificHours.parse("11:30") // ✗ Invalid (hour not allowed)
 *
 * // Whitelist specific times
 * const whitelistSchema = time({
 *   whitelist: ["09:00", "12:00", "17:00"],
 *   whitelistOnly: true
 * })
 * whitelistSchema.parse("12:00") // ✓ Valid (in whitelist)
 * whitelistSchema.parse("13:00") // ✗ Invalid (not in whitelist)
 *
 * // Optional with default
 * const optionalSchema = time({
 *   required: false,
 *   defaultValue: "09:00"
 * })
 * optionalSchema.parse("") // ✓ Valid (returns "09:00")
 * ```
 *
 * @throws {z.ZodError} When validation fails with specific error messages
 * @see {@link TimeOptions} for all available configuration options
 * @see {@link TimeFormat} for supported time formats
 */
export function time<IsRequired extends boolean = true>(options?: TimeOptions<IsRequired>): TimeSchema<IsRequired> {
  const {
    required = true,
    format = "HH:mm",
    min,
    max,
    minHour,
    maxHour,
    allowedHours,
    minuteStep,
    secondStep,
    includes,
    excludes,
    regex,
    trimMode = "trim",
    casing = "none",
    whitelist,
    whitelistOnly = false,
    transform,
    defaultValue,
    i18n,
  } = options ?? {}

  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? (required ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof TimeMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.time.${key}`, params)
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
      if (!required) {
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

  const baseSchema = required ? z.preprocess(preprocessFn, z.string()) : z.preprocess(preprocessFn, z.string().nullable())

  const schema = baseSchema.refine((val) => {
    if (val === null) return true

    // Required check
    if (required && (val === "" || val === "null" || val === "undefined")) {
      throw new z.ZodError([{ code: "custom", message: getMessage("required"), path: [] }])
    }

    if (val === null) return true
    if (!required && val === "") return true

    // Whitelist check
    if (whitelist && whitelist.length > 0) {
      if (whitelist.includes(val)) {
        return true
      }
      // If whitelistOnly is true, reject values not in whitelist
      if (whitelistOnly) {
        throw new z.ZodError([{ code: "custom", message: getMessage("notInWhitelist"), path: [] }])
      }
      // Otherwise, continue with normal validation
    }

    // Custom regex validation (overrides format validation)
    if (regex) {
      if (!regex.test(val)) {
        throw new z.ZodError([{ code: "custom", message: getMessage("customRegex"), path: [] }])
      }
    } else {
      // Time format validation (only if no regex is provided)
      if (!validateTimeFormat(val, format)) {
        throw new z.ZodError([{ code: "custom", message: getMessage("format", { format }), path: [] }])
      }
    }

    // String content checks
    if (includes && !val.includes(includes)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("includes", { includes }), path: [] }])
    }

    if (excludes) {
      const excludeList = Array.isArray(excludes) ? excludes : [excludes]
      for (const exclude of excludeList) {
        if (val.includes(exclude)) {
          throw new z.ZodError([{ code: "custom", message: getMessage("excludes", { excludes: exclude }), path: [] }])
        }
      }
    }

    // Skip time parsing and range validation if using custom regex
    if (regex) {
      return true
    }

    // Parse time for range validation
    const timeMinutes = parseTimeToMinutes(val, format)
    if (timeMinutes === null) {
      throw new z.ZodError([{ code: "custom", message: getMessage("invalid"), path: [] }])
    }

    // Hour validation
    const hour = Math.floor(timeMinutes / 60)
    if (minHour !== undefined && hour < minHour) {
      throw new z.ZodError([{ code: "custom", message: getMessage("hour", { minHour, maxHour: maxHour ?? 23 }), path: [] }])
    }
    if (maxHour !== undefined && hour > maxHour) {
      throw new z.ZodError([{ code: "custom", message: getMessage("hour", { minHour: minHour ?? 0, maxHour }), path: [] }])
    }

    // Allowed hours check
    if (allowedHours && allowedHours.length > 0) {
      if (!allowedHours.includes(hour)) {
        throw new z.ZodError([{ code: "custom", message: getMessage("hour", { allowedHours: allowedHours.join(", ") }), path: [] }])
      }
    }

    // Minute step validation
    const minute = timeMinutes % 60
    if (minuteStep !== undefined && minute % minuteStep !== 0) {
      throw new z.ZodError([{ code: "custom", message: getMessage("minute", { minuteStep }), path: [] }])
    }

    // Second step validation (only for formats with seconds)
    if (secondStep !== undefined && format.includes("ss")) {
      // Parse seconds from the original value
      const secondMatch = val.match(/:(\d{2})$/)
      if (secondMatch) {
        const seconds = parseInt(secondMatch[1], 10)
        if (seconds % secondStep !== 0) {
          throw new z.ZodError([{ code: "custom", message: getMessage("second", { secondStep }), path: [] }])
        }
      }
    }

    // Time range validation (min/max)
    if (min) {
      const minMinutes = parseTimeToMinutes(min, format)
      if (minMinutes !== null && timeMinutes < minMinutes) {
        throw new z.ZodError([{ code: "custom", message: getMessage("min", { min }), path: [] }])
      }
    }

    if (max) {
      const maxMinutes = parseTimeToMinutes(max, format)
      if (maxMinutes !== null && timeMinutes > maxMinutes) {
        throw new z.ZodError([{ code: "custom", message: getMessage("max", { max }), path: [] }])
      }
    }

    return true
  })

  return schema as unknown as TimeSchema<IsRequired>
}

/**
 * Utility functions and constants exported for external use
 *
 * @description
 * These utilities can be used independently for time parsing, validation, and normalization
 * without creating a full Zod schema. Useful for custom validation logic or preprocessing.
 *
 * @example
 * ```typescript
 * import { validateTimeFormat, parseTimeToMinutes, normalizeTime, TIME_PATTERNS } from './time'
 *
 * // Check if a string matches a format
 * const isValid = validateTimeFormat("14:30", "HH:mm")
 *
 * // Convert time to minutes for comparison
 * const minutes = parseTimeToMinutes("2:30 PM", "h:mm A") // 870
 *
 * // Normalize to 24-hour format
 * const normalized = normalizeTime("2:30 PM", "h:mm A") // "14:30"
 *
 * // Access regex patterns
 * const pattern = TIME_PATTERNS["HH:mm"]
 * ```
 */
export { validateTimeFormat, parseTimeToMinutes, normalizeTime, TIME_PATTERNS }