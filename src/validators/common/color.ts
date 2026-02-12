import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

export type ColorFormat = "hex" | "rgb" | "hsl" | "any"

export type ColorMessages = {
  required?: string
  invalid?: string
  notHex?: string
  notRgb?: string
  notHsl?: string
}

export type ColorOptions<IsRequired extends boolean = true> = {
  format?: ColorFormat | ColorFormat[]
  allowAlpha?: boolean
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Partial<Record<Locale, Partial<ColorMessages>>>
}

export type ColorSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

const HEX_RGB = /^#[0-9a-f]{3}$/i
const HEX_RRGGBB = /^#[0-9a-f]{6}$/i
const HEX_RRGGBBAA = /^#[0-9a-f]{8}$/i

function isValidByte(n: number): boolean {
  return Number.isInteger(n) && n >= 0 && n <= 255
}

function isValidAlpha(n: number): boolean {
  return n >= 0 && n <= 1
}

function isValidHue(n: number): boolean {
  return n >= 0 && n <= 360
}

function isValidPercentage(n: number): boolean {
  return n >= 0 && n <= 100
}

function validateHex(value: string, allowAlpha: boolean): boolean {
  if (HEX_RGB.test(value) || HEX_RRGGBB.test(value)) return true
  if (allowAlpha && HEX_RRGGBBAA.test(value)) return true
  return false
}

function validateRgb(value: string, allowAlpha: boolean): boolean {
  const rgbaMatch = value.match(/^rgba?\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*(?:,\s*(-?\d+(?:\.\d+)?))?\s*\)$/)
  if (!rgbaMatch) return false

  const r = Number(rgbaMatch[1])
  const g = Number(rgbaMatch[2])
  const b = Number(rgbaMatch[3])
  const a = rgbaMatch[4] !== undefined ? Number(rgbaMatch[4]) : undefined

  if (!isValidByte(r) || !isValidByte(g) || !isValidByte(b)) return false

  if (a !== undefined) {
    if (!allowAlpha) return false
    if (!isValidAlpha(a)) return false
  }

  // If function name is "rgba", alpha must be present
  if (value.startsWith("rgba(") && a === undefined) return false
  // If function name is "rgb", alpha must not be present
  if (value.startsWith("rgb(") && a !== undefined) return false

  return true
}

function validateHsl(value: string, allowAlpha: boolean): boolean {
  const hslaMatch = value.match(/^hsla?\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*(?:,\s*(-?\d+(?:\.\d+)?))?\s*\)$/)
  if (!hslaMatch) return false

  const h = Number(hslaMatch[1])
  const s = Number(hslaMatch[2])
  const l = Number(hslaMatch[3])
  const a = hslaMatch[4] !== undefined ? Number(hslaMatch[4]) : undefined

  if (!isValidHue(h) || !isValidPercentage(s) || !isValidPercentage(l)) return false

  if (a !== undefined) {
    if (!allowAlpha) return false
    if (!isValidAlpha(a)) return false
  }

  // If function name is "hsla", alpha must be present
  if (value.startsWith("hsla(") && a === undefined) return false
  // If function name is "hsl", alpha must not be present
  if (value.startsWith("hsl(") && a !== undefined) return false

  return true
}

function validateColor(value: string, formats: ColorFormat[], allowAlpha: boolean): { valid: boolean; failedFormat?: ColorFormat } {
  const hasAny = formats.includes("any")

  if (hasAny) {
    if (validateHex(value, allowAlpha)) return { valid: true }
    if (validateRgb(value, allowAlpha)) return { valid: true }
    if (validateHsl(value, allowAlpha)) return { valid: true }
    return { valid: false }
  }

  for (const format of formats) {
    if (format === "hex" && validateHex(value, allowAlpha)) return { valid: true }
    if (format === "rgb" && validateRgb(value, allowAlpha)) return { valid: true }
    if (format === "hsl" && validateHsl(value, allowAlpha)) return { valid: true }
  }

  if (formats.length === 1) {
    return { valid: false, failedFormat: formats[0] }
  }

  return { valid: false }
}

export function color<IsRequired extends boolean = false>(required?: IsRequired, options?: Omit<ColorOptions<IsRequired>, "required">): ColorSchema<IsRequired> {
  const { format = "any", allowAlpha = true, transform, defaultValue, i18n } = options ?? {}

  const isRequired = required ?? (false as IsRequired)

  const actualDefaultValue = defaultValue ?? (isRequired ? "" : null)

  const formats: ColorFormat[] = Array.isArray(format) ? format : [format]

  const getMessage = (key: keyof ColorMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.color.${key}`, params)
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

    const result = validateColor(val, formats, allowAlpha)

    if (!result.valid) {
      const formatMessageMap: Record<ColorFormat, keyof ColorMessages> = {
        hex: "notHex",
        rgb: "notRgb",
        hsl: "notHsl",
        any: "invalid",
      }

      const messageKey = result.failedFormat ? formatMessageMap[result.failedFormat] : "invalid"
      ctx.addIssue({ code: "custom", message: getMessage(messageKey) })
      return
    }
  })

  return schema as unknown as ColorSchema<IsRequired>
}

export { validateColor }
