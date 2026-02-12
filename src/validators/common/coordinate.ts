import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

export type CoordinateType = "latitude" | "longitude" | "pair"

export type CoordinateMessages = {
  required?: string
  invalid?: string
  invalidLatitude?: string
  invalidLongitude?: string
}

export type CoordinateOptions<IsRequired extends boolean = true> = {
  type?: CoordinateType
  precision?: number
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Partial<Record<Locale, Partial<CoordinateMessages>>>
}

export type CoordinateSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

export function validateLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90
}

export function validateLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180
}

function validatePrecision(value: number, precision: number): boolean {
  const decimalPart = value.toString().split(".")[1]
  if (!decimalPart) return true
  return decimalPart.length <= precision
}

export function coordinate<IsRequired extends boolean = false>(
  required?: IsRequired,
  options?: Omit<CoordinateOptions<IsRequired>, "required">,
): CoordinateSchema<IsRequired> {
  const { type = "pair", precision, transform, defaultValue, i18n } = options ?? {}

  const isRequired = required ?? (false as IsRequired)

  const actualDefaultValue = defaultValue ?? (isRequired ? "" : null)

  const getMessage = (key: keyof CoordinateMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.coordinate.${key}`, params)
  }

  const preprocessFn = (val: unknown) => {
    if (val === "" || val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val).trim()

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

    if (!isRequired && val === "") return

    if (type === "pair") {
      const parts = val.split(",")
      if (parts.length !== 2) {
        ctx.addIssue({ code: "custom", message: getMessage("invalid") })
        return
      }

      const lat = Number(parts[0].trim())
      const lng = Number(parts[1].trim())

      if (isNaN(lat) || isNaN(lng)) {
        ctx.addIssue({ code: "custom", message: getMessage("invalid") })
        return
      }

      if (!validateLatitude(lat)) {
        ctx.addIssue({ code: "custom", message: getMessage("invalidLatitude") })
        return
      }

      if (!validateLongitude(lng)) {
        ctx.addIssue({ code: "custom", message: getMessage("invalidLongitude") })
        return
      }

      if (precision !== undefined) {
        if (!validatePrecision(lat, precision) || !validatePrecision(lng, precision)) {
          ctx.addIssue({ code: "custom", message: getMessage("invalid") })
          return
        }
      }
    } else if (type === "latitude") {
      const num = Number(val)

      if (isNaN(num)) {
        ctx.addIssue({ code: "custom", message: getMessage("invalidLatitude") })
        return
      }

      if (!validateLatitude(num)) {
        ctx.addIssue({ code: "custom", message: getMessage("invalidLatitude") })
        return
      }

      if (precision !== undefined && !validatePrecision(num, precision)) {
        ctx.addIssue({ code: "custom", message: getMessage("invalid") })
        return
      }
    } else if (type === "longitude") {
      const num = Number(val)

      if (isNaN(num)) {
        ctx.addIssue({ code: "custom", message: getMessage("invalidLongitude") })
        return
      }

      if (!validateLongitude(num)) {
        ctx.addIssue({ code: "custom", message: getMessage("invalidLongitude") })
        return
      }

      if (precision !== undefined && !validatePrecision(num, precision)) {
        ctx.addIssue({ code: "custom", message: getMessage("invalid") })
        return
      }
    }
  })

  return schema as unknown as CoordinateSchema<IsRequired>
}
