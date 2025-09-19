import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

export type IdMessages = {
  required?: string
  invalid?: string
  minLength?: string
  maxLength?: string
  numeric?: string
  uuid?: string
  objectId?: string
  nanoid?: string
  snowflake?: string
  cuid?: string
  ulid?: string
  shortid?: string
  customFormat?: string
  includes?: string
  excludes?: string
  startsWith?: string
  endsWith?: string
}

export type IdType =
  | "numeric" // 純數字 ID (1, 123, 999999)
  | "uuid" // UUID v4 格式
  | "objectId" // MongoDB ObjectId (24位16進制)
  | "nanoid" // Nano ID
  | "snowflake" // Twitter Snowflake (19位數字)
  | "cuid" // CUID 格式
  | "ulid" // ULID 格式
  | "shortid" // ShortId 格式
  | "auto" // 自動檢測格式

export type IdOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  type?: IdType
  minLength?: number
  maxLength?: number
  allowedTypes?: IdType[]
  customRegex?: RegExp
  includes?: string
  excludes?: string | string[]
  startsWith?: string
  endsWith?: string
  caseSensitive?: boolean
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Record<Locale, IdMessages>
}

export type IdSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

// ID 格式的正則表達式
const ID_PATTERNS = {
  numeric: /^\d+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  objectId: /^[0-9a-f]{24}$/i,
  nanoid: /^[A-Za-z0-9_-]{21}$/,
  snowflake: /^\d{19}$/,
  cuid: /^c[a-z0-9]{24}$/,
  ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
  shortid: /^[A-Za-z0-9_-]{7,14}$/,
} as const

// 檢測 ID 類型（按照特異性排序，避免誤判）
const detectIdType = (value: string): IdType | null => {
  // 按優先順序檢查（從最具體到最通用）
  const orderedTypes: Array<[IdType, RegExp]> = [
    ["uuid", ID_PATTERNS.uuid],
    ["objectId", ID_PATTERNS.objectId],
    ["snowflake", ID_PATTERNS.snowflake],
    ["cuid", ID_PATTERNS.cuid],
    ["ulid", ID_PATTERNS.ulid],
    ["nanoid", ID_PATTERNS.nanoid],
    ["numeric", ID_PATTERNS.numeric],
    ["shortid", ID_PATTERNS.shortid], // 放最後，因為最通用
  ]

  for (const [type, pattern] of orderedTypes) {
    if (pattern.test(value)) {
      return type
    }
  }
  return null
}

// 驗證特定 ID 類型
const validateIdType = (value: string, type: IdType): boolean => {
  if (type === "auto") {
    return detectIdType(value) !== null
  }
  const pattern = ID_PATTERNS[type as keyof typeof ID_PATTERNS]
  return pattern ? pattern.test(value) : false
}

