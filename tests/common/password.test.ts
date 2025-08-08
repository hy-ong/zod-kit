import { describe, expect, it, beforeEach } from "vitest"
import { Locale, setLocale, password } from "../../src"

const locales = [
  {
    locale: "en",
    messages: {
      required: "Required",
      min: "Must be at least 5 characters",
      max: "Must be at most 5 characters",
      uppercase: "Must include at least one uppercase letter",
      lowercase: "Must include at least one lowercase letter",
      digits: "Must include at least one digit",
      special: "Must include at least one special character",
    },
  },
  {
    locale: "zh-TW",
    messages: {
      required: "必填",
      min: "長度至少 5 字元",
      max: "長度最多 5 字元",
      uppercase: "必須包含至少一個大寫字母",
      lowercase: "必須包含至少一個小寫字母",
      digits: "必須包含至少一個數字",
      special: "必須包含至少一個特殊符號",
    },
  },
] as const

describe.each(locales)("password() locale: $locale", ({ locale, messages }) => {
  beforeEach(() => setLocale(locale as Locale))

  it("should pass with valid string", () => {
    const schema = password()
    expect(schema.parse("hello")).toBe("hello")
  })

  it("should fail with empty string when required", () => {
    const schema = password()
    expect(() => schema.parse("")).toThrow(messages.required)
    expect(() => schema.parse(null)).toThrow(messages.required)
    expect(() => schema.parse(undefined)).toThrow(messages.required)
  })

  it("should pass with null when not required", () => {
    const schema = password({ required: false })
    expect(schema.parse("")).toBe(null)
    expect(schema.parse(null)).toBe(null)
    expect(schema.parse(undefined)).toBe(null)
  })

  it("should fail with string shorter than min", () => {
    const schema = password({ min: 5 })
    expect(() => schema.parse("hi")).toThrow(messages.min)
    expect(() => schema.parse("")).toThrow(messages.min)
    expect(() => schema.parse(null)).toThrow(messages.min)
    expect(() => schema.parse(undefined)).toThrow(messages.min)
  })

  it("should fail with string longer than max", () => {
    const schema = password({ max: 5 })
    expect(() => schema.parse("hello world")).toThrow(messages.max)
  })

  it("should enforce uppercase requirement", () => {
    const schema = password({ uppercase: true })
    expect(() => schema.parse("lowercase1!")).toThrow(messages.uppercase)
    expect(schema.parse("Hello1!")).toBe("Hello1!")
  })

  it("should enforce lowercase requirement", () => {
    const schema = password({ lowercase: true })
    expect(() => schema.parse("UPPERCASE1!")).toThrow(messages.lowercase)
    expect(schema.parse("Test1!")).toBe("Test1!")
  })

  it("should enforce digit requirement", () => {
    const schema = password({ digits: true })
    expect(() => schema.parse("NoDigits!")).toThrow(messages.digits)
    expect(schema.parse("With1!")).toBe("With1!")
  })

  it("should enforce special character requirement", () => {
    const schema = password({ special: true })
    expect(() => schema.parse("NoSpecial1")).toThrow(messages.special)
    expect(schema.parse("Valid1!")).toBe("Valid1!")
  })
})
