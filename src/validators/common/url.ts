/**
 * @fileoverview URL validator for Zod Kit
 *
 * Provides comprehensive URL validation with protocol filtering, domain control,
 * port validation, path constraints, and localhost handling.
 *
 * @author Ong Hoe Yuan
 * @version 0.0.5
 */

import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

/**
 * Type definition for URL validation error messages
 *
 * @interface UrlMessages
 * @property {string} [required] - Message when field is required but empty
 * @property {string} [invalid] - Message when URL format is invalid
 * @property {string} [min] - Message when URL is too short
 * @property {string} [max] - Message when URL is too long
 * @property {string} [includes] - Message when URL doesn't contain required string
 * @property {string} [excludes] - Message when URL contains forbidden string
 * @property {string} [protocol] - Message when protocol is not allowed
 * @property {string} [domain] - Message when domain is not allowed
 * @property {string} [domainBlacklist] - Message when domain is blacklisted
 * @property {string} [port] - Message when port is not allowed
 * @property {string} [pathStartsWith] - Message when path doesn't start with required string
 * @property {string} [pathEndsWith] - Message when path doesn't end with required string
 * @property {string} [hasQuery] - Message when query parameters are required
 * @property {string} [noQuery] - Message when query parameters are forbidden
 * @property {string} [hasFragment] - Message when fragment is required
 * @property {string} [noFragment] - Message when fragment is forbidden
 * @property {string} [localhost] - Message when localhost is forbidden
 * @property {string} [noLocalhost] - Message when localhost is required
 */
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

/**
 * Configuration options for URL validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 *
 * @interface UrlOptions
 * @property {IsRequired} [required=true] - Whether the field is required
 * @property {number} [min] - Minimum length of URL
 * @property {number} [max] - Maximum length of URL
 * @property {string} [includes] - String that must be included in URL
 * @property {string | string[]} [excludes] - String(s) that must not be included
 * @property {string[]} [protocols] - Allowed protocols (e.g., ["https", "http"])
 * @property {string[]} [allowedDomains] - Domains that are allowed
 * @property {string[]} [blockedDomains] - Domains that are blocked
 * @property {number[]} [allowedPorts] - Ports that are allowed
 * @property {number[]} [blockedPorts] - Ports that are blocked
 * @property {string} [pathStartsWith] - Path must start with this string
 * @property {string} [pathEndsWith] - Path must end with this string
 * @property {boolean} [mustHaveQuery] - Whether URL must have query parameters
 * @property {boolean} [mustNotHaveQuery] - Whether URL must not have query parameters
 * @property {boolean} [mustHaveFragment] - Whether URL must have fragment
 * @property {boolean} [mustNotHaveFragment] - Whether URL must not have fragment
 * @property {boolean} [allowLocalhost=true] - Whether to allow localhost URLs
 * @property {boolean} [blockLocalhost] - Whether to explicitly block localhost URLs
 * @property {Function} [transform] - Custom transformation function for URL strings
 * @property {string | null} [defaultValue] - Default value when input is empty
 * @property {Record<Locale, UrlMessages>} [i18n] - Custom error messages for different locales
 */
