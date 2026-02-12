import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

export type PlateType = "car" | "motorcycle" | "any"

export type TwLicensePlateMessages = {
  required?: string
  invalid?: string
}

export type TwLicensePlateOptions<IsRequired extends boolean = true> = {
  plateType?: PlateType
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Partial<Record<Locale, Partial<TwLicensePlateMessages>>>
}

export type TwLicensePlateSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

const CAR_PATTERNS = [
  /^[A-Z]{3}\d{4}$/, // ABC-1234 (new)
  /^\d{4}[A-Z]{2}$/, // 1234-AB (new/legacy)
  /^[A-Z]{2}\d{4}$/, // AB-1234 (legacy)
  /^[A-Z]\d{5}$/, // A1-2345 -> A12345 (legacy mixed)
]

const MOTORCYCLE_PATTERNS = [
  /^[A-Z]{3}\d{4}$/, // ABC-1234
  /^\d{3}[A-Z]{3}$/, // 123-ABC
  /^[A-Z]{2}\d{4}$/, // AB-1234 (legacy)
  /^\d{4}[A-Z]{2}$/, // 1234-AB (legacy)
]

export const validateTaiwanLicensePlate = (value: string, plateType: PlateType = "any"): boolean => {
  const patterns: RegExp[] = []

  if (plateType === "car" || plateType === "any") {
    patterns.push(...CAR_PATTERNS)
  }

  if (plateType === "motorcycle" || plateType === "any") {
    for (const pattern of MOTORCYCLE_PATTERNS) {
      if (!patterns.some((p) => p.source === pattern.source)) {
        patterns.push(pattern)
      }
    }
  }

  return patterns.some((pattern) => pattern.test(value))
}

export function twLicensePlate<IsRequired extends boolean = false>(required?: IsRequired, options?: Omit<TwLicensePlateOptions<IsRequired>, "required">): TwLicensePlateSchema<IsRequired> {
  const { plateType = "any", transform, defaultValue, i18n } = options ?? {}

  const isRequired = required ?? (false as IsRequired)

  const actualDefaultValue = defaultValue ?? (isRequired ? "" : null)

  const getMessage = (key: keyof TwLicensePlateMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`taiwan.licensePlate.${key}`, params)
  }

  const preprocessFn = (val: unknown) => {
    if (val === "" || val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val).trim().toUpperCase().replace(/[-\s]/g, "")

    if (processed === "" && !required) {
      return null
    }

    if (transform) {
      processed = transform(processed)
    }

    return processed
  }

  const baseSchema = isRequired ? z.preprocess(preprocessFn, z.string()) : z.preprocess(preprocessFn, z.string().nullable())

  const schema = baseSchema.superRefine((val, ctx) => {
    if (val === null) return

    if (isRequired && (val === "" || val === "null" || val === "undefined")) {
      ctx.addIssue({ code: "custom", message: getMessage("required") })
      return
    }

    if (val === null) return
    if (!isRequired && val === "") return

    if (!validateTaiwanLicensePlate(val, plateType)) {
      ctx.addIssue({ code: "custom", message: getMessage("invalid") })
      return
    }
  })

  return schema as unknown as TwLicensePlateSchema<IsRequired>
}
