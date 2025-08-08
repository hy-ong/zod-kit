import { describe, it, expect, beforeEach } from "vitest"
import { setLocale, boolean, Locale } from "../../src"

const locales = [
  {
    locale: "en",
    messages: {
      required: "Required",
      shouldBeTrue: "Must be True",
      shouldBeFalse: "Must be False",
    },
  },
  {
    locale: "zh-TW",
    messages: {
      required: "必填",
      shouldBeTrue: "必須為是",
      shouldBeFalse: "必須為否",
    },
  },
] as const

describe.each(locales)("boolean() locale: $locale", ({ locale, messages }) => {
  beforeEach(() => setLocale(locale as Locale))

  it("should parse true values correctly", () => {
    const schema = boolean({ required: true })
    expect(schema.parse(true)).toBe(true)
    expect(schema.parse("true")).toBe(true)
    expect(schema.parse(1)).toBe(true)
  })

  it("should parse false values correctly", () => {
    const schema = boolean({ required: true })
    expect(schema.parse(false)).toBe(false)
    expect(schema.parse("false")).toBe(false)
    expect(schema.parse(0)).toBe(false)
  })

  it("should throw when input is empty and required", () => {
    const schema = boolean({ required: true })
    expect(() => schema.parse(undefined)).toThrow(messages.required)
    expect(() => schema.parse(null)).toThrow(messages.required)
    expect(() => schema.parse("")).toThrow(messages.required)
  })

  it("should return null when not required and empty input", () => {
    const schema = boolean({ required: false })
    expect(schema.parse(undefined)).toBe(null)
    expect(schema.parse(null)).toBe(null)
    expect(schema.parse("")).toBe(null)
  })

  it("should apply defaultValue when required", () => {
    const schema = boolean({ required: true, defaultValue: true })
    expect(schema.parse("")).toBe(true)
    expect(schema.parse(null)).toBe(true)
    expect(schema.parse(undefined)).toBe(true)

    const schema2 = boolean({ required: true, defaultValue: false })
    expect(schema2.parse("")).toBe(false)
    expect(schema2.parse(null)).toBe(false)
    expect(schema2.parse(undefined)).toBe(false)
  })

  it("should apply defaultValue when not required", () => {
    const schema = boolean({ required: false, defaultValue: true })
    expect(schema.parse("")).toBe(true)
    expect(schema.parse(null)).toBe(true)
    expect(schema.parse(undefined)).toBe(true)

    const schema2 = boolean({ required: false, defaultValue: false })
    expect(schema2.parse("")).toBe(false)
    expect(schema2.parse(null)).toBe(false)
    expect(schema2.parse(undefined)).toBe(false)
  })

  it("should throw error for invalid string", () => {
    const schema = boolean()
    expect(() => schema.parse("yes")).toThrow()
    expect(() => schema.parse("no")).toThrow()
  })

  it("should throw error for non-boolean, non-convertible values", () => {
    const schema = boolean()
    expect(() => schema.parse({})).toThrow()
    expect(() => schema.parse([])).toThrow()
  })

  it("should validate shouldBe: true", () => {
    const schema = boolean({ shouldBe: true })
    expect(schema.parse(true)).toBe(true)
    expect(schema.parse("true")).toBe(true)
    expect(() => schema.parse(false)).toThrow(messages.shouldBeTrue)
    expect(() => schema.parse("false")).toThrow(messages.shouldBeTrue)
    expect(() => schema.parse(0)).toThrow(messages.shouldBeTrue)
  })

  it("should validate shouldBe: false", () => {
    const schema = boolean({ shouldBe: false })
    expect(schema.parse(false)).toBe(false)
    expect(schema.parse("false")).toBe(false)
    expect(schema.parse(0)).toBe(false)
    expect(() => schema.parse(true)).toThrow(messages.shouldBeFalse)
    expect(() => schema.parse("true")).toThrow(messages.shouldBeFalse)
    expect(() => schema.parse(1)).toThrow(messages.shouldBeFalse)
  })

  it("should show correct error message when shouldBe is true but value is false", () => {
    const schema = boolean({ shouldBe: true })
    expect(() => schema.parse(false)).toThrow(messages.shouldBeTrue)
  })

  it("should show correct error message when shouldBe is false but value is true", () => {
    const schema = boolean({ shouldBe: false })
    expect(() => schema.parse(true)).toThrow(messages.shouldBeFalse)
  })
})
