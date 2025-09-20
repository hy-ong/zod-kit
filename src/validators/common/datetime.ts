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

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.extend(customParseFormat)
dayjs.extend(isToday)
dayjs.extend(weekday)
dayjs.extend(timezone)
dayjs.extend(utc)

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

export type DateTimeFormat =
  | "YYYY-MM-DD HH:mm"              // 2024-03-15 14:30
  | "YYYY-MM-DD HH:mm:ss"           // 2024-03-15 14:30:45
  | "YYYY-MM-DD hh:mm A"            // 2024-03-15 02:30 PM
  | "YYYY-MM-DD hh:mm:ss A"         // 2024-03-15 02:30:45 PM
  | "DD/MM/YYYY HH:mm"              // 15/03/2024 14:30
  | "DD/MM/YYYY HH:mm:ss"           // 15/03/2024 14:30:45
  | "DD/MM/YYYY hh:mm A"            // 15/03/2024 02:30 PM
  | "MM/DD/YYYY HH:mm"              // 03/15/2024 14:30
  | "MM/DD/YYYY hh:mm A"            // 03/15/2024 02:30 PM
  | "YYYY/MM/DD HH:mm"              // 2024/03/15 14:30
  | "DD-MM-YYYY HH:mm"              // 15-03-2024 14:30
  | "MM-DD-YYYY HH:mm"              // 03-15-2024 14:30
  | "ISO"                           // ISO 8601: 2024-03-15T14:30:45.000Z
  | "RFC"                           // RFC 2822: Fri, 15 Mar 2024 14:30:45 GMT
  | "UNIX"                          // Unix timestamp: 1710508245

export type DateTimeOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  format?: DateTimeFormat
  min?: string | Date              // Minimum datetime
  max?: string | Date              // Maximum datetime
  minHour?: number                 // Minimum hour (0-23)
  maxHour?: number                 // Maximum hour (0-23)
  allowedHours?: number[]          // Specific hours allowed
  minuteStep?: number              // Minute intervals
  timezone?: string                // Timezone (e.g., "Asia/Taipei")
  includes?: string                // Must include specific substring
  excludes?: string | string[]     // Must not contain specific substring(s)
  regex?: RegExp                   // Custom regex validation
  trimMode?: "trim" | "trimStart" | "trimEnd" | "none" // Whitespace handling
  casing?: "upper" | "lower" | "none" // Case transformation
  mustBePast?: boolean             // Must be in the past
  mustBeFuture?: boolean           // Must be in the future
  mustBeToday?: boolean            // Must be today
  mustNotBeToday?: boolean         // Must not be today
  weekdaysOnly?: boolean           // Only weekdays (Monday-Friday)
  weekendsOnly?: boolean           // Only weekends (Saturday-Sunday)
  whitelist?: string[]             // Allow specific datetime strings
  whitelistOnly?: boolean          // If true, only allow values in whitelist
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Record<Locale, DateTimeMessages>
}

export type DateTimeSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

// DateTime format patterns
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
  "ISO": /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
  "RFC": /^[A-Za-z]{3}, \d{1,2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} [A-Z]{3}$/,
  "UNIX": /^\d{10}$/
}

// Validate datetime format
const validateDateTimeFormat = (value: string, format: DateTimeFormat): boolean => {
  const pattern = DATETIME_PATTERNS[format]
  if (!pattern.test(value.trim())) {
    return false
  }

  // Additional validation: check if the datetime is actually valid
  const parsed = parseDateTimeValue(value, format)
  return parsed !== null
}

// Parse datetime to dayjs object
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

// Normalize datetime to specified format
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

export function datetime<IsRequired extends boolean = true>(options?: DateTimeOptions<IsRequired>): DateTimeSchema<IsRequired> {
  const {
    required = true,
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

  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? (required ? "" : null)

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
      // DateTime format validation (only if no regex is provided)
      if (!validateDateTimeFormat(val, format)) {
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

    // Skip datetime parsing and range validation if using custom regex
    if (regex) {
      return true
    }

    // Parse datetime for validation
    const parsed = parseDateTimeValue(val, format, timezone)
    if (!parsed) {
      // Check if it's a format issue or parsing issue
      const pattern = DATETIME_PATTERNS[format]
      if (!pattern.test(val.trim())) {
        throw new z.ZodError([{ code: "custom", message: getMessage("format", { format }), path: [] }])
      } else {
        throw new z.ZodError([{ code: "custom", message: getMessage("invalid"), path: [] }])
      }
    }

    // Hour validation
    const hour = parsed.hour()
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
    const minute = parsed.minute()
    if (minuteStep !== undefined && minute % minuteStep !== 0) {
      throw new z.ZodError([{ code: "custom", message: getMessage("minute", { minuteStep }), path: [] }])
    }

    // DateTime range validation (min/max)
    if (min) {
      const minParsed = typeof min === "string"
        ? parseDateTimeValue(min, format, timezone)
        : dayjs(min)
      if (minParsed && parsed.isBefore(minParsed)) {
        const minFormatted = typeof min === "string" ? min : minParsed.format(format)
        throw new z.ZodError([{ code: "custom", message: getMessage("min", { min: minFormatted }), path: [] }])
      }
    }

    if (max) {
      const maxParsed = typeof max === "string"
        ? parseDateTimeValue(max, format, timezone)
        : dayjs(max)
      if (maxParsed && parsed.isAfter(maxParsed)) {
        const maxFormatted = typeof max === "string" ? max : maxParsed.format(format)
        throw new z.ZodError([{ code: "custom", message: getMessage("max", { max: maxFormatted }), path: [] }])
      }
    }

    // Time-based validations
    const now = timezone ? dayjs().tz(timezone) : dayjs()

    if (mustBePast && !parsed.isBefore(now)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("past"), path: [] }])
    }

    if (mustBeFuture && !parsed.isAfter(now)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("future"), path: [] }])
    }

    if (mustBeToday && !parsed.isSame(now, "day")) {
      throw new z.ZodError([{ code: "custom", message: getMessage("today"), path: [] }])
    }

    if (mustNotBeToday && parsed.isSame(now, "day")) {
      throw new z.ZodError([{ code: "custom", message: getMessage("notToday"), path: [] }])
    }

    // Weekday validations
    const dayOfWeek = parsed.day() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    if (weekdaysOnly && (dayOfWeek === 0 || dayOfWeek === 6)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("weekday"), path: [] }])
    }

    if (weekendsOnly && dayOfWeek !== 0 && dayOfWeek !== 6) {
      throw new z.ZodError([{ code: "custom", message: getMessage("weekend"), path: [] }])
    }

    return true
  })

  return schema as unknown as DateTimeSchema<IsRequired>
}

// Export utility functions for external use
export { validateDateTimeFormat, parseDateTimeValue, normalizeDateTimeValue, DATETIME_PATTERNS }