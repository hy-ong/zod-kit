import { describe, it, expect, beforeEach } from "vitest"
import { setLocale, integer, Locale } from "../../src"

const locales = [
  {
    locale: "en",
    messages: {
      required: "TEST is required",
      min: "TEST must be at least 3",
      max: "TEST must be at most 10",
      integer: "TEST must be an integer",
    },
  },
  {
    locale: "zh-TW",
    messages: {
      required: "請輸入 TEST",
      min: "TEST 最小值 3",
      max: "TEST 最大值 10",
      integer: "TEST 必須為整數",
    },
  },
] as const

describe.each(locales)("integer() locale: $locale", ({ locale, messages }) => {
  beforeEach(() => setLocale(locale as Locale))

  it("should pass with valid integer", () => {
    const schema = integer({ label: "TEST" })
    expect(schema.parse(42)).toBe(42)
  })

  it("should parse string number as integer", () => {
    const schema = integer({ label: "TEST" })
    expect(schema.parse("100")).toBe(100)
  })

  it("should fail for decimal value", () => {
    const schema = integer({ label: "TEST" })
    expect(() => schema.parse(3.14)).toThrow(messages.integer)
  })

  it("should fail for non-numeric string", () => {
    const schema = integer({ label: "TEST" })
    expect(() => schema.parse("abc")).toThrow(messages.integer)
    expect(() => schema.parse("10a")).toThrow(messages.integer)
  })

  it("should allow null if not required", () => {
    const schema = integer({ label: "TEST", required: false })
    expect(schema.parse("")).toBe(null)
    expect(schema.parse(null)).toBe(null)
    expect(schema.parse(undefined)).toBe(null)
  })

  it("should fail when required and input is empty", () => {
    const schema = integer({ label: "TEST", required: true })
    expect(() => schema.parse("")).toThrow(messages.required)
    expect(() => schema.parse(null)).toThrow(messages.required)
    expect(() => schema.parse(undefined)).toThrow(messages.required)
  })

  it("should apply default value even when required", () => {
    const schema = integer({ label: "TEST", required: true, defaultValue: 5 })
    expect(schema.parse("")).toBe(5)
    expect(schema.parse(null)).toBe(5)
    expect(schema.parse(undefined)).toBe(5)
  })

  it("should apply default value even when required", () => {
    const schema = integer({ label: "TEST", required: false, defaultValue: 5 })
    expect(schema.parse("")).toBe(5)
    expect(schema.parse(null)).toBe(5)
    expect(schema.parse(undefined)).toBe(5)
  })

  it("should enforce min", () => {
    const schema = integer({ label: "TEST", min: 3 })
    expect(schema.parse(3)).toBe(3)
    expect(() => schema.parse(2)).toThrow(messages.min)
    expect(() => schema.parse("2")).toThrow(messages.min)
  })

  it("should enforce max", () => {
    const schema = integer({ label: "TEST", max: 10 })
    expect(schema.parse(10)).toBe(10)
    expect(() => schema.parse(11)).toThrow(messages.max)
    expect(() => schema.parse("11")).toThrow(messages.max)
  })
})
