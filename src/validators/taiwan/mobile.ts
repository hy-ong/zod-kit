import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

export type MobileMessages = {
  required?: string
  invalid?: string
  notInWhitelist?: string
}

export type MobileOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  whitelist?: string[]
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Record<Locale, MobileMessages>
}

export type MobileSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

// Taiwan mobile phone validation
const validateTaiwanMobile = (value: string): boolean => {
  // Taiwan mobile phone format: 09 + 8 digits
  // Valid prefixes: 090, 091, 092, 093, 094, 095, 096, 097, 098, 099
  return /^09[0-9]\d{7}$/.test(value)
}

export function mobile<IsRequired extends boolean = true>(options?: MobileOptions<IsRequired>): MobileSchema<IsRequired> {
  const { required = true, whitelist, transform, defaultValue, i18n } = options ?? {}

  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? (required ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof MobileMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`taiwan.mobile.${key}`, params)
  }

  // Preprocessing function
  const preprocessFn = (val: unknown) => {
    if (val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val).trim()

    // If after trimming we have an empty string
    if (processed === "") {
      // If empty string is in allowlist, return it as is
      if (whitelist && whitelist.includes("")) {
        return ""
      }
      // If the field is optional and empty string not in allowlist, return default value
      if (!required) {
        return actualDefaultValue
      }
      // If a field is required, return the default value (will be validated later)
      return actualDefaultValue
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

    // Allowlist check (if an allowlist is provided, only allow values in the allowlist)
    if (whitelist && whitelist.length > 0) {
      if (whitelist.includes(val)) {
        return true
      }
      // If not in the allowlist, reject regardless of format
      throw new z.ZodError([{ code: "custom", message: getMessage("notInWhitelist"), path: [] }])
    }

    // Taiwan mobile phone format validation (only if no allowlist or allowlist is empty)
    if (!validateTaiwanMobile(val)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("invalid"), path: [] }])
    }

    return true
  })

  return schema as unknown as MobileSchema<IsRequired>
}

// Export utility function for external use
export { validateTaiwanMobile }
