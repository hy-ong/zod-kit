import { z, ZodNullable, ZodNumber } from "zod"
import { t } from "../i18n"

export type IntegerOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  label: string
  min?: number
  max?: number
  defaultValue?: IsRequired extends true ? number : number | null
}

export type IntegerSchema<IsRequired extends boolean> = IsRequired extends true ? ZodNumber : ZodNullable<ZodNumber>

export function integer<IsRequired extends boolean = true>(options?: IntegerOptions<IsRequired>): IntegerSchema<IsRequired> {
  const { required = true, label, min, max, defaultValue } = options ?? {}

  const schema = z
    .preprocess(
      (val) => {
        if (val === "" || val === undefined || val === null) return defaultValue ?? null
        return typeof val === "string" ? Number(val) : val
      },
      z.union([
        z.number({
          error: (issue) => {
            if (issue.code === "invalid_type") return t("common.integer.integer", { label })
            return t("common.integer.required", { label })
          },
        }),
        z.null(),
      ])
    )
    .refine((val) => !required || val !== null, {
      message: t("common.integer.required", { label }),
    })
    .refine((val) => val === null || Number.isInteger(val), {
      message: t("common.integer.integer", { label }),
    })
    .refine((val) => val === null || min === undefined || val >= min, {
      message: t("common.integer.min", { label, min }),
    })
    .refine((val) => val === null || max === undefined || val <= max, {
      message: t("common.integer.max", { label, max }),
    })

  return schema as unknown as IntegerSchema<IsRequired>
}
