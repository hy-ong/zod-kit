import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

export type TwInvoiceMessages = {
  required?: string
  invalid?: string
}

export type TwInvoiceOptions<IsRequired extends boolean = true> = {
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Partial<Record<Locale, Partial<TwInvoiceMessages>>>
}

export type TwInvoiceSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

const INVOICE_PATTERN = /^[A-Z]{2}\d{8}$/

const validateTaiwanInvoice = (value: string): boolean => {
  const cleaned = value.replace(/-/g, "")
  return INVOICE_PATTERN.test(cleaned)
}

export function twInvoice<IsRequired extends boolean = false>(required?: IsRequired, options?: Omit<TwInvoiceOptions<IsRequired>, "required">): TwInvoiceSchema<IsRequired> {
  const { transform, defaultValue, i18n } = options ?? {}

  const isRequired = required ?? (false as IsRequired)

  const actualDefaultValue = defaultValue ?? (isRequired ? "" : null)

  const getMessage = (key: keyof TwInvoiceMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`taiwan.invoice.${key}`, params)
  }

  const preprocessFn = (val: unknown) => {
    if (val === "" || val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val).trim().toUpperCase().replace(/-/g, "")

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

    if (!validateTaiwanInvoice(val)) {
      ctx.addIssue({ code: "custom", message: getMessage("invalid") })
      return
    }
  })

  return schema as unknown as TwInvoiceSchema<IsRequired>
}

export { validateTaiwanInvoice }
