import { describe, it, expect, beforeEach } from "vitest"
import { setLocale, number, Locale } from "../../src"

const locales = [
  {
    locale: "en",
    messages: {
      required: "Required",
      min: "Must be at least 5",
      max: "Must be at most 10",
    },
  },
  {
    locale: "zh-TW",
    messages: {
      required: "必填",
      min: "最小值 5",
      max: "最大值 10",
    },
  },
] as const

describe.each(locales)("number() locale: $locale", ({ locale, messages }) => {
  beforeEach(() => setLocale(locale as Locale))

  it("should pass with valid number", () => {
    const schema = number()
    expect(schema.parse(42)).toBe(42)
  })

  it("should parse string number", () => {
    const schema = number()
    expect(schema.parse("123")).toBe(123)
  })

  it("should fail for empty string when required", () => {
    const schema = number({ required: true })
    expect(() => schema.parse("")).toThrow(messages.required)
    expect(() => schema.parse(null)).toThrow(messages.required)
    expect(() => schema.parse(undefined)).toThrow(messages.required)
  })

  it("should allow null if not required", () => {
    const schema = number({ required: false })
    expect(schema.parse("")).toBe(null)
    expect(schema.parse(null)).toBe(null)
    expect(schema.parse(undefined)).toBe(null)
  })

  it("should apply default value with not required", () => {
    const schema = number({ required: false, defaultValue: 42 })
    expect(schema.parse("")).toBe(42)
    expect(schema.parse(null)).toBe(42)
    expect(schema.parse(undefined)).toBe(42)
  })

  it("should apply default value with required", () => {
    const schema = number({ required: true, defaultValue: 42 })
    expect(schema.parse("")).toBe(42)
    expect(schema.parse(null)).toBe(42)
    expect(schema.parse(undefined)).toBe(42)
  })

  it("should enforce min", () => {
    const schema = number({ min: 5 })
    expect(schema.parse(5)).toBe(5)
    expect(() => schema.parse(2)).toThrow(messages.min)
    expect(() => schema.parse("2")).toThrow(messages.min)
  })

  it("should enforce max", () => {
    const schema = number({ max: 10 })
    expect(schema.parse(10)).toBe(10)
    expect(() => schema.parse(11)).toThrow(messages.max)
    expect(() => schema.parse("11")).toThrow(messages.max)
  })
})
