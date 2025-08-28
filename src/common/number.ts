import { z, ZodNullable, ZodNumber } from "zod"
import { t } from "../i18n"
import { getLocale, type Locale } from "../config"

export type NumberMessages = {
  required?: string
  invalid?: string
  integer?: string
  float?: string
  min?: string
  max?: string
  positive?: string
  negative?: string
  nonNegative?: string
  nonPositive?: string
  multipleOf?: string
  finite?: string
  precision?: string
}

export type NumberOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  min?: number
  max?: number
  defaultValue?: IsRequired extends true ? number : number | null
  type?: 'integer' | 'float' | 'both'
  positive?: boolean
  negative?: boolean
  nonNegative?: boolean
  nonPositive?: boolean
  multipleOf?: number
  precision?: number
  finite?: boolean
  transform?: (value: number) => number
  parseCommas?: boolean // Parse "1,234" as 1234
  i18n?: Record<Locale, NumberMessages>
}

export type NumberSchema<IsRequired extends boolean> = IsRequired extends true ? ZodNumber : ZodNullable<ZodNumber>

export function number<IsRequired extends boolean = true>(options?: NumberOptions<IsRequired>): NumberSchema<IsRequired> {
  const { 
    required = true, 
    min, 
    max, 
    defaultValue,
    type = 'both',
    positive,
    negative, 
    nonNegative,
    nonPositive,
    multipleOf,
    precision,
    finite = true,
    transform,
    parseCommas = false,
    i18n
  } = options ?? {}
  
  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof NumberMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.number.${key}`, params)
  }
  
  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? null

  const schema = z
    .preprocess(
      (val) => {
        if (val === "" || val === undefined || val === null) {
          return actualDefaultValue
        }
        
        // Handle string input
        if (typeof val === "string") {
          let processedVal = val.trim()
          
          // Parse comma-separated numbers like "1,234.56"
          if (parseCommas) {
            processedVal = processedVal.replace(/,/g, '')
          }
          
          const parsed = Number(processedVal)
          
          // Return NaN as is so it can be caught in refine
          if (isNaN(parsed)) {
            return parsed
          }
          
          if (transform) {
            return transform(parsed)
          }
          
          return parsed
        }
        
        // Handle existing numbers (including Infinity)
        if (typeof val === 'number') {
          if (transform && Number.isFinite(val)) {
            return transform(val)
          }
          return val
        }
        
        return val
      },
      z.union([z.number(), z.null(), z.nan(), z.custom<number>((val) => val === Infinity || val === -Infinity)])
    )
    .refine((val) => {
      // Required check first
      if (required && val === null) {
        throw new z.ZodError([{ code: 'custom', message: getMessage("required"), path: [] }])
      }
      
      if (val === null) return true
      
      // Type validation for invalid inputs (NaN)
      if (typeof val === 'number' && isNaN(val)) {
        if (type === 'integer') {
          throw new z.ZodError([{ code: 'custom', message: getMessage("integer"), path: [] }])
        } else if (type === 'float') {
          throw new z.ZodError([{ code: 'custom', message: getMessage("float"), path: [] }])
        } else {
          throw new z.ZodError([{ code: 'custom', message: getMessage("invalid"), path: [] }])
        }
      }
      
      // Invalid number check for non-numbers
      if (typeof val !== 'number') {
        throw new z.ZodError([{ code: 'custom', message: getMessage("invalid"), path: [] }])
      }
      
      // Finite check
      if (finite && !Number.isFinite(val)) {
        throw new z.ZodError([{ code: 'custom', message: getMessage("finite"), path: [] }])
      }
      
      // Type validation for valid numbers
      if (type === 'integer' && !Number.isInteger(val)) {
        throw new z.ZodError([{ code: 'custom', message: getMessage("integer"), path: [] }])
      }
      if (type === 'float' && Number.isInteger(val)) {
        throw new z.ZodError([{ code: 'custom', message: getMessage("float"), path: [] }])
      }
      
      // Sign checks (more specific, should come first)
      if (positive && val <= 0) {
        throw new z.ZodError([{ code: 'custom', message: getMessage("positive"), path: [] }])
      }
      if (negative && val >= 0) {
        throw new z.ZodError([{ code: 'custom', message: getMessage("negative"), path: [] }])
      }
      if (nonNegative && val < 0) {
        throw new z.ZodError([{ code: 'custom', message: getMessage("nonNegative"), path: [] }])
      }
      if (nonPositive && val > 0) {
        throw new z.ZodError([{ code: 'custom', message: getMessage("nonPositive"), path: [] }])
      }
      
      // Range checks
      if (min !== undefined && val < min) {
        throw new z.ZodError([{ code: 'custom', message: getMessage("min", { min }), path: [] }])
      }
      if (max !== undefined && val > max) {
        throw new z.ZodError([{ code: 'custom', message: getMessage("max", { max }), path: [] }])
      }
      
      // Multiple of check
      if (multipleOf !== undefined && val % multipleOf !== 0) {
        throw new z.ZodError([{ code: 'custom', message: getMessage("multipleOf", { multipleOf }), path: [] }])
      }
      
      // Precision check
      if (precision !== undefined) {
        const decimalPlaces = (val.toString().split('.')[1] || '').length
        if (decimalPlaces > precision) {
          throw new z.ZodError([{ code: 'custom', message: getMessage("precision", { precision }), path: [] }])
        }
      }
      
      return true
    })

  return schema as unknown as NumberSchema<IsRequired>
}
