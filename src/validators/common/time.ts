import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

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

export type TimeFormat =
  | "HH:mm"           // 24-hour format (14:30)
  | "HH:mm:ss"        // 24-hour with seconds (14:30:45)
  | "hh:mm A"         // 12-hour format (02:30 PM)
  | "hh:mm:ss A"      // 12-hour with seconds (02:30:45 PM)
  | "H:mm"            // 24-hour no leading zero (14:30, 9:30)
  | "h:mm A"          // 12-hour no leading zero (2:30 PM, 9:30 AM)

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

export type TimeSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

// Time format patterns
const TIME_PATTERNS: Record<TimeFormat, RegExp> = {
  "HH:mm": /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  "HH:mm:ss": /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/,
  "hh:mm A": /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i,
  "hh:mm:ss A": /^(0?[1-9]|1[0-2]):[0-5][0-9]:[0-5][0-9]\s?(AM|PM)$/i,
  "H:mm": /^([0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/,
  "h:mm A": /^([1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i,
}

// Parse time string to minutes since midnight for comparison
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

// Validate time format
const validateTimeFormat = (value: string, format: TimeFormat): boolean => {
  const pattern = TIME_PATTERNS[format]
  return pattern.test(value.trim())
}

// Normalize time to 24-hour format for internal processing
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

// Export utility functions for external use
export { validateTimeFormat, parseTimeToMinutes, normalizeTime, TIME_PATTERNS }