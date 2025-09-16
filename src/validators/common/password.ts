import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

export type PasswordMessages = {
  required?: string
  min?: string
  max?: string
  uppercase?: string
  lowercase?: string
  digits?: string
  special?: string
  noRepeating?: string
  noSequential?: string
  noCommonWords?: string
  minStrength?: string
  excludes?: string
  includes?: string
  invalid?: string
}

export type PasswordStrength = "weak" | "medium" | "strong" | "very-strong"

export type PasswordOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  min?: number
  max?: number
  uppercase?: boolean
  lowercase?: boolean
  digits?: boolean
  special?: boolean
  noRepeating?: boolean
  noSequential?: boolean
  noCommonWords?: boolean
  minStrength?: PasswordStrength
  excludes?: string | string[]
  includes?: string
  regex?: RegExp
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Record<Locale, PasswordMessages>
}

export type PasswordSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

// Common weak passwords to check against
const COMMON_PASSWORDS = [
  "password",
  "123456",
  "123456789",
  "12345678",
  "12345",
  "1234567",
  "admin",
  "qwerty",
  "abc123",
  "password123",
  "letmein",
  "welcome",
  "monkey",
  "dragon",
  "sunshine",
  "princess",
]

// Helper function to calculate password strength
const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0

  // Length bonus
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1

  // Character variety
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 1

  // Deductions
  if (/(.)\1{2,}/.test(password)) score -= 1 // Repeating characters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) score -= 1 // Sequential

  if (score <= 2) return "weak"
  if (score <= 4) return "medium"
  if (score <= 6) return "strong"
  return "very-strong"
}

export function password<IsRequired extends boolean = true>(options?: PasswordOptions<IsRequired>): PasswordSchema<IsRequired> {
  const {
    required = true,
    min,
    max,
    uppercase,
    lowercase,
    digits,
    special,
    noRepeating,
    noSequential,
    noCommonWords,
    minStrength,
    excludes,
    includes,
    regex,
    transform,
    defaultValue,
    i18n,
  } = options ?? {}

  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? (required ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof PasswordMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.password.${key}`, params)
  }

  // Preprocessing function
  const preprocessFn = (val: unknown) => {
    if (val === "" || val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val)
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

    // Length checks
    if (val !== null && min !== undefined && val.length < min) {
      throw new z.ZodError([{ code: "custom", message: getMessage("min", { min }), path: [] }])
    }
    if (val !== null && max !== undefined && val.length > max) {
      throw new z.ZodError([{ code: "custom", message: getMessage("max", { max }), path: [] }])
    }

    // Character requirements
    if (val !== null && uppercase && !/[A-Z]/.test(val)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("uppercase"), path: [] }])
    }
    if (val !== null && lowercase && !/[a-z]/.test(val)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("lowercase"), path: [] }])
    }
    if (val !== null && digits && !/[0-9]/.test(val)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("digits"), path: [] }])
    }
    if (val !== null && special && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(val)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("special"), path: [] }])
    }

    // Advanced security checks
    if (val !== null && noRepeating && /(.)\1{2,}/.test(val)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("noRepeating"), path: [] }])
    }
    if (val !== null && noSequential && /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(val)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("noSequential"), path: [] }])
    }
    if (val !== null && noCommonWords && COMMON_PASSWORDS.some((common) => val.toLowerCase().includes(common.toLowerCase()))) {
      throw new z.ZodError([{ code: "custom", message: getMessage("noCommonWords"), path: [] }])
    }
    if (val !== null && minStrength) {
      const strength = calculatePasswordStrength(val)
      const strengthLevels = ["weak", "medium", "strong", "very-strong"]
      const currentLevel = strengthLevels.indexOf(strength)
      const requiredLevel = strengthLevels.indexOf(minStrength)
      if (currentLevel < requiredLevel) {
        throw new z.ZodError([{ code: "custom", message: getMessage("minStrength", { minStrength }), path: [] }])
      }
    }

    // Content checks
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

  return schema as unknown as PasswordSchema<IsRequired>
}
