import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

export type PassportType = "ordinary" | "diplomatic" | "official" | "travel" | "any"

export type TwPassportMessages = {
  required?: string
  invalid?: string
}

export type TwPassportOptions<IsRequired extends boolean = true> = {
  passportType?: PassportType
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Partial<Record<Locale, Partial<TwPassportMessages>>>
}

export type TwPassportSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

const PASSPORT_TYPE_DIGIT: Record<Exclude<PassportType, "any">, string> = {
  diplomatic: "0",
  official: "1",
  ordinary: "2",
  travel: "3",
}

const validateTaiwanPassport = (value: string): boolean => {
  if (!/^\d{9}$/.test(value)) {
    return false
  }

  const firstDigit = parseInt(value[0], 10)
  return firstDigit >= 0 && firstDigit <= 3
}

export function twPassport<IsRequired extends boolean = false>(required?: IsRequired, options?: Omit<TwPassportOptions<IsRequired>, "required">): TwPassportSchema<IsRequired> {
  const { passportType = "any", transform, defaultValue, i18n } = options ?? {}

  const isRequired = required ?? (false as IsRequired)

  const actualDefaultValue = defaultValue ?? (isRequired ? "" : null)

  const getMessage = (key: keyof TwPassportMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`taiwan.passport.${key}`, params)
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

    if (!validateTaiwanPassport(val)) {
      ctx.addIssue({ code: "custom", message: getMessage("invalid") })
      return
    }

    if (passportType !== "any") {
      const expectedDigit = PASSPORT_TYPE_DIGIT[passportType]
      if (val[0] !== expectedDigit) {
        ctx.addIssue({ code: "custom", message: getMessage("invalid") })
        return
      }
    }
  })

  return schema as unknown as TwPassportSchema<IsRequired>
}

export { validateTaiwanPassport }
