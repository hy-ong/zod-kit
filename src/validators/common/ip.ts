import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

export type IpVersion = "v4" | "v6" | "any"

export type IpMessages = {
  required?: string
  invalid?: string
  notIPv4?: string
  notIPv6?: string
  notInWhitelist?: string
}

export type IpOptions<IsRequired extends boolean = true> = {
  version?: IpVersion
  allowCIDR?: boolean
  whitelist?: string[]
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Partial<Record<Locale, Partial<IpMessages>>>
}

export type IpSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

export function validateIPv4(value: string): boolean {
  const parts = value.split(".")
  if (parts.length !== 4) return false

  for (const part of parts) {
    if (part === "") return false
    // No leading zeros except for the single digit "0"
    if (part.length > 1 && part.startsWith("0")) return false
    const num = Number(part)
    if (!Number.isInteger(num) || num < 0 || num > 255) return false
  }

  return true
}

export function validateIPv6(value: string): boolean {
  // Handle mixed IPv6/IPv4 (e.g., ::ffff:192.0.2.1)
  const lastColon = value.lastIndexOf(":")
  if (lastColon !== -1) {
    const afterLastColon = value.substring(lastColon + 1)
    if (afterLastColon.includes(".")) {
      // Mixed form: validate the IPv4 portion
      if (!validateIPv4(afterLastColon)) return false

      // Validate the IPv6 prefix portion (everything before the IPv4 part)
      const ipv6Prefix = value.substring(0, lastColon)
      // The prefix should behave like an IPv6 with fewer groups (max 6 groups since IPv4 occupies 2)
      return validateIPv6Groups(ipv6Prefix, 6)
    }
  }

  return validateIPv6Groups(value, 8)
}

function validateIPv6Groups(value: string, maxGroups: number): boolean {
  // Handle :: compression
  if (value.includes("::")) {
    // Only one :: is allowed
    const doubleColonCount = value.split("::").length - 1
    if (doubleColonCount > 1) return false

    const [left, right] = value.split("::")
    const leftGroups = left === "" ? [] : left.split(":")
    const rightGroups = right === "" ? [] : right.split(":")

    // Total groups when expanded must not exceed maxGroups
    if (leftGroups.length + rightGroups.length >= maxGroups) return false

    // Validate each group
    for (const group of [...leftGroups, ...rightGroups]) {
      if (!isValidHexGroup(group)) return false
    }

    return true
  }

  // Full form: must have exactly maxGroups groups
  const groups = value.split(":")
  if (groups.length !== maxGroups) return false

  for (const group of groups) {
    if (!isValidHexGroup(group)) return false
  }

  return true
}

function isValidHexGroup(group: string): boolean {
  if (group.length === 0 || group.length > 4) return false
  return /^[0-9a-fA-F]{1,4}$/.test(group)
}

export function ip<IsRequired extends boolean = false>(required?: IsRequired, options?: Omit<IpOptions<IsRequired>, "required">): IpSchema<IsRequired> {
  const { version = "any", allowCIDR = false, whitelist, transform, defaultValue, i18n } = options ?? {}

  const isRequired = required ?? (false as IsRequired)

  const actualDefaultValue = defaultValue ?? (isRequired ? "" : null)

  const getMessage = (key: keyof IpMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.ip.${key}`, params)
  }

  const preprocessFn = (val: unknown) => {
    if (val === "" || val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val).trim()

    if (processed === "" && !required) {
      return null
    }

    if (transform) {
      processed = transform(processed)
    }

    return processed
  }

  const baseSchema = isRequired ? z.preprocess(preprocessFn, z.string()) : z.preprocess(preprocessFn, z.string().nullable())

  const schema = baseSchema.superRefine((val, ctx) => {
    if (val === null) return

    // Required check
    if (isRequired && (val === "" || val === "null" || val === "undefined")) {
      ctx.addIssue({ code: "custom", message: getMessage("required") })
      return
    }

    if (!isRequired && val === "") return

    // Separate CIDR prefix if present
    let ipPart = val
    let cidrPrefix: string | null = null

    const slashIndex = val.indexOf("/")
    if (slashIndex !== -1) {
      if (!allowCIDR) {
        ctx.addIssue({ code: "custom", message: getMessage("invalid") })
        return
      }
      ipPart = val.substring(0, slashIndex)
      cidrPrefix = val.substring(slashIndex + 1)
    }

    // Determine which version(s) to try
    const isV4 = validateIPv4(ipPart)
    const isV6 = validateIPv6(ipPart)

    if (version === "v4") {
      if (!isV4) {
        ctx.addIssue({ code: "custom", message: getMessage("notIPv4") })
        return
      }
    } else if (version === "v6") {
      if (!isV6) {
        ctx.addIssue({ code: "custom", message: getMessage("notIPv6") })
        return
      }
    } else {
      // version === "any"
      if (!isV4 && !isV6) {
        ctx.addIssue({ code: "custom", message: getMessage("invalid") })
        return
      }
    }

    // Validate CIDR prefix length
    if (cidrPrefix !== null) {
      if (!/^\d+$/.test(cidrPrefix)) {
        ctx.addIssue({ code: "custom", message: getMessage("invalid") })
        return
      }

      const prefixNum = Number(cidrPrefix)
      const maxPrefix = isV4 ? 32 : 128

      if (prefixNum < 0 || prefixNum > maxPrefix) {
        ctx.addIssue({ code: "custom", message: getMessage("invalid") })
        return
      }
    }

    // Whitelist check
    if (whitelist && whitelist.length > 0) {
      if (!whitelist.includes(val)) {
        ctx.addIssue({ code: "custom", message: getMessage("notInWhitelist") })
        return
      }
    }
  })

  return schema as unknown as IpSchema<IsRequired>
}
