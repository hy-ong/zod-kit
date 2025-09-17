import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

export type NationalIdMessages = {
  required?: string
  invalid?: string
}

export type NationalIdType =
  | "citizen"           // 身分證字號 (國民身分證)
  | "resident"          // 居留證號 (外籍人士統一證號)
  | "both"              // 身分證/居留證皆可

export type NationalIdOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  type?: NationalIdType
  allowOldResident?: boolean
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Record<Locale, NationalIdMessages>
}

export type NationalIdSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

// 縣市代碼對應表
const CITY_CODES: Record<string, number> = {
  'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17,
  'I': 34, 'J': 18, 'K': 19, 'L': 20, 'M': 21, 'N': 22, 'O': 35, 'P': 23,
  'Q': 24, 'R': 25, 'S': 26, 'T': 27, 'U': 28, 'V': 29, 'W': 32, 'X': 30,
  'Y': 31, 'Z': 33
}

// 驗證國民身分證字號
const validateCitizenId = (value: string): boolean => {
  // 格式檢查：1個英文字母 + 9個數字
  if (!/^[A-Z][1-2]\d{8}$/.test(value)) {
    return false
  }

  const letter = value[0]
  const digits = value.slice(1).split('').map(Number)

  // 獲取縣市代碼
  const cityCode = CITY_CODES[letter]
  if (!cityCode) return false

  // 計算校驗碼
  const cityDigits = [Math.floor(cityCode / 10), cityCode % 10]
  const coefficients = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1]

  let sum = cityDigits[0] * coefficients[0] + cityDigits[1] * coefficients[1]
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * coefficients[i + 2]
  }

  const checksum = (10 - (sum % 10)) % 10
  return checksum === digits[8]
}

// 驗證舊式居留證號
const validateOldResidentId = (value: string): boolean => {
  // 格式檢查：1個英文字母 + [AB或CD] + 8個數字
  if (!/^[A-Z][ABCD]\d{8}$/.test(value)) {
    return false
  }

  const letter = value[0]
  const genderCode = value[1]
  const digits = value.slice(2).split('').map(Number)

  // 獲取縣市代碼
  const cityCode = CITY_CODES[letter]
  if (!cityCode) return false

  // 性別代碼轉換
  const genderValue = genderCode === 'A' || genderCode === 'C' ? 1 : 0

  // 計算校驗碼
  const cityDigits = [Math.floor(cityCode / 10), cityCode % 10]
  const coefficients = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1]

  let sum = cityDigits[0] * coefficients[0] + cityDigits[1] * coefficients[1] + genderValue * coefficients[2]
  for (let i = 0; i < 7; i++) {
    sum += digits[i] * coefficients[i + 3]
  }

  const checksum = (10 - (sum % 10)) % 10
  return checksum === digits[7]
}

// 驗證新式居留證號
const validateNewResidentId = (value: string): boolean => {
  // 格式檢查：1個英文字母 + [89] + 1個數字[0-9] + 7個數字
  if (!/^[A-Z][89]\d{8}$/.test(value)) {
    return false
  }

  const letter = value[0]
  const digits = value.slice(1).split('').map(Number)

  // 獲取縣市代碼
  const cityCode = CITY_CODES[letter]
  if (!cityCode) return false

  // 計算校驗碼 (與身分證字號相同邏輯)
  const cityDigits = [Math.floor(cityCode / 10), cityCode % 10]
  const coefficients = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1]

  let sum = cityDigits[0] * coefficients[0] + cityDigits[1] * coefficients[1]
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * coefficients[i + 2]
  }

  const checksum = (10 - (sum % 10)) % 10
  return checksum === digits[8]
}

// 主要驗證函數
const validateTaiwanNationalId = (value: string, type: NationalIdType = "both", allowOldResident: boolean = true): boolean => {
  if (!/^[A-Z].{9}$/.test(value)) {
    return false
  }

  switch (type) {
    case "citizen":
      return validateCitizenId(value)
    case "resident":
      return (allowOldResident ? validateOldResidentId(value) : false) || validateNewResidentId(value)
    case "both":
      return validateCitizenId(value) || (allowOldResident ? validateOldResidentId(value) : false) || validateNewResidentId(value)
    default:
      return false
  }
}

export function nationalId<IsRequired extends boolean = true>(options?: NationalIdOptions<IsRequired>): NationalIdSchema<IsRequired> {
  const {
    required = true,
    type = "both",
    allowOldResident = true,
    transform,
    defaultValue,
    i18n
  } = options ?? {}

  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? (required ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof NationalIdMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`taiwan.nationalId.${key}`, params)
  }

  // Preprocessing function
  const preprocessFn = (val: unknown) => {
    if (val === "" || val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val).trim().toUpperCase()

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

    // Taiwan National ID validation
    if (!validateTaiwanNationalId(val, type, allowOldResident)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("invalid"), path: [] }])
    }

    return true
  })

  return schema as unknown as NationalIdSchema<IsRequired>
}

// Export utility functions for external use
export { validateTaiwanNationalId, validateCitizenId, validateOldResidentId, validateNewResidentId }