import { z, ZodNullable, ZodString } from "zod"
import { t } from "../i18n"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
dayjs.extend(customParseFormat)

export type DateOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  label: string
  min?: number
  max?: number
  format?: string
  includes?: string
  defaultValue?: IsRequired extends true ? string : string | null
}

export type DateSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

export function date<IsRequired extends boolean = true>(options?: DateOptions<IsRequired>): DateSchema<IsRequired> {
  const { required = true, label, min, max, format = "YYYY-MM-DD", includes, defaultValue = null } = options ?? {}

  const baseSchema = required
    ? z.preprocess((val) => (val === "" || val === null || val === undefined ? defaultValue : val), z.coerce.string().trim())
    : z.preprocess((val) => (val === "" || val === null || val === undefined ? defaultValue : val), z.coerce.string().trim().nullable())

  const schema = baseSchema
    .refine(
      (val) => {
        if (!val) return !required
        return dayjs(val, format, true).isValid()
      },
      { message: t("common.date.format", { label, format }) }
    )
    .refine((val) => val === null || min === undefined || dayjs(val, format).isSameOrAfter(dayjs(min, format)), { message: t("common.date.min", { label, min }) })
    .refine((val) => val === null || max === undefined || dayjs(val, format).isSameOrBefore(dayjs(max, format)), { message: t("common.date.max", { label, max }) })
    .refine((val) => val === null || includes === undefined || val.includes(includes), { message: t("common.date.includes", { label, includes }) })

  return schema as unknown as DateSchema<IsRequired>
}
