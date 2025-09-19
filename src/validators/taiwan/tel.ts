import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

export type TelMessages = {
  required?: string
  invalid?: string
  notInWhitelist?: string
}

export type TelOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  whitelist?: string[]
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Record<Locale, TelMessages>
}

export type TelSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

// Taiwan landline telephone validation (Official 2024 rules)
const validateTaiwanTel = (value: string): boolean => {
  // Official Taiwan landline formats according to telecom numbering plan:
  // 02: Taipei, New Taipei, Keelung - 8 digits (2&3&5~8+7D)
  // 03: Taoyuan, Hsinchu, Yilan, Hualien - 7 digits
  // 037: Miaoli - 6 digits (2~9+5D)
  // 04: Taichung, Changhua - 7 digits
  // 049: Nantou - 7 digits (2~9+6D)
  // 05: Yunlin, Chiayi - 7 digits
  // 06: Tainan - 7 digits
  // 07: Kaohsiung - 7 digits (2~9+6D)
  // 08: Pingtung - 7 digits (4&7&8+6D)
  // 082: Kinmen - 6 digits (2~5&7~9+5D)
  // 0826: Wuqiu - 5 digits (6+4D)
  // 0836: Matsu - 5 digits (2~9+4D)
  // 089: Taitung - 6 digits (2~9+5D)

  // Remove common separators for validation
  const cleanValue = value.replace(/[-\s]/g, "")

  // Basic format: starts with 0, then area code, then number
  if (!/^0\d{7,10}$/.test(cleanValue)) {
    return false
  }

  // Check 4-digit area codes first
  const areaCode4 = cleanValue.substring(0, 4)
  if (areaCode4 === "0826") {
    // Wuqiu: 0826 + 5 digits (6+4D), total 9 digits
    return cleanValue.length === 9 && /^0826[6]\d{4}$/.test(cleanValue)
  }
  if (areaCode4 === "0836") {
    // Matsu: 0836 + 5 digits (2~9+4D), total 9 digits
    return cleanValue.length === 9 && /^0836[2-9]\d{4}$/.test(cleanValue)
  }

  // Check 3-digit area codes
  const areaCode3 = cleanValue.substring(0, 3)
  if (areaCode3 === "037") {
    // Miaoli: 037 + 6 digits (2~9+5D), total 9 digits
    return cleanValue.length === 9 && /^037[2-9]\d{5}$/.test(cleanValue)
  }
  if (areaCode3 === "049") {
    // Nantou: 049 + 7 digits (2~9+6D), total 10 digits
    return cleanValue.length === 10 && /^049[2-9]\d{6}$/.test(cleanValue)
  }
  if (areaCode3 === "082") {
    // Kinmen: 082 + 6 digits (2~5&7~9+5D), total 9 digits
    return cleanValue.length === 9 && /^082[2-57-9]\d{5}$/.test(cleanValue)
  }
  if (areaCode3 === "089") {
    // Taitung: 089 + 6 digits (2~9+5D), total 9 digits
    return cleanValue.length === 9 && /^089[2-9]\d{5}$/.test(cleanValue)
  }

  // Check 2-digit area codes
  const areaCode2 = cleanValue.substring(0, 2)

  if (areaCode2 === "02") {
    // Taipei, New Taipei, Keelung: 02 + 8 digits (2&3&5~8+7D), total 10 digits
    return cleanValue.length === 10 && /^02[235-8]\d{7}$/.test(cleanValue)
  }
  if (["03", "04", "05", "06"].includes(areaCode2)) {
    // Taoyuan/Hsinchu/Yilan/Hualien (03), Taichung/Changhua (04),
    // Yunlin/Chiayi (05), Tainan (06): 7 digits, total 9 digits
    return cleanValue.length === 9
  }
  if (areaCode2 === "07") {
    // Kaohsiung: 07 + 7 digits (2~9+6D), total 9 digits
    return cleanValue.length === 9 && /^07[2-9]\d{6}$/.test(cleanValue)
  }
  if (areaCode2 === "08") {
    // Pingtung: 08 + 7 digits (4&7&8+6D), total 9 digits
    return cleanValue.length === 9 && /^08[478]\d{6}$/.test(cleanValue)
  }

  return false
}

export function tel<IsRequired extends boolean = true>(options?: TelOptions<IsRequired>): TelSchema<IsRequired> {
  const { required = true, whitelist, transform, defaultValue, i18n } = options ?? {}

  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? (required ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof TelMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`taiwan.tel.${key}`, params)
  }

  // Preprocessing function
  const preprocessFn = (val: unknown) => {
    if (val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val).trim()

    // If after trimming we have an empty string
    if (processed === "") {
      // If empty string is in allowlist, return it as is
      if (whitelist && whitelist.includes("")) {
        return ""
      }
      // If the field is optional and empty string not in allowlist, return default value
      if (!required) {
        return actualDefaultValue
      }
      // If a field is required, return the default value (will be validated later)
      return actualDefaultValue
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

    // Allowlist check (if an allowlist is provided, only allow values in the allowlist)
    if (whitelist && whitelist.length > 0) {
      if (whitelist.includes(val)) {
        return true
      }
      // If not in the allowlist, reject regardless of format
      throw new z.ZodError([{ code: "custom", message: getMessage("notInWhitelist"), path: [] }])
    }

    // Taiwan telephone format validation (only if no allowlist or allowlist is empty)
    if (!validateTaiwanTel(val)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("invalid"), path: [] }])
    }

    return true
  })

  return schema as unknown as TelSchema<IsRequired>
}

// Export utility function for external use
export { validateTaiwanTel }
