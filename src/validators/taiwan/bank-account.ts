import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

export const TAIWAN_BANK_CODES: Record<string, string> = {
  "004": "台灣銀行",
  "005": "土地銀行",
  "006": "合庫",
  "007": "第一銀行",
  "008": "華南",
  "009": "彰化",
  "011": "上海",
  "012": "台北富邦",
  "013": "國泰世華",
  "017": "兆豐",
  "021": "花旗",
  "048": "王道",
  "050": "台灣企銀",
  "052": "渣打",
  "053": "台中銀行",
  "054": "京城",
  "081": "滙豐",
  "103": "新光",
  "108": "陽信",
  "118": "板信",
  "147": "三信",
  "700": "中華郵政",
  "803": "聯邦",
  "805": "遠東",
  "806": "元大",
  "807": "永豐",
  "808": "玉山",
  "809": "凱基",
  "810": "星展",
  "812": "台新",
  "816": "安泰",
  "822": "中信",
}

export type TwBankAccountMessages = {
  required?: string
  invalid?: string
  invalidBankCode?: string
  invalidAccountNumber?: string
}

export type TwBankAccountOptions<IsRequired extends boolean = true> = {
  validateBankCode?: boolean
  bankCode?: string
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Partial<Record<Locale, Partial<TwBankAccountMessages>>>
}

export type TwBankAccountSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

const validateTaiwanBankAccount = (value: string, validateBankCode: boolean = true): boolean => {
  let bankCode: string | undefined
  let accountNumber: string

  if (value.includes("-")) {
    const parts = value.split("-")
    if (parts.length !== 2) return false
    bankCode = parts[0]
    accountNumber = parts[1]
  } else {
    accountNumber = value
  }

  // Validate bank code if present
  if (bankCode !== undefined) {
    if (!/^\d{3}$/.test(bankCode)) return false
    if (validateBankCode && !(bankCode in TAIWAN_BANK_CODES)) return false
  }

  // Validate account number: 10-16 digits
  if (!/^\d{10,16}$/.test(accountNumber)) return false

  return true
}

export function twBankAccount<IsRequired extends boolean = false>(required?: IsRequired, options?: Omit<TwBankAccountOptions<IsRequired>, "required">): TwBankAccountSchema<IsRequired> {
  const { validateBankCode = true, bankCode, transform, defaultValue, i18n } = options ?? {}

  const isRequired = required ?? (false as IsRequired)

  const actualDefaultValue = defaultValue ?? (isRequired ? "" : null)

  const getMessage = (key: keyof TwBankAccountMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`taiwan.bankAccount.${key}`, params)
  }

  const preprocessFn = (val: unknown) => {
    if (val === "" || val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val).trim().replace(/\s/g, "")

    if (processed === "" && !required) {
      return null
    }

    if (transform) {
      processed = transform(processed)
    }

    // If a bankCode option is set and the value has no hyphen, prepend bankCode
    if (bankCode && !processed.includes("-")) {
      processed = `${bankCode}-${processed}`
    }

    return processed
  }

  const baseSchema = isRequired ? z.preprocess(preprocessFn, z.string()) : z.preprocess(preprocessFn, z.string().nullable())

  const schema = baseSchema.superRefine((val, ctx) => {
    if (val === null) return

    // Required check
    if (isRequired && (val === "" || val === "null" || val === "undefined")) {
      ctx.addIssue({ code: "custom", message: getMessage("required") })
      return
    }

    if (val === null) return
    if (!isRequired && val === "") return

    // Parse and validate parts separately for specific error messages
    let parsedBankCode: string | undefined
    let accountNumber: string

    if (val.includes("-")) {
      const parts = val.split("-")
      if (parts.length !== 2) {
        ctx.addIssue({ code: "custom", message: getMessage("invalid") })
        return
      }
      parsedBankCode = parts[0]
      accountNumber = parts[1]
    } else {
      accountNumber = val
    }

    // Validate bank code if present
    if (parsedBankCode !== undefined) {
      if (!/^\d{3}$/.test(parsedBankCode)) {
        ctx.addIssue({ code: "custom", message: getMessage("invalidBankCode") })
        return
      }
      if (validateBankCode && !(parsedBankCode in TAIWAN_BANK_CODES)) {
        ctx.addIssue({ code: "custom", message: getMessage("invalidBankCode") })
        return
      }
    }

    // Validate account number: 10-16 digits
    if (!/^\d{10,16}$/.test(accountNumber)) {
      ctx.addIssue({ code: "custom", message: getMessage("invalidAccountNumber") })
      return
    }
  })

  return schema as unknown as TwBankAccountSchema<IsRequired>
}

export { validateTaiwanBankAccount }
