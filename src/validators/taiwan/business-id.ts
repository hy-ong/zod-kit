import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

export type BusinessIdMessages = {
  required?: string
  format?: string
  checksum?: string
  numeric?: string
}

export type BusinessIdOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Record<Locale, BusinessIdMessages>
}

export type BusinessIdSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

// Taiwan Business ID (統一編號) validation
const validateTaiwanBusinessId = (value: string): boolean => {
  // Must be exactly 8 digits
  if (!/^\d{8}$/.test(value)) {
    return false
  }

  const digits = value.split('').map(Number)

  // Coefficients for the first 7 digits
  const coefficients = [1, 2, 1, 2, 1, 2, 4]

  // Calculate weighted sum for first 7 digits
  let sum = 0
  for (let i = 0; i < 7; i++) {
    const product = digits[i] * coefficients[i]
    // Add individual digits of the product (split if >= 10)
    sum += Math.floor(product / 10) + (product % 10)
  }

  // Add the check digit (8th digit)
  sum += digits[7]

  // New rules (2023+): Valid if sum is divisible by 5
  if (sum % 5 === 0) {
    return true
  }

  // Fall back to old rules: Valid if sum is divisible by 10
  if (sum % 10 === 0) {
    return true
  }

  // Special case for old rules: if 7th digit is 7
  if (digits[6] === 7) {
    let altSum = 0
    for (let i = 0; i < 7; i++) {
      const product = digits[i] * coefficients[i]
      altSum += Math.floor(product / 10) + (product % 10)
    }
    // Add 1 and check digit
    altSum += 1 + digits[7]

    // Check both new and old rules
    if (altSum % 5 === 0 || altSum % 10 === 0) {
      return true
    }
  }

  return false
}

export function businessId<IsRequired extends boolean = true>(options?: BusinessIdOptions<IsRequired>): BusinessIdSchema<IsRequired> {
  const {
    required = true,
    transform,
    defaultValue,
    i18n
  } = options ?? {}

  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? (required ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof BusinessIdMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`taiwan.businessId.${key}`, params)
  }

  // Preprocessing function
  const preprocessFn = (val: unknown) => {
    if (val === "" || val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val).trim()

    // If after trimming we have an empty string and the field is optional, return null
    if (processed === "" && !required) {
      return null
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

    // Check if it's numeric
    if (!/^\d+$/.test(val)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("numeric"), path: [] }])
    }

    // Format validation (8 digits)
    if (val.length !== 8) {
      throw new z.ZodError([{ code: "custom", message: getMessage("format"), path: [] }])
    }

    // Taiwan Business ID checksum validation
    if (!validateTaiwanBusinessId(val)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("checksum"), path: [] }])
    }

    return true
  })

  return schema as unknown as BusinessIdSchema<IsRequired>
}

// Export utility function for external use
export { validateTaiwanBusinessId }