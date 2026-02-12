import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

export type CreditCardType = "visa" | "mastercard" | "amex" | "jcb" | "discover" | "unionpay" | "any"

export type CreditCardMessages = {
  required?: string
  invalid?: string
  notInWhitelist?: string
}

export type CreditCardOptions<IsRequired extends boolean = true> = {
  cardType?: CreditCardType | CreditCardType[]
  whitelist?: string[]
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Partial<Record<Locale, Partial<CreditCardMessages>>>
}

export type CreditCardSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

export function detectCardType(value: string): CreditCardType {
  const digits = value.replace(/[\s-]/g, "")

  if (/^4/.test(digits)) return "visa"
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "mastercard"
  if (/^3[47]/.test(digits)) return "amex"
  if (/^35/.test(digits)) return "jcb"
  if (/^6011/.test(digits) || /^65/.test(digits) || /^64[4-9]/.test(digits)) return "discover"
  if (/^62/.test(digits)) return "unionpay"

  return "any"
}

export function validateCreditCard(value: string): boolean {
  const digits = value.replace(/[\s-]/g, "")

  if (!/^\d{13,19}$/.test(digits)) return false

  let sum = 0
  let alternate = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10)

    if (alternate) {
      n *= 2
      if (n > 9) n -= 9
    }

    sum += n
    alternate = !alternate
  }

  return sum % 10 === 0
}

export function creditCard<IsRequired extends boolean = false>(required?: IsRequired, options?: Omit<CreditCardOptions<IsRequired>, "required">): CreditCardSchema<IsRequired> {
  const { cardType, whitelist, transform, defaultValue, i18n } = options ?? {}

  const isRequired = required ?? (false as IsRequired)

  const actualDefaultValue = defaultValue ?? (isRequired ? "" : null)

  const getMessage = (key: keyof CreditCardMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.creditCard.${key}`, params)
  }

  const preprocessFn = (val: unknown) => {
    if (val === "" || val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val).trim().replace(/[\s-]/g, "")

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

    if (!validateCreditCard(val)) {
      ctx.addIssue({ code: "custom", message: getMessage("invalid") })
      return
    }

    if (cardType) {
      const allowedTypes = Array.isArray(cardType) ? cardType : [cardType]
      if (!allowedTypes.includes("any")) {
        const detected = detectCardType(val)
        if (!allowedTypes.includes(detected)) {
          ctx.addIssue({ code: "custom", message: getMessage("invalid") })
          return
        }
      }
    }

    if (whitelist && whitelist.length > 0) {
      const normalized = whitelist.map((w) => w.replace(/[\s-]/g, ""))
      if (!normalized.includes(val)) {
        ctx.addIssue({ code: "custom", message: getMessage("notInWhitelist") })
        return
      }
    }
  })

  return schema as unknown as CreditCardSchema<IsRequired>
}
