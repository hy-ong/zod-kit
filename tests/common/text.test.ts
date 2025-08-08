import { describe, expect, it, beforeEach } from "vitest"
import { Locale, setLocale, text } from "../../src"

const locales = [
  {
    locale: "en",
    messages: {
      required: "Required",
      min: "Must be at least 5 characters",
      max: "Must be at most 5 characters",
      startsWith: "Must start with pre",
      endsWith: "Must end with xyz",
      includes: "Must include foo",
      invalid: "Invalid format",
    },
  },
  {
    locale: "zh-TW",
    messages: {
      required: "必填",
      min: "長度至少 5 字元",
      max: "長度最多 5 字元",
      startsWith: "必須以「pre」開頭",
      endsWith: "必須以「xyz」結尾",
      includes: "必須包含「foo」",
      invalid: "格式錯誤",
    },
  },
] as const

describe.each(locales)("text() locale: $locale", ({ locale, messages }) => {
  beforeEach(() => setLocale(locale as Locale))

  it("should pass with valid string", () => {
    const schema = text()
    expect(schema.parse("hello")).toBe("hello")
  })

  it("should fail with empty string when required", () => {
    const schema = text()
    expect(() => schema.parse("")).toThrow(messages.required)
    expect(() => schema.parse(null)).toThrow(messages.required)
    expect(() => schema.parse(undefined)).toThrow(messages.required)
  })

  it("should pass with null when not required", () => {
    const schema = text({ required: false })
    expect(schema.parse("")).toBe(null)
    expect(schema.parse(null)).toBe(null)
    expect(schema.parse(undefined)).toBe(null)
  })

  it("should fail with string shorter than min", () => {
    const schema = text({ min: 5 })
    expect(() => schema.parse("hi")).toThrow(messages.min)
    expect(() => schema.parse("")).toThrow(messages.min)
    expect(() => schema.parse(null)).toThrow(messages.min)
    expect(() => schema.parse(undefined)).toThrow(messages.min)
  })

  it("should fail with string longer than max", () => {
    const schema = text({ max: 5 })
    expect(() => schema.parse("hello world")).toThrow(messages.max)
  })

  it("should fail if does not start with specified string", () => {
    const schema = text({ startsWith: "pre" })
    expect(schema.parse("prepaid")).toBe("prepaid")
    expect(() => schema.parse("hello world")).toThrow(messages.startsWith)
  })

  it("should fail if does not end with specified string", () => {
    const schema = text({ endsWith: "xyz" })
    expect(schema.parse("hello xyz")).toBe("hello xyz")
    expect(() => schema.parse("hello world")).toThrow(messages.endsWith)
  })

  it("should fail if does not include specified substring", () => {
    const schema = text({ includes: "foo" })
    expect(schema.parse("hello foo")).toBe("hello foo")
    expect(() => schema.parse("hello world")).toThrow(messages.includes)
  })

  it("should fail if does not match regex", () => {
    const schema = text({ regex: /^[A-Z]+$/ })
    expect(schema.parse("HELLO")).toBe("HELLO")
    expect(() => schema.parse("hello")).toThrow(messages.invalid)
  })
})
