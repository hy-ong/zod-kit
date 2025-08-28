import { z, ZodNullable, ZodString } from "zod"
import { t } from "../i18n"
import { getLocale, type Locale } from "../config"

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

export type EmailOptions<IsRequired extends boolean = true> = {
  required?: IsRequired
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

export type EmailSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

export function email<IsRequired extends boolean = true>(options?: EmailOptions<IsRequired>): EmailSchema<IsRequired> {
  const { 
    required = true, 
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
    i18n 
  } = options ?? {}
  
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
  const disposableDomains = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 
    'mailinator.com', 'yopmail.com', 'temp-mail.org',
    'throwaway.email', 'getnada.com', 'maildrop.cc'
  ]
  
  // Common business email patterns (not free providers)
  const freeEmailDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'icloud.com', 'aol.com', 'protonmail.com', 'zoho.com'
  ]
  
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
    if (required && val === null) {
      throw new z.ZodError([{ code: 'custom', message: getMessage("required"), path: [] }])
    }
    
    if (val === null) return true
    
    // Invalid email check
    if (typeof val !== 'string') {
      throw new z.ZodError([{ code: 'custom', message: getMessage("invalid"), path: [] }])
    }
    
    // Length checks
    if (minLength !== undefined && val.length < minLength) {
      throw new z.ZodError([{ code: 'custom', message: getMessage("minLength", { minLength }), path: [] }])
    }
    if (maxLength !== undefined && val.length > maxLength) {
      throw new z.ZodError([{ code: 'custom', message: getMessage("maxLength", { maxLength }), path: [] }])
    }
    
    // Content checks
    if (includes !== undefined && !val.includes(includes)) {
      throw new z.ZodError([{ code: 'custom', message: getMessage("includes", { includes }), path: [] }])
    }
    
    if (excludes !== undefined) {
      const excludeList = Array.isArray(excludes) ? excludes : [excludes]
      for (const exclude of excludeList) {
        if (val.includes(exclude)) {
          throw new z.ZodError([{ code: 'custom', message: getMessage("includes", { includes: exclude }), path: [] }])
        }
      }
    }
    
    // Extract domain from email
    const emailDomain = val.split("@")[1]?.toLowerCase()
    if (!emailDomain) {
      throw new z.ZodError([{ code: 'custom', message: getMessage("invalid"), path: [] }])
    }
    
    // Business email check (should come before domain validation)
    if (businessOnly) {
      const isFreeProvider = freeEmailDomains.some(freeDomain => {
        if (allowSubdomains) {
          return emailDomain === freeDomain || emailDomain.endsWith('.' + freeDomain)
        }
        return emailDomain === freeDomain
      })
      
      if (isFreeProvider) {
        throw new z.ZodError([{ code: 'custom', message: getMessage("businessOnly"), path: [] }])
      }
    }
    
    // Domain blacklist
    if (domainBlacklist && domainBlacklist.length > 0) {
      const isBlacklisted = domainBlacklist.some(blacklistedDomain => {
        const lowerDomain = blacklistedDomain.toLowerCase()
        if (allowSubdomains) {
          return emailDomain === lowerDomain || emailDomain.endsWith('.' + lowerDomain)
        }
        return emailDomain === lowerDomain
      })
      
      if (isBlacklisted) {
        throw new z.ZodError([{ code: 'custom', message: getMessage("domainBlacklist", { domain: emailDomain }), path: [] }])
      }
    }
    
    // Domain validation
    if (domain !== undefined) {
      const allowedDomains = Array.isArray(domain) ? domain : [domain]
      const isAllowed = allowedDomains.some(allowedDomain => {
        const lowerDomain = allowedDomain.toLowerCase()
        if (allowSubdomains) {
          return emailDomain === lowerDomain || emailDomain.endsWith('.' + lowerDomain)
        }
        return emailDomain === lowerDomain
      })
      
      if (!isAllowed) {
        throw new z.ZodError([{ code: 'custom', message: getMessage("domain", { domain: Array.isArray(domain) ? domain.join(', ') : domain }), path: [] }])
      }
    }
    
    // Disposable email check
    if (noDisposable) {
      const isDisposable = disposableDomains.some(disposableDomain => {
        if (allowSubdomains) {
          return emailDomain === disposableDomain || emailDomain.endsWith('.' + disposableDomain)
        }
        return emailDomain === disposableDomain
      })
      
      if (isDisposable) {
        throw new z.ZodError([{ code: 'custom', message: getMessage("noDisposable"), path: [] }])
      }
    }
    
    return true
  })
  
  return schema as unknown as EmailSchema<IsRequired>
}
