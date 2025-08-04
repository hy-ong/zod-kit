import { z, ZodNullable, ZodString } from "zod"
import { t } from "../i18n"

export type TextOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  label: string
  min?: number
  max?: number
  startsWith?: string
  endsWith?: string
  includes?: string
  regex?: RegExp
  defaultValue?: IsRequired extends true ? string : string | null
}

export type TextSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

export function text<IsRequired extends boolean = true>(options?: TextOptions<IsRequired>): TextSchema<IsRequired> {
  const { required = true, label, min, max, startsWith, endsWith, includes, regex, defaultValue = null } = options ?? {}

  const baseSchema = required
    ? z.preprocess((val) => (val === "" || val === null || val === undefined ? defaultValue : val), z.coerce.string().trim())
    : z.preprocess((val) => (val === "" || val === null || val === undefined ? defaultValue : val), z.coerce.string().trim().nullable())

  const schema = baseSchema
    .refine((val) => (required ? val !== "" && val !== "null" && val !== "undefined" : true), { message: t("common.text.required", { label }) })
    .refine((val) => val === null || min === undefined || val.length >= min, { message: t("common.text.min", { label, min }) })
    .refine((val) => val === null || max === undefined || val.length <= max, { message: t("common.text.max", { label, max }) })
    .refine((val) => val === null || startsWith === undefined || val.startsWith(startsWith), { message: t("common.text.startsWith", { label, startsWith }) })
    .refine((val) => val === null || endsWith === undefined || val.endsWith(endsWith), { message: t("common.text.endsWith", { label, endsWith }) })
    .refine((val) => val === null || includes === undefined || val.includes(includes), { message: t("common.text.includes", { label, includes }) })
    .refine((val) => val === null || regex === undefined || regex.test(val), { message: t("common.text.invalid", { label, regex }) })

  return schema as unknown as TextSchema<IsRequired>
}