export function id<IsRequired extends boolean = true>(options?: IdOptions<IsRequired>): IdSchema<IsRequired> {
  const {
    required = true,
    type = "auto",
    minLength,
    maxLength,
    allowedTypes,
    customRegex,
    includes,
    excludes,
    startsWith,
    endsWith,
    caseSensitive = true,
    transform,
    defaultValue,
    i18n,
  } = options ?? {}

  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? (required ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof IdMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.id.${key}`, params)
  }

  // Preprocessing function
  const preprocessFn = (val: unknown) => {
    if (val === "" || val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val)

    if (transform) {
      processed = transform(processed)
    }

    return processed
  }

  const baseSchema = required ? z.preprocess(preprocessFn, z.string()) : z.preprocess(preprocessFn, z.string().nullable())

  const schema = baseSchema
    .refine((val) => {
      if (val === null) return true

      // Required check
      if (required && (val === "" || val === "null" || val === "undefined")) {
        throw new z.ZodError([{ code: "custom", message: getMessage("required"), path: [] }])
      }

      // Create comparison value for case-insensitive checks
      const comparisonVal = !caseSensitive ? val.toLowerCase() : val

      // Length checks
      if (val !== null && minLength !== undefined && val.length < minLength) {
        throw new z.ZodError([{ code: "custom", message: getMessage("minLength", { minLength }), path: [] }])
      }
      if (val !== null && maxLength !== undefined && val.length > maxLength) {
        throw new z.ZodError([{ code: "custom", message: getMessage("maxLength", { maxLength }), path: [] }])
      }

      // Check if we have content-based validations that override format checking
      const hasContentValidations = customRegex !== undefined || startsWith !== undefined || endsWith !== undefined || includes !== undefined || excludes !== undefined

      // Custom regex validation (overrides ID format validation)
      if (val !== null && customRegex !== undefined) {
        if (!customRegex.test(val)) {
          throw new z.ZodError([{ code: "custom", message: getMessage("customFormat"), path: [] }])
        }
      } else if (val !== null && !hasContentValidations) {
        // ID type validation (only if no custom regex or content validations)
        let isValidId: boolean

        if (allowedTypes && allowedTypes.length > 0) {
          // Check if ID matches any of the allowed types
          isValidId = allowedTypes.some((allowedType) => validateIdType(val, allowedType))
          if (!isValidId) {
            const typeNames = allowedTypes.join(", ")
            throw new z.ZodError([{ code: "custom", message: getMessage("invalid") + ` (allowed types: ${typeNames})`, path: [] }])
          }
        } else if (type !== "auto") {
          // Validate specific type
          isValidId = validateIdType(val, type)
          if (!isValidId) {
            throw new z.ZodError([{ code: "custom", message: getMessage(type as keyof IdMessages) || getMessage("invalid"), path: [] }])
          }
        } else {
          // Auto-detection - must match at least one known pattern
          isValidId = detectIdType(val) !== null
          if (!isValidId) {
            throw new z.ZodError([{ code: "custom", message: getMessage("invalid"), path: [] }])
          }
        }
      } else if (val !== null && hasContentValidations && type !== "auto" && !customRegex) {
        // Still validate specific types even with content validations (but not auto)
        if (allowedTypes && allowedTypes.length > 0) {
          const isValidType = allowedTypes.some((allowedType) => validateIdType(val, allowedType))
          if (!isValidType) {
            const typeNames = allowedTypes.join(", ")
            throw new z.ZodError([{ code: "custom", message: getMessage("invalid") + ` (allowed types: ${typeNames})`, path: [] }])
          }
        } else {
          if (!validateIdType(val, type)) {
            throw new z.ZodError([{ code: "custom", message: getMessage(type as keyof IdMessages) || getMessage("invalid"), path: [] }])
          }
        }
      }

      // String content checks (using comparisonVal for case sensitivity)
      const searchStartsWith = !caseSensitive && startsWith ? startsWith.toLowerCase() : startsWith
      const searchEndsWith = !caseSensitive && endsWith ? endsWith.toLowerCase() : endsWith
      const searchIncludes = !caseSensitive && includes ? includes.toLowerCase() : includes

      if (val !== null && startsWith !== undefined && !comparisonVal.startsWith(searchStartsWith!)) {
        throw new z.ZodError([{ code: "custom", message: getMessage("startsWith", { startsWith }), path: [] }])
      }
      if (val !== null && endsWith !== undefined && !comparisonVal.endsWith(searchEndsWith!)) {
        throw new z.ZodError([{ code: "custom", message: getMessage("endsWith", { endsWith }), path: [] }])
      }
      if (val !== null && includes !== undefined && !comparisonVal.includes(searchIncludes!)) {
        throw new z.ZodError([{ code: "custom", message: getMessage("includes", { includes }), path: [] }])
      }
      if (val !== null && excludes !== undefined) {
        const excludeList = Array.isArray(excludes) ? excludes : [excludes]
        for (const exclude of excludeList) {
          const searchExclude = !caseSensitive ? exclude.toLowerCase() : exclude
          if (comparisonVal.includes(searchExclude)) {
            throw new z.ZodError([{ code: "custom", message: getMessage("excludes", { excludes: exclude }), path: [] }])
          }
        }
      }

      return true
    })
    .transform((val) => {
      if (val === null) return val

      // Handle case transformations
      const shouldPreserveCase = type === "uuid" || type === "objectId"

      if (!caseSensitive && !shouldPreserveCase) {
        return val.toLowerCase()
      }

      return val // preserve the original case for UUID/ObjectId or when case-sensitive
    })

  return schema as unknown as IdSchema<IsRequired>
}

// Export utility functions for external use
export { detectIdType, validateIdType, ID_PATTERNS }
