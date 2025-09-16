import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import isToday from "dayjs/plugin/isToday"
import weekday from "dayjs/plugin/weekday"

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.extend(customParseFormat)
dayjs.extend(isToday)
dayjs.extend(weekday)

export type DateMessages = {
  required?: string
  invalid?: string
  format?: string
  min?: string
  max?: string
  includes?: string
  excludes?: string
  past?: string
  future?: string
  today?: string
  notToday?: string
  weekday?: string
  notWeekday?: string
  weekend?: string
  notWeekend?: string
}

export type DateOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  min?: string
  max?: string
  format?: string
  includes?: string
  excludes?: string | string[]
  mustBePast?: boolean
  mustBeFuture?: boolean
  mustBeToday?: boolean
  mustNotBeToday?: boolean
  weekdaysOnly?: boolean
  weekendsOnly?: boolean
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Record<Locale, DateMessages>
}

export type DateSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

export function date<IsRequired extends boolean = true>(options?: DateOptions<IsRequired>): DateSchema<IsRequired> {
  const {
    required = true,
    min,
    max,
    format = "YYYY-MM-DD",
    includes,
    excludes,
    mustBePast,
    mustBeFuture,
    mustBeToday,
    mustNotBeToday,
    weekdaysOnly,
    weekendsOnly,
    transform,
    defaultValue = null,
    i18n,
  } = options ?? {}

  const actualDefaultValue = defaultValue ?? (required ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof DateMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.date.${key}`, params)
  }

  // Preprocessing function with transformations
  const preprocessFn = (val: unknown) => {
    if (val === "" || val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val).trim()

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

    // Format validation
    if (val !== null && !dayjs(val, format, true).isValid()) {
      throw new z.ZodError([{ code: "custom", message: getMessage("format", { format }), path: [] }])
    }

    const dateObj = dayjs(val, format)

    // Range checks
    if (val !== null && min !== undefined && !dateObj.isSameOrAfter(dayjs(min, format))) {
      throw new z.ZodError([{ code: "custom", message: getMessage("min", { min }), path: [] }])
    }
    if (val !== null && max !== undefined && !dateObj.isSameOrBefore(dayjs(max, format))) {
      throw new z.ZodError([{ code: "custom", message: getMessage("max", { max }), path: [] }])
    }

    // String content checks
    if (val !== null && includes !== undefined && !val.includes(includes)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("includes", { includes }), path: [] }])
    }
    if (val !== null && excludes !== undefined) {
      const excludeList = Array.isArray(excludes) ? excludes : [excludes]
      for (const exclude of excludeList) {
        if (val.includes(exclude)) {
          throw new z.ZodError([{ code: "custom", message: getMessage("excludes", { excludes: exclude }), path: [] }])
        }
      }
    }

    // Time-based validations
    const today = dayjs().startOf('day')
    const targetDate = dateObj.startOf('day')

    if (val !== null && mustBePast && !targetDate.isBefore(today)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("past"), path: [] }])
    }
    if (val !== null && mustBeFuture && !targetDate.isAfter(today)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("future"), path: [] }])
    }
    if (val !== null && mustBeToday && !targetDate.isSame(today)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("today"), path: [] }])
    }
    if (val !== null && mustNotBeToday && targetDate.isSame(today)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("notToday"), path: [] }])
    }

    // Weekday/weekend validations
    if (val !== null && weekdaysOnly && (dateObj.day() === 0 || dateObj.day() === 6)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("weekday"), path: [] }])
    }
    if (val !== null && weekendsOnly && dateObj.day() !== 0 && dateObj.day() !== 6) {
      throw new z.ZodError([{ code: "custom", message: getMessage("weekend"), path: [] }])
    }

    return true
  })

  return schema as unknown as DateSchema<IsRequired>
}
