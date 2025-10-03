/**
 * @fileoverview Email validator for Zod Kit
 *
 * Provides comprehensive email validation with domain filtering, business email
 * validation, disposable email detection, and extensive customization options.
 *
 * @author Ong Hoe Yuan
 * @version 0.0.5
 */

import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

/**
 * Type definition for email validation error messages
 *
 * @interface EmailMessages
 * @property {string} [required] - Message when field is required but empty
 * @property {string} [invalid] - Message when email format is invalid
 * @property {string} [minLength] - Message when email is too short
 * @property {string} [maxLength] - Message when email is too long
 * @property {string} [includes] - Message when email doesn't contain required string
 * @property {string} [domain] - Message when email domain is not allowed
 * @property {string} [domainBlacklist] - Message when email domain is blacklisted
 * @property {string} [businessOnly] - Message when free email providers are not allowed
 * @property {string} [noDisposable] - Message when disposable email addresses are not allowed
 */
export type EmailMessages = {
  required?: string
  invalid?: string
  minLength?: string
  maxLength?: string
  includes?: string
  domain?: string
  domainBlacklist?: string
  businessOnly?: string
  noDisposable?: string
}

/**
 * Configuration options for email validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 *
 * @interface EmailOptions
 * @property {string | string[]} [domain] - Allowed domain(s) for email addresses
 * @property {string[]} [domainBlacklist] - Domains that are not allowed
 * @property {number} [minLength] - Minimum length of email address
 * @property {number} [maxLength] - Maximum length of email address
 * @property {string} [includes] - String that must be included in the email
 * @property {string | string[]} [excludes] - String(s) that must not be included
 * @property {boolean} [allowSubdomains=true] - Whether to allow subdomains in domain validation
 * @property {boolean} [businessOnly=false] - If true, reject common free email providers
 * @property {boolean} [noDisposable=false] - If true, reject disposable email addresses
 * @property {boolean} [lowercase=true] - Whether to convert email to lowercase
 * @property {Function} [transform] - Custom transformation function for email strings
 * @property {string | null} [defaultValue] - Default value when input is empty
 * @property {Record<Locale, EmailMessages>} [i18n] - Custom error messages for different locales
 */
export type EmailOptions<IsRequired extends boolean = true> = {
  domain?: string | string[]
  domainBlacklist?: string[]
  minLength?: number
  maxLength?: number
  includes?: string
  excludes?: string | string[]
  allowSubdomains?: boolean
  businessOnly?: boolean
  noDisposable?: boolean
  lowercase?: boolean
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Record<Locale, EmailMessages>
}

/**
 * Type alias for email validation schema based on required flag
 *
 * @template IsRequired - Whether the field is required
 * @typedef EmailSchema
 * @description Returns ZodString if required, ZodNullable<ZodString> if optional
 */
export type EmailSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

/**
 * Creates a Zod schema for email validation with comprehensive filtering options
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @param {IsRequired} [required=false] - Whether the field is required
 * @param {Omit<EmailOptions<IsRequired>, 'required'>} [options] - Configuration options for email validation
 * @returns {EmailSchema<IsRequired>} Zod schema for email validation
 *
 * @description
 * Creates a comprehensive email validator with domain filtering, business email
 * validation, disposable email detection, and extensive customization options.
 *
 * Features:
 * - RFC-compliant email format validation
 * - Domain whitelist/blacklist support
 * - Business email validation (excludes free providers)
 * - Disposable email detection
 * - Subdomain support configuration
 * - Length validation
 * - Content inclusion/exclusion
 * - Automatic lowercase conversion
 * - Custom transformation functions
 * - Comprehensive internationalization
 *
 * @example
 * ```typescript
 * // Basic email validation (optional by default)
 * const basicSchema = email()
 * basicSchema.parse("user@example.com") // ✓ Valid
 * basicSchema.parse(null) // ✓ Valid (optional)
 *
 * // Required email
 * const requiredSchema = email(true)
 * requiredSchema.parse("user@example.com") // ✓ Valid
 * requiredSchema.parse(null) // ✗ Invalid (required)
 *
 * // Domain restriction
 * const domainSchema = email(false, {
 *   domain: ["company.com", "organization.org"]
 * })
 * domainSchema.parse("user@company.com") // ✓ Valid
 * domainSchema.parse("user@gmail.com") // ✗ Invalid
 *
 * // Business emails only (no free providers)
 * const businessSchema = email(true, { businessOnly: true })
 * businessSchema.parse("user@company.com") // ✓ Valid
 * businessSchema.parse("user@gmail.com") // ✗ Invalid
 *
 * // No disposable emails
 * const noDisposableSchema = email(true, { noDisposable: true })
 * noDisposableSchema.parse("user@company.com") // ✓ Valid
 * noDisposableSchema.parse("user@10minutemail.com") // ✗ Invalid
 *
 * // Domain blacklist
 * const blacklistSchema = email(false, {
 *   domainBlacklist: ["spam.com", "blocked.org"]
 * })
 *
 * // Optional with default
 * const optionalSchema = email(false, { defaultValue: null })
 * ```
 *
 * @throws {z.ZodError} When validation fails with specific error messages
 * @see {@link EmailOptions} for all available configuration options
 */
