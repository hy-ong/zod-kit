import { describe, it, expect, beforeEach } from "vitest"
import { setLocale, url, Locale } from "../../src"

const locales = [
  {
    locale: "en",
    messages: {
      required: "TEST is required",
      min: "TEST must be at least 20 characters",
      max: "TEST must be at most 10 characters",
      includes: "TEST must include company",
      invalid: "TEST is invalid format",
    },
  },
  {
    locale: "zh-TW",
    messages: {
      required: "請輸入 TEST",
      min: "TEST 長度至少 20 字元",
      max: "TEST 長度最多 10 字元",
      includes: "TEST 必須包含「company」",
      invalid: "TEST 格式錯誤",
    },
  },
] as const

describe.each(locales)("url() locale: $locale", ({ locale, messages }) => {
  beforeEach(() => setLocale(locale as Locale))

  it("should pass for valid url", () => {
    const schema = url({ label: "TEST" })
    expect(schema.parse("https://example.com")).toBe("https://example.com")
  })

  it("should fail for invalid url format", () => {
    const schema = url({ label: "TEST" })
    expect(() => schema.parse("invalid-url")).toThrow(messages.invalid)
  })

  it("should enforce required when set", () => {
    const schema = url({ label: "TEST", required: true })
    expect(() => schema.parse("")).toThrow(messages.required)
    expect(() => schema.parse(null)).toThrow(messages.required)
    expect(() => schema.parse(undefined)).toThrow(messages.required)
  })

  it("should allow null if not required", () => {
    const schema = url({ label: "TEST", required: false })
    expect(schema.parse("")).toBe(null)
    expect(schema.parse(null)).toBe(null)
    expect(schema.parse(undefined)).toBe(null)
  })

  it("should enforce max length", () => {
    const schema = url({ label: "TEST", max: 10 })
    expect(() => schema.parse("https://verylongurl.com")).toThrow(messages.max)
  })

  it("should enforce min length", () => {
    const schema = url({ label: "TEST", min: 20 })
    expect(() => schema.parse("https://short.co")).toThrow(messages.min)
  })

  it("should enforce includes", () => {
    const schema = url({ label: "TEST", includes: "company" })
    expect(schema.parse("https://company.com")).toBe("https://company.com")
    expect(() => schema.parse("https://other.com")).toThrow(messages.includes)
  })
})
