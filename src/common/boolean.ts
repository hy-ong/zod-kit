import { z, ZodBoolean, ZodNullable, ZodType } from "zod"
import { t } from "../i18n"
import { getLocale, type Locale } from "../config"

export type BooleanMessages = {
  required?: string
  shouldBeTrue?: string
  shouldBeFalse?: string
  invalid?: string
}

export type BooleanOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  defaultValue?: IsRequired extends true ? boolean : boolean | null
  shouldBe?: boolean
  truthyValues?: unknown[]
  falsyValues?: unknown[]
  strict?: boolean
  transform?: (value: boolean) => boolean
  i18n?: Record<Locale, BooleanMessages>
}

export type BooleanSchema<IsRequired extends boolean> = IsRequired extends true ? ZodBoolean : ZodNullable<ZodBoolean>

export function boolean<IsRequired extends boolean = true>(options?: BooleanOptions<IsRequired>): BooleanSchema<IsRequired> {
  const { 
    required = true, 
    defaultValue = null, 
    shouldBe, 
    truthyValues = [true, "true", 1, "1", "yes", "on"],
    falsyValues = [false, "false", 0, "0", "no", "off"],
    strict = false,
    transform,
    i18n 
  } = options ?? {}
  
  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof BooleanMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.boolean.${key}`, params)
  }

  let result: ZodType = z.preprocess(
    (val) => {
      if (val === "" || val === undefined || val === null) return defaultValue
      
      if (strict && typeof val !== 'boolean' && val !== null) {
        return val // Let it fail in validation
      }
      
      // Check truthy values
      if (truthyValues.includes(val)) {
        let processed = true
        if (transform) processed = transform(processed)
        return processed
      }
      
      // Check falsy values
      if (falsyValues.includes(val)) {
        let processed = false
        if (transform) processed = transform(processed)
        return processed
      }
      
      return val
    },
    z.union([z.literal(true), z.literal(false), z.literal(null)])
  )

  if (required && defaultValue === null) {
    result = result.refine((val) => val !== null, { message: getMessage("required") })
  }

  if (shouldBe === true) {
    result = result.refine((val) => val === true, { message: getMessage("shouldBeTrue") })
  } else if (shouldBe === false) {
    result = result.refine((val) => val === false, { message: getMessage("shouldBeFalse") })
  }
  
  if (strict) {
    result = result.refine((val) => {
      return val === null || typeof val === 'boolean'
    }, { message: getMessage("invalid") })
  }

  return result as IsRequired extends true ? ZodBoolean : ZodNullable<ZodBoolean>
}
