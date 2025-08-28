import { z, ZodNullable, ZodString } from "zod"
import { t } from "../i18n"
import { getLocale, type Locale } from "../config"

export type TextMessages = {
  required?: string
  notEmpty?: string
  minLength?: string
  maxLength?: string
  startsWith?: string
  endsWith?: string
  includes?: string
  excludes?: string
  invalid?: string
}

export type TextOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  minLength?: number
  maxLength?: number
  startsWith?: string
  endsWith?: string
  includes?: string
  excludes?: string | string[]
  regex?: RegExp
  trimMode?: "trim" | "trimStart" | "trimEnd" | "none"
  casing?: "upper" | "lower" | "title" | "none"
  transform?: (value: string) => string
  notEmpty?: boolean
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Record<Locale, TextMessages>
}

export type TextSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

export function text<IsRequired extends boolean = true>(options?: TextOptions<IsRequired>): TextSchema<IsRequired> {
  const { required = true, minLength, maxLength, startsWith, endsWith, includes, excludes, regex, trimMode = "trim", casing = "none", transform, notEmpty, defaultValue, i18n } = options ?? {}

  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? (required ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof TextMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.text.${key}`, params)
  }

  // Helper functions to apply trimming based on the mode
  const applyTrim = (str: string): string => {
    switch (trimMode) {
      case "trimStart":
        return str.trimStart()
      case "trimEnd":
        return str.trimEnd()
      case "none":
        return str
      default:
        return str.trim()
    }
  }

  // Helper function to apply casing
  const applyCasing = (str: string): string => {
    switch (casing) {
      case "upper":
        return str.toUpperCase()
      case "lower":
        return str.toLowerCase()
      case "title":
        return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase())
      default:
        return str
    }
  }

  // Preprocessing function with optimized transformations
  const preprocessFn = (val: unknown) => {
    if (val === "" || val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val)
    processed = applyTrim(processed)
    processed = applyCasing(processed)

    if (transform) {
      processed = transform(processed)
    }

    return processed
  }

  const baseSchema = required ? z.preprocess(preprocessFn, z.string()) : z.preprocess(preprocessFn, z.string().nullable())

  // Single refine with all validations for better performance
  const schema = baseSchema.refine((val) => {
    if (val === null) return true

    // Required check
    if (required && (val === "" || val === "null" || val === "undefined")) {
      throw new z.ZodError([{ code: "custom", message: getMessage("required"), path: [] }])
    }

    // Not empty check (different from required - checks whitespace)
    // For notEmpty, we need to check if the original string (before processing) was only whitespace
    if (notEmpty && val !== null && val.trim() === "") {
      throw new z.ZodError([{ code: "custom", message: getMessage("notEmpty"), path: [] }])
    }

    // Length checks
    if (val !== null && minLength !== undefined && val.length < minLength) {
      throw new z.ZodError([{ code: "custom", message: getMessage("minLength", { minLength }), path: [] }])
    }
    if (val !== null && maxLength !== undefined && val.length > maxLength) {
      throw new z.ZodError([{ code: "custom", message: getMessage("maxLength", { maxLength }), path: [] }])
    }

    // String content checks
    if (val !== null && startsWith !== undefined && !val.startsWith(startsWith)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("startsWith", { startsWith }), path: [] }])
    }
    if (val !== null && endsWith !== undefined && !val.endsWith(endsWith)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("endsWith", { endsWith }), path: [] }])
    }
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
    if (val !== null && regex !== undefined && !regex.test(val)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("invalid", { regex }), path: [] }])
    }

    return true
  })

  return schema as unknown as TextSchema<IsRequired>
}
