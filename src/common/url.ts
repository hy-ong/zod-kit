import { z, ZodNullable, ZodString } from "zod"
import { t } from "../i18n"
import { TextSchema } from "./text"

export type UrlOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  label: string
  min?: number
  max?: number
  includes?: string
}

export type UrlSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

export function url<IsRequired extends boolean = true>(options?: UrlOptions<IsRequired>): UrlSchema<IsRequired> {
  const { required = true, label, min, max, includes } = options ?? {}

  const baseSchema = required
    ? z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? null : val),
        z.url({
          error: (issue) => {
            if (issue.code === "invalid_type") return t("common.url.required", { label })
            else if (issue.code === "invalid_format") return t("common.url.invalid", { label })
            return t("common.url.invalid", { label })
          },
        })
      )
    : z.preprocess((val) => (val === "" || val === null || val === undefined ? null : val), z.url({ message: t("common.url.invalid", { label }) }).nullable())

  const schema = baseSchema
    .refine((val) => (required ? val !== "" && val !== "null" && val !== "undefined" : true), { message: t("common.text.required", { label }) })
    .refine((val) => val === null || min === undefined || val.length >= min, { message: t("common.text.min", { label, min }) })
    .refine((val) => val === null || max === undefined || val.length <= max, { message: t("common.text.max", { label, max }) })
    .refine((val) => val === null || includes === undefined || val.includes(includes), { message: t("common.text.includes", { label, includes }) })

  return schema as unknown as TextSchema<IsRequired>
}
