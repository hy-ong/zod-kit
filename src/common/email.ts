import { z, ZodNullable, ZodString } from "zod"
import { t } from "../i18n"
import { TextSchema } from "./text"

export type EmailOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  label: string
  domain?: string
  min?: number
  max?: number
  includes?: string
}

export type EmailSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

export function email<IsRequired extends boolean = true>(options?: EmailOptions<IsRequired>): EmailSchema<IsRequired> {
  const { required = true, label, domain, min, max, includes } = options ?? {}

  const baseSchema = required
    ? z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? null : val),
        z.email({
          error: (issue) => {
            if (issue.code === "invalid_type") return t("common.email.required", { label })
            else if (issue.code === "invalid_format") return t("common.email.invalid", { label })
            return t("common.email.invalid", { label })
          },
        })
      )
    : z.preprocess((val) => (val === "" || val === null || val === undefined ? null : val), z.email({ message: t("common.email.invalid", { label }) }).nullable())

  const schema = baseSchema
    .refine((val) => (required ? val !== "" && val !== "null" && val !== "undefined" : true), { message: t("common.text.required", { label }) })
    .refine((val) => val === null || min === undefined || val.length >= min, { message: t("common.text.min", { label, min }) })
    .refine((val) => val === null || max === undefined || val.length <= max, { message: t("common.text.max", { label, max }) })
    .refine((val) => val === null || includes === undefined || val.includes(includes), { message: t("common.text.includes", { label, includes }) })
    .refine(
      (val) => {
        if (val === null || domain === undefined) return true
        return val.split("@")[1]?.toLowerCase() === domain.toLowerCase()
      },
      { message: t("common.email.domain", { label, domain }) }
    )
  return schema as unknown as TextSchema<IsRequired>
}
