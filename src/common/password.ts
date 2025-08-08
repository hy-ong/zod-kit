import { z, ZodNullable, ZodString } from "zod"
import { t } from "../i18n"

export type PasswordOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  min?: number
  max?: number
  uppercase?: boolean
  lowercase?: boolean
  digits?: boolean
  special?: boolean
}

export type PasswordSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

export function password<IsRequired extends boolean = true>(options?: PasswordOptions<IsRequired>): PasswordSchema<IsRequired> {
  const { required = true, min, max, uppercase, lowercase, digits, special } = options ?? {}

  const baseSchema = required
    ? z.preprocess((val) => (val === "" || val === null || val === undefined ? null : val), z.coerce.string().trim())
    : z.preprocess((val) => (val === "" || val === null || val === undefined ? null : val), z.coerce.string().trim().nullable())

  const schema = baseSchema
    .refine((val) => (required ? val !== "" && val !== "null" && val !== "undefined" : true), { message: t("common.password.required") })
    .refine((val) => val === null || min === undefined || val.length >= min, { message: t("common.password.min", { min }) })
    .refine((val) => val === null || max === undefined || val.length <= max, { message: t("common.password.max", { max }) })
    .refine((val) => val === null || !uppercase || /[A-Z]/.test(val), { message: t("common.password.uppercase") })
    .refine((val) => val === null || !lowercase || /[a-z]/.test(val), { message: t("common.password.lowercase") })
    .refine((val) => val === null || !special || /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(val), { message: t("common.password.special") })
    .refine((val) => val === null || !digits || /[0-9]/.test(val), { message: t("common.password.digits") })

  return schema as unknown as PasswordSchema<IsRequired>
}