export function email<IsRequired extends boolean = false>(required?: IsRequired, options?: Omit<EmailOptions<IsRequired>, 'required'>): EmailSchema<IsRequired> {
  const {
    domain,
    domainBlacklist,
    minLength,
    maxLength,
    includes,
    excludes,
    allowSubdomains = true,
    businessOnly = false,
    noDisposable = false,
    lowercase = true,
    transform,
    defaultValue,
    i18n,
  } = options ?? {}

  const isRequired = required ?? false as IsRequired

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof EmailMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.email.${key}`, params)
  }

  // Common disposable email domains
  const disposableDomains = ["10minutemail.com", "tempmail.org", "guerrillamail.com", "mailinator.com", "yopmail.com", "temp-mail.org", "throwaway.email", "getnada.com", "maildrop.cc"]

  // Common business email patterns (not free providers)
  const freeEmailDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com", "protonmail.com", "zoho.com"]

  const actualDefaultValue = defaultValue ?? null

  const baseSchema = z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) {
        return actualDefaultValue
      }

      let processed = String(val).trim()

      if (lowercase) {
        processed = processed.toLowerCase()
      }

      if (transform) {
        processed = transform(processed)
      }

      return processed
    },
    z.union([z.string().email(), z.null()])
  )

  const schema = baseSchema.refine((val) => {
    // Required check first
    if (isRequired && val === null) {
      throw new z.ZodError([{ code: "custom", message: getMessage("required"), path: [] }])
    }

    if (val === null) return true

    // Invalid email check
    if (typeof val !== "string") {
      throw new z.ZodError([{ code: "custom", message: getMessage("invalid"), path: [] }])
    }

    // Length checks
    if (minLength !== undefined && val.length < minLength) {
      throw new z.ZodError([{ code: "custom", message: getMessage("minLength", { minLength }), path: [] }])
    }
    if (maxLength !== undefined && val.length > maxLength) {
      throw new z.ZodError([{ code: "custom", message: getMessage("maxLength", { maxLength }), path: [] }])
    }

    // Content checks
    if (includes !== undefined && !val.includes(includes)) {
      throw new z.ZodError([{ code: "custom", message: getMessage("includes", { includes }), path: [] }])
    }

    if (excludes !== undefined) {
      const excludeList = Array.isArray(excludes) ? excludes : [excludes]
      for (const exclude of excludeList) {
        if (val.includes(exclude)) {
          throw new z.ZodError([{ code: "custom", message: getMessage("includes", { includes: exclude }), path: [] }])
        }
      }
    }

    // Extract domain from email
    const emailDomain = val.split("@")[1]?.toLowerCase()
    if (!emailDomain) {
      throw new z.ZodError([{ code: "custom", message: getMessage("invalid"), path: [] }])
    }

    // Business email check (should come before domain validation)
    if (businessOnly) {
      const isFreeProvider = freeEmailDomains.some((freeDomain) => {
        if (allowSubdomains) {
          return emailDomain === freeDomain || emailDomain.endsWith("." + freeDomain)
        }
        return emailDomain === freeDomain
      })

      if (isFreeProvider) {
        throw new z.ZodError([{ code: "custom", message: getMessage("businessOnly"), path: [] }])
      }
    }

    // Domain blacklist
    if (domainBlacklist && domainBlacklist.length > 0) {
      const isBlacklisted = domainBlacklist.some((blacklistedDomain) => {
        const lowerDomain = blacklistedDomain.toLowerCase()
        if (allowSubdomains) {
          return emailDomain === lowerDomain || emailDomain.endsWith("." + lowerDomain)
        }
        return emailDomain === lowerDomain
      })

      if (isBlacklisted) {
        throw new z.ZodError([{ code: "custom", message: getMessage("domainBlacklist", { domain: emailDomain }), path: [] }])
      }
    }

    // Domain validation
    if (domain !== undefined) {
      const allowedDomains = Array.isArray(domain) ? domain : [domain]
      const isAllowed = allowedDomains.some((allowedDomain) => {
        const lowerDomain = allowedDomain.toLowerCase()
        if (allowSubdomains) {
          return emailDomain === lowerDomain || emailDomain.endsWith("." + lowerDomain)
        }
        return emailDomain === lowerDomain
      })

      if (!isAllowed) {
        throw new z.ZodError([{ code: "custom", message: getMessage("domain", { domain: Array.isArray(domain) ? domain.join(", ") : domain }), path: [] }])
      }
    }

    // Disposable email check
    if (noDisposable) {
      const isDisposable = disposableDomains.some((disposableDomain) => {
        if (allowSubdomains) {
          return emailDomain === disposableDomain || emailDomain.endsWith("." + disposableDomain)
        }
        return emailDomain === disposableDomain
      })

      if (isDisposable) {
        throw new z.ZodError([{ code: "custom", message: getMessage("noDisposable"), path: [] }])
      }
    }

    return true
  })

  return schema as unknown as EmailSchema<IsRequired>
}
