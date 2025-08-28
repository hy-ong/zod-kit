import { describe, expect, it, beforeEach } from "vitest"
import { Locale, setLocale, text } from "../../src"

const locales = [
  {
    locale: "en",
    messages: {
      required: "Required",
      notEmpty: "Cannot be empty or whitespace only",
      minLength: "Must be at least 5 characters",
      maxLength: "Must be at most 5 characters",
      startsWith: "Must start with pre",
      endsWith: "Must end with xyz",
      includes: "Must include foo",
      excludes: "Must not contain admin",
      invalid: "Invalid format",
    },
  },
  {
    locale: "zh-TW",
    messages: {
      required: "必填",
      notEmpty: "不可為空白或僅含空格",
      minLength: "長度至少 5 字元",
      maxLength: "長度最多 5 字元",
      startsWith: "必須以「pre」開頭",
      endsWith: "必須以「xyz」結尾",
      includes: "必須包含「foo」",
      excludes: "不得包含「admin」",
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

  it("should fail with string shorter than minLength", () => {
    const schema = text({ minLength: 5 })
    expect(() => schema.parse("hi")).toThrow(messages.minLength)
    expect(() => schema.parse("")).toThrow(messages.required) // Empty string triggers required first
    expect(() => schema.parse(null)).toThrow(messages.required) // Null triggers required first
    expect(() => schema.parse(undefined)).toThrow(messages.required) // Undefined triggers required first
  })

  it("should fail with string longer than maxLength", () => {
    const schema = text({ maxLength: 5 })
    expect(() => schema.parse("hello world")).toThrow(messages.maxLength)
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

  it("should fail if contains excluded substring", () => {
    const schema = text({ excludes: "admin" })
    expect(schema.parse("hello")).toBe("hello")
    expect(() => schema.parse("admin user")).toThrow(messages.excludes)
  })

  it("should fail if contains any excluded substring from array", () => {
    const schema = text({ excludes: ["admin", "root", "test"] })
    expect(schema.parse("hello")).toBe("hello")
    expect(() => schema.parse("admin user")).toThrow(/Must not contain|不得包含/)
    expect(() => schema.parse("root access")).toThrow(/Must not contain|不得包含/)
    expect(() => schema.parse("test mode")).toThrow(/Must not contain|不得包含/)
  })

  it("should fail with notEmpty when only whitespace", () => {
    const schema = text({ notEmpty: true, trimMode: "none" })
    expect(schema.parse("hello")).toBe("hello")
    expect(() => schema.parse("   ")).toThrow(messages.notEmpty)
    expect(() => schema.parse("\t\n")).toThrow(messages.notEmpty)
  })
})

describe("text() trimMode functionality", () => {
  it("should trim by default", () => {
    const schema = text()
    expect(schema.parse("  hello  ")).toBe("hello")
  })

  it("should trim start only", () => {
    const schema = text({ trimMode: "trimStart" })
    expect(schema.parse("  hello  ")).toBe("hello  ")
  })

  it("should trim end only", () => {
    const schema = text({ trimMode: "trimEnd" })
    expect(schema.parse("  hello  ")).toBe("  hello")
  })

  it("should not trim when mode is none", () => {
    const schema = text({ trimMode: "none" })
    expect(schema.parse("  hello  ")).toBe("  hello  ")
  })
})

describe("text() casing functionality", () => {
  it("should convert to uppercase", () => {
    const schema = text({ casing: "upper" })
    expect(schema.parse("hello world")).toBe("HELLO WORLD")
  })

  it("should convert to lowercase", () => {
    const schema = text({ casing: "lower" })
    expect(schema.parse("HELLO WORLD")).toBe("hello world")
  })

  it("should convert to title case", () => {
    const schema = text({ casing: "title" })
    expect(schema.parse("hello world")).toBe("Hello World")
    expect(schema.parse("HELLO WORLD")).toBe("Hello World")
  })

  it("should not change casing when none", () => {
    const schema = text({ casing: "none" })
    expect(schema.parse("Hello World")).toBe("Hello World")
  })
})

describe("text() transform functionality", () => {
  it("should apply custom transform function", () => {
    const schema = text({
      transform: (val) => val.replace(/\s+/g, "-"),
    })
    expect(schema.parse("hello world test")).toBe("hello-world-test")
  })

  it("should apply transform after trimming and casing", () => {
    const schema = text({
      trimMode: "trim",
      casing: "lower",
      transform: (val) => val.replace(/\s+/g, "_"),
    })
    expect(schema.parse("  HELLO WORLD  ")).toBe("hello_world")
  })
})

describe("text() defaultValue functionality", () => {
  it("should use defaultValue for empty input when required", () => {
    const schema = text({ defaultValue: "default" })
    expect(schema.parse("")).toBe("default")
    expect(schema.parse(null)).toBe("default")
    expect(schema.parse(undefined)).toBe("default")
  })

  it("should use defaultValue for empty input when not required", () => {
    const schema = text({ required: false, defaultValue: "default" })
    expect(schema.parse("")).toBe("default")
    expect(schema.parse(null)).toBe("default")
    expect(schema.parse(undefined)).toBe("default")
  })
})

describe("text() custom i18n messages", () => {
  beforeEach(() => setLocale("en"))

  it("should use custom messages when provided", () => {
    const schema = text({
      minLength: 5,
      i18n: {
        en: {
          required: "Custom required message",
          minLength: "Custom min message: at least ${minLength} chars",
        },
        "zh-TW": {
          required: "客製化必填訊息",
          minLength: "客製化最小長度: 至少 ${minLength} 字元",
        },
      },
    })

    expect(() => schema.parse("")).toThrow("Custom required message")
    expect(() => schema.parse("hi")).toThrow("Custom min message: at least 5 chars")
  })

  it("should fallback to default messages when custom not provided", () => {
    const schema = text({
      maxLength: 3,
      i18n: {
        en: {
          required: "Custom required message",
        },
        "zh-TW": {
          required: "客製化必填訊息",
        },
      },
    })

    expect(() => schema.parse("")).toThrow("Custom required message")
    expect(() => schema.parse("hello")).toThrow("Must be at most 3 characters")
  })

  it("should use correct locale for custom messages", () => {
    const schema = text({
      i18n: {
        en: {
          required: "English required",
        },
        "zh-TW": {
          required: "繁體中文必填",
        },
      },
    })

    setLocale("en")
    expect(() => schema.parse("")).toThrow("English required")

    setLocale("zh-TW")
    expect(() => schema.parse("")).toThrow("繁體中文必填")
  })
})

describe("text() complex scenarios", () => {
  beforeEach(() => setLocale("en")) // Ensure a consistent locale for this test

  it("should work with multiple validations", () => {
    const schema = text({
      minLength: 5,
      maxLength: 20,
      startsWith: "user_",
      includes: "test",
      excludes: ["admin", "root"],
      casing: "lower",
      trimMode: "trim",
    })

    expect(schema.parse("  USER_TEST123  ")).toBe("user_test123")
    expect(() => schema.parse("user")).toThrow("Must be at least 5 characters")
    expect(() => schema.parse("user_admin_test")).toThrow("Must not contain admin")
    expect(() => schema.parse("test123")).toThrow("Must start with user_")
  })

  it("should handle null values correctly when not required", () => {
    const schema = text({
      required: false,
      minLength: 5,
      includes: "test",
    })

    expect(schema.parse(null)).toBe(null)
    expect(schema.parse("")).toBe(null)
    expect(schema.parse(undefined)).toBe(null)
    expect(schema.parse("test12345")).toBe("test12345")
  })
})
