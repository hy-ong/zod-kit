import { describe, it, expect, beforeEach } from "vitest"
import { setLocale, email, Locale } from "../../src"

const locales = [
  {
    locale: "en",
    messages: {
      required: "Required",
      min: "Must be at least 20 characters",
      max: "Must be at most 10 characters",
      includes: "Must include company",
      invalid: "Invalid format",
      domain: "Must be under the domain @example.com",
    },
  },
  {
    locale: "zh-TW",
    messages: {
      required: "必填",
      min: "長度至少 20 字元",
      max: "長度最多 10 字元",
      includes: "必須包含「company」",
      invalid: "格式錯誤",
      domain: "必須為 @example.com 網域",
    },
  },
] as const

describe.each(locales)("email() locale: $locale", ({ locale, messages }) => {
  beforeEach(() => setLocale(locale as Locale))

  it("should pass for valid email", () => {
    const schema = email()
    expect(schema.parse("test@example.com")).toBe("test@example.com")
  })

  it("should fail for invalid email format", () => {
    const schema = email()
    expect(() => schema.parse("invalid-email")).toThrow(messages.invalid)
  })

  it("should enforce required when set", () => {
    const schema = email({ required: true })
    expect(() => schema.parse("")).toThrow(messages.required)
    expect(() => schema.parse(null)).toThrow(messages.required)
    expect(() => schema.parse(undefined)).toThrow(messages.required)
  })

  it("should allow null if not required", () => {
    const schema = email({ required: false })
    expect(schema.parse("")).toBe(null)
    expect(schema.parse(null)).toBe(null)
    expect(schema.parse(undefined)).toBe(null)
  })

  it("should enforce max length", () => {
    const schema = email({ max: 10 })
    expect(() => schema.parse("verylongemail@example.com")).toThrow(messages.max)
  })

  it("should enforce min length", () => {
    const schema = email({ min: 20 })
    expect(() => schema.parse("short@example.com")).toThrow(messages.min)
  })

  it("should enforce includes", () => {
    const schema = email({ includes: "company" })
    expect(schema.parse("john@company.com")).toBe("john@company.com")
    expect(() => schema.parse("short@other.com")).toThrow(messages.includes)
  })

  it("should validate against custom domain", () => {
    const schema = email({ domain: "example.com" })
    expect(schema.parse("test@example.com")).toBe("test@example.com")
    expect(() => schema.parse("short@notexample.com")).toThrow(messages.domain)
  })
})