export type UrlOptions<IsRequired extends boolean = true> = {
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

/**
 * Type alias for URL validation schema based on required flag
 *
 * @template IsRequired - Whether the field is required
 * @typedef UrlSchema
 * @description Returns ZodString if required, ZodNullable<ZodString> if optional
 */
export type UrlSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

/**
 * Creates a Zod schema for URL validation with comprehensive constraints
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @param {IsRequired} [required=false] - Whether the field is required
 * @param {Omit<ValidatorOptions<IsRequired>, 'required'>} [options] - Configuration options for validation
 * @returns {UrlSchema<IsRequired>} Zod schema for URL validation
 *
 * @description
 * Creates a comprehensive URL validator with protocol filtering, domain control,
 * port validation, path constraints, and localhost handling.
 *
 * Features:
 * - RFC-compliant URL format validation
 * - Protocol whitelist/blacklist (http, https, ftp, etc.)
 * - Domain whitelist/blacklist with subdomain support
 * - Port validation and filtering
 * - Path prefix/suffix validation
 * - Query parameter requirements
 * - Fragment requirements
 * - Localhost detection and control
 * - Length validation
 * - Content inclusion/exclusion
 * - Custom transformation functions
 * - Comprehensive internationalization
 *
 * @example
 * ```typescript
 * // Basic URL validation
 * const basicSchema = url() // optional by default
 * basicSchema.parse("https://example.com") // ✓ Valid
 * basicSchema.parse(null) // ✓ Valid (optional)
 *
 * // Required validation
 * const requiredSchema = parse("https://example.com") // ✓ Valid
(true)
 * requiredSchema.parse(null) // ✗ Invalid (required)
 *
 *
 * // HTTPS only
 * const httpsSchema = url(false, { protocols: ["https"] })
 * httpsSchema.parse("https://example.com") // ✓ Valid
 * httpsSchema.parse("http://example.com") // ✗ Invalid
 *
 * // Domain restriction
 * const domainSchema = url(false, {
 *   allowedDomains: ["company.com", "trusted.org"]
 * })
 * domainSchema.parse("https://app.company.com") // ✓ Valid (subdomain)
 * domainSchema.parse("https://example.com") // ✗ Invalid
 *
 * // Block localhost
 * const noLocalhostSchema = url(false, { blockLocalhost: true })
 * noLocalhostSchema.parse("https://example.com") // ✓ Valid
 * noLocalhostSchema.parse("http://localhost:3000") // ✗ Invalid
 *
 * // API endpoints with path requirements
 * const apiSchema = url(false, {
 *   pathStartsWith: "/api/",
 *   mustHaveQuery: true
 * })
 * apiSchema.parse("https://api.com/api/users?page=1") // ✓ Valid
 *
 * // Port restrictions
 * const portSchema = url(false, {
 *   allowedPorts: [80, 443, 8080]
 * })
 * portSchema.parse("https://example.com:443") // ✓ Valid
 * portSchema.parse("https://example.com:3000") // ✗ Invalid
 *
 * // Optional with default
 * const optionalSchema = url(false, {
 *   defaultValue: null
 * })
 * ```
 *
 * @throws {z.ZodError} When validation fails with specific error messages
 * @see {@link UrlOptions} for all available configuration options
 */
export function url<IsRequired extends boolean = false>(required?: IsRequired, options?: Omit<UrlOptions<IsRequired>, 'required'>): UrlSchema<IsRequired> {
  const {
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
    i18n,
  } = options ?? {}

  const isRequired = required ?? false as IsRequired

  const actualDefaultValue = defaultValue ?? (isRequired ? "" : null)

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

  const baseSchema = isRequired ? z.preprocess(preprocessFn, z.string()) : z.preprocess(preprocessFn, z.string().nullable())

  const schema = baseSchema.superRefine((val, ctx) => {
    if (val === null) return

    // Required check
    if (isRequired && (val === "" || val === "null" || val === "undefined")) {
      ctx.addIssue({ code: "custom", message: getMessage("required") })
      return
    }

    // URL format validation
    let urlObj: URL
    try {
      urlObj = new URL(val)
    } catch {
      ctx.addIssue({ code: "custom", message: getMessage("invalid") })
      return
    }

    // Length checks
    if (val !== null && min !== undefined && val.length < min) {
      ctx.addIssue({ code: "custom", message: getMessage("min", { min }) })
      return
    }
    if (val !== null && max !== undefined && val.length > max) {
      ctx.addIssue({ code: "custom", message: getMessage("max", { max }) })
      return
    }

    // String content checks
    if (val !== null && includes !== undefined && !val.includes(includes)) {
      ctx.addIssue({ code: "custom", message: getMessage("includes", { includes }) })
      return
    }
    if (val !== null && excludes !== undefined) {
      const excludeList = Array.isArray(excludes) ? excludes : [excludes]
      for (const exclude of excludeList) {
        if (val.includes(exclude)) {
          ctx.addIssue({ code: "custom", message: getMessage("excludes", { excludes: exclude }) })
          return
        }
      }
    }

    // Protocol validation
    if (protocols && !protocols.includes(urlObj.protocol.slice(0, -1))) {
      ctx.addIssue({ code: "custom", message: getMessage("protocol", { protocols: protocols.join(", ") }) })
      return
    }

    // Domain validation
    const hostname = urlObj.hostname.toLowerCase()
    if (allowedDomains && !allowedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) {
      ctx.addIssue({ code: "custom", message: getMessage("domain", { domains: allowedDomains.join(", ") }) })
      return
    }
    if (blockedDomains && blockedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) {
      const blockedDomain = blockedDomains.find((domain) => hostname === domain || hostname.endsWith(`.${domain}`))
      ctx.addIssue({ code: "custom", message: getMessage("domainBlacklist", { domain: blockedDomain }) })
      return
    }

    // Port validation
    const port = urlObj.port ? parseInt(urlObj.port) : urlObj.protocol === "https:" ? 443 : 80
    if (allowedPorts && !allowedPorts.includes(port)) {
      ctx.addIssue({ code: "custom", message: getMessage("port", { ports: allowedPorts.join(", ") }) })
      return
    }
    if (blockedPorts && blockedPorts.includes(port)) {
      ctx.addIssue({ code: "custom", message: getMessage("port", { port }) })
      return
    }

    // Path validation
    if (pathStartsWith && !urlObj.pathname.startsWith(pathStartsWith)) {
      ctx.addIssue({ code: "custom", message: getMessage("pathStartsWith", { path: pathStartsWith }) })
      return
    }
    if (pathEndsWith && !urlObj.pathname.endsWith(pathEndsWith)) {
      ctx.addIssue({ code: "custom", message: getMessage("pathEndsWith", { path: pathEndsWith }) })
      return
    }

    // Query validation
    if (mustHaveQuery && !urlObj.search) {
      ctx.addIssue({ code: "custom", message: getMessage("hasQuery") })
      return
    }
    if (mustNotHaveQuery && urlObj.search) {
      ctx.addIssue({ code: "custom", message: getMessage("noQuery") })
      return
    }

    // Fragment validation
    if (mustHaveFragment && !urlObj.hash) {
      ctx.addIssue({ code: "custom", message: getMessage("hasFragment") })
      return
    }
    if (mustNotHaveFragment && urlObj.hash) {
      ctx.addIssue({ code: "custom", message: getMessage("noFragment") })
      return
    }

    // Localhost validation
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.") || hostname.startsWith("10.") || hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
    if (blockLocalhost && isLocalhost) {
      ctx.addIssue({ code: "custom", message: getMessage("noLocalhost") })
      return
    }
    if (!allowLocalhost && isLocalhost) {
      ctx.addIssue({ code: "custom", message: getMessage("localhost") })
      return
    }
  })

  return schema as unknown as UrlSchema<IsRequired>
}
