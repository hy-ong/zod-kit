import { z, ZodNullable, ZodString } from "zod"
import { t } from "../i18n"
import { getLocale, type Locale } from "../config"

export type UrlMessages = {
  required?: string
  invalid?: string
  min?: string
  max?: string
  includes?: string
  excludes?: string
  protocol?: string
  domain?: string
  domainBlacklist?: string
  port?: string
  pathStartsWith?: string
  pathEndsWith?: string
  hasQuery?: string
  noQuery?: string
  hasFragment?: string
  noFragment?: string
  localhost?: string
  noLocalhost?: string
}

export type UrlOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
  min?: number
  max?: number
  includes?: string
  excludes?: string | string[]
  protocols?: string[]
  allowedDomains?: string[]
  blockedDomains?: string[]
  allowedPorts?: number[]
  blockedPorts?: number[]
  pathStartsWith?: string
  pathEndsWith?: string
  mustHaveQuery?: boolean
  mustNotHaveQuery?: boolean
  mustHaveFragment?: boolean
  mustNotHaveFragment?: boolean
  allowLocalhost?: boolean
  blockLocalhost?: boolean
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Record<Locale, UrlMessages>
}

export type UrlSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

export function url<IsRequired extends boolean = true>(options?: UrlOptions<IsRequired>): UrlSchema<IsRequired> {
  const {
    required = true,
    min,
    max,
    includes,
    excludes,
    protocols,
    allowedDomains,
    blockedDomains,
    allowedPorts,
    blockedPorts,
    pathStartsWith,
    pathEndsWith,
    mustHaveQuery,
    mustNotHaveQuery,
    mustHaveFragment,
    mustNotHaveFragment,
    allowLocalhost = true,
    blockLocalhost,
    transform,
    defaultValue = null,
    i18n
  } = options ?? {}

  const actualDefaultValue = defaultValue ?? (required ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof UrlMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.url.${key}`, params)
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

  const baseSchema = required
    ? z.preprocess(preprocessFn, z.string())
    : z.preprocess(preprocessFn, z.string().nullable())

  const schema = baseSchema.refine((val) => {
    if (val === null) return true

    // Required check
    if (required && (val === "" || val === "null" || val === "undefined")) {
      throw new z.ZodError([{ code: "custom", message: getMessage("required"), path: [] }])
    }

    // URL format validation
    let urlObj: URL
    try {
      urlObj = new URL(val)
    } catch {
      throw new z.ZodError([{ code: "custom", message: getMessage("invalid"), path: [] }])
    }

    // Length checks
    if (val !== null && min !== undefined && val.length < min) {
      throw new z.ZodError([{ code: "custom", message: getMessage("min", { min }), path: [] }])
    }
    if (val !== null && max !== undefined && val.length > max) {
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

    // Protocol validation
    if (protocols && !protocols.includes(urlObj.protocol.slice(0, -1))) {
      throw new z.ZodError([{ code: "custom", message: getMessage("protocol", { protocols: protocols.join(", ") }), path: [] }])
    }

    // Domain validation
    const hostname = urlObj.hostname.toLowerCase()
    if (allowedDomains && !allowedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))) {
      throw new z.ZodError([{ code: "custom", message: getMessage("domain", { domains: allowedDomains.join(", ") }), path: [] }])
    }
    if (blockedDomains && blockedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))) {
      const blockedDomain = blockedDomains.find(domain => hostname === domain || hostname.endsWith(`.${domain}`))
      throw new z.ZodError([{ code: "custom", message: getMessage("domainBlacklist", { domain: blockedDomain }), path: [] }])
    }

    // Port validation
    const port = urlObj.port ? parseInt(urlObj.port) : (urlObj.protocol === "https:" ? 443 : 80)
    if (allowedPorts && !allowedPorts.includes(port)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("port", { ports: allowedPorts.join(", ") }), path: [] }])
    }
    if (blockedPorts && blockedPorts.includes(port)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("port", { port }), path: [] }])
    }

    // Path validation
    if (pathStartsWith && !urlObj.pathname.startsWith(pathStartsWith)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("pathStartsWith", { path: pathStartsWith }), path: [] }])
    }
    if (pathEndsWith && !urlObj.pathname.endsWith(pathEndsWith)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("pathEndsWith", { path: pathEndsWith }), path: [] }])
    }

    // Query validation
    if (mustHaveQuery && !urlObj.search) {
      throw new z.ZodError([{ code: "custom", message: getMessage("hasQuery"), path: [] }])
    }
    if (mustNotHaveQuery && urlObj.search) {
      throw new z.ZodError([{ code: "custom", message: getMessage("noQuery"), path: [] }])
    }

    // Fragment validation
    if (mustHaveFragment && !urlObj.hash) {
      throw new z.ZodError([{ code: "custom", message: getMessage("hasFragment"), path: [] }])
    }
    if (mustNotHaveFragment && urlObj.hash) {
      throw new z.ZodError([{ code: "custom", message: getMessage("noFragment"), path: [] }])
    }

    // Localhost validation
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.") || hostname.startsWith("10.") || hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
    if (blockLocalhost && isLocalhost) {
      throw new z.ZodError([{ code: "custom", message: getMessage("noLocalhost"), path: [] }])
    }
    if (!allowLocalhost && isLocalhost) {
      throw new z.ZodError([{ code: "custom", message: getMessage("localhost"), path: [] }])
    }

    return true
  })

  return schema as unknown as UrlSchema<IsRequired>
}
