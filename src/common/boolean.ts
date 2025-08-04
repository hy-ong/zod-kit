import { z, ZodBoolean, ZodNullable, ZodType } from "zod"
import { t } from "../i18n"

export type BooleanOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  label: string
  defaultValue?: IsRequired extends true ? boolean : boolean | null
  shouldBe?: boolean
}

export type BooleanSchema<IsRequired extends boolean> = IsRequired extends true ? ZodBoolean : ZodNullable<ZodBoolean>

export function boolean<IsRequired extends boolean = true>(options?: BooleanOptions<IsRequired>): BooleanSchema<IsRequired> {
  const { required = true, label, defaultValue = null, shouldBe } = options ?? {}

  let result: ZodType = z.preprocess(
    (val) => {
      if (val === "" || val === undefined || val === null) return defaultValue
      if (val === "true" || val === 1 || val === "1") return true
      if (val === "false" || val === 0 || val === "0") return false
      return val
    },
    z.union([z.literal(true), z.literal(false), z.literal(null)])
  )

  if (required && defaultValue === null) {
    result = result.refine((val) => val !== null, { message: t("common.boolean.required", { label }) })
  }

  if (shouldBe === true) {
    result = result.refine((val) => val === true, { message: t("common.boolean.shouldBe.true", { label }) })
  } else if (shouldBe === false) {
    result = result.refine((val) => val === false, { message: t("common.boolean.shouldBe.false", { label }) })
  }

  return result as IsRequired extends true ? ZodBoolean : ZodNullable<ZodBoolean>
}
