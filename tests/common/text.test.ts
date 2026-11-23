import { describe, expect, expectTypeOf, it, beforeEach } from "vitest"
import { z } from "zod"
import { Locale, setLocale, text } from "../../src"
import enUS from "../../src/i18n/locales/en-US.json"
import enGB from "../../src/i18n/locales/en-GB.json"
import zhTW from "../../src/i18n/locales/zh-TW.json"
import zhCN from "../../src/i18n/locales/zh-CN.json"
import jaJP from "../../src/i18n/locales/ja-JP.json"
import koKR from "../../src/i18n/locales/ko-KR.json"
import msMY from "../../src/i18n/locales/ms-MY.json"
import idID from "../../src/i18n/locales/id-ID.json"
import thTH from "../../src/i18n/locales/th-TH.json"
import viVN from "../../src/i18n/locales/vi-VN.json"

const locales = [
  {
    locale: "en-US",
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

describe.each(locales)("text(true) locale: $locale", ({ locale, messages }) => {
  beforeEach(() => setLocale(locale as Locale))

  it("should pass with valid string", () => {
    const schema = text(true)
    expect(schema.parse("hello")).toBe("hello")
  })

  it("should fail with empty string when required", () => {
    const schema = text(true)
    expect(() => schema.parse("")).toThrow(messages.required)
    expect(() => schema.parse(null)).toThrow(messages.required)
    expect(() => schema.parse(undefined)).toThrow(messages.required)
  })

  it("should pass with null when not required", () => {
    const schema = text(false)
    expect(schema.parse("")).toBe(null)
    expect(schema.parse(null)).toBe(null)
    expect(schema.parse(undefined)).toBe(null)
  })

  it("should fail with string shorter than minLength", () => {
    const schema = text(true, { minLength: 5 })
    expect(() => schema.parse("hi")).toThrow(messages.minLength)
    expect(() => schema.parse("")).toThrow(messages.required) // Empty string triggers required first
    expect(() => schema.parse(null)).toThrow(messages.required) // Null triggers required first
    expect(() => schema.parse(undefined)).toThrow(messages.required) // Undefined triggers required first
  })

  it("should fail with string longer than maxLength", () => {
    const schema = text(true, { maxLength: 5 })
    expect(() => schema.parse("hello world")).toThrow(messages.maxLength)
  })

  it("should fail if does not start with specified string", () => {
    const schema = text(true, { startsWith: "pre" })
    expect(schema.parse("prepaid")).toBe("prepaid")
    expect(() => schema.parse("hello world")).toThrow(messages.startsWith)
  })

  it("should fail if does not end with specified string", () => {
    const schema = text(true, { endsWith: "xyz" })
    expect(schema.parse("hello xyz")).toBe("hello xyz")
    expect(() => schema.parse("hello world")).toThrow(messages.endsWith)
  })

  it("should fail if does not include specified substring", () => {
    const schema = text(true, { includes: "foo" })
    expect(schema.parse("hello foo")).toBe("hello foo")
    expect(() => schema.parse("hello world")).toThrow(messages.includes)
  })

  it("should fail if does not match regex", () => {
    const schema = text(true, { regex: /^[A-Z]+$/ })
    expect(schema.parse("HELLO")).toBe("HELLO")
    expect(() => schema.parse("hello")).toThrow(messages.invalid)
  })

  it("should fail if contains excluded substring", () => {
    const schema = text(true, { excludes: "admin" })
    expect(schema.parse("hello")).toBe("hello")
    expect(() => schema.parse("admin user")).toThrow(messages.excludes)
  })

  it("should fail if contains any excluded substring from array", () => {
    const schema = text(true, { excludes: ["admin", "root", "test"] })
    expect(schema.parse("hello")).toBe("hello")
    expect(() => schema.parse("admin user")).toThrow(/Must not contain|不得包含/)
    expect(() => schema.parse("root access")).toThrow(/Must not contain|不得包含/)
    expect(() => schema.parse("test mode")).toThrow(/Must not contain|不得包含/)
  })

  it("should fail with notEmpty when only whitespace", () => {
    const schema = text(true, { notEmpty: true, trimMode: "none" })
    expect(schema.parse("hello")).toBe("hello")
    expect(() => schema.parse("   ")).toThrow(messages.notEmpty)
    expect(() => schema.parse("\t\n")).toThrow(messages.notEmpty)
  })
})

describe("text(true) trimMode functionality", () => {
  it("should trim by default", () => {
    const schema = text(true)
    expect(schema.parse("  hello  ")).toBe("hello")
  })

  it("should trim start only", () => {
    const schema = text(true, { trimMode: "trimStart" })
    expect(schema.parse("  hello  ")).toBe("hello  ")
  })

  it("should trim end only", () => {
    const schema = text(true, { trimMode: "trimEnd" })
    expect(schema.parse("  hello  ")).toBe("  hello")
  })

  it("should not trim when mode is none", () => {
    const schema = text(true, { trimMode: "none" })
    expect(schema.parse("  hello  ")).toBe("  hello  ")
  })
})

describe("text(true) casing functionality", () => {
  it("should convert to uppercase", () => {
    const schema = text(true, { casing: "upper" })
    expect(schema.parse("hello world")).toBe("HELLO WORLD")
  })

  it("should convert to lowercase", () => {
    const schema = text(true, { casing: "lower" })
    expect(schema.parse("HELLO WORLD")).toBe("hello world")
  })

  it("should convert to title case", () => {
    const schema = text(true, { casing: "title" })
    expect(schema.parse("hello world")).toBe("Hello World")
    expect(schema.parse("HELLO WORLD")).toBe("Hello World")
  })

  it("should not change casing when none", () => {
    const schema = text(true, { casing: "none" })
    expect(schema.parse("Hello World")).toBe("Hello World")
  })
})

describe("text(true) transform functionality", () => {
  it("should apply custom transform function", () => {
    const schema = text(true, {
      transform: (val) => val.replace(/\s+/g, "-"),
    })
    expect(schema.parse("hello world test")).toBe("hello-world-test")
  })

  it("should apply transform after trimming and casing", () => {
    const schema = text(true, {
      trimMode: "trim",
      casing: "lower",
      transform: (val) => val.replace(/\s+/g, "_"),
    })
    expect(schema.parse("  HELLO WORLD  ")).toBe("hello_world")
  })
})

describe("text(true) defaultValue functionality", () => {
  it("should use defaultValue for empty input when required", () => {
    const schema = text(true, { defaultValue: "default" })
    expect(schema.parse("")).toBe("default")
    expect(schema.parse(null)).toBe("default")
    expect(schema.parse(undefined)).toBe("default")
  })

  it("should use defaultValue for empty input when not required", () => {
    const schema = text(false, { defaultValue: "default" })
    expect(schema.parse("")).toBe("default")
    expect(schema.parse(null)).toBe("default")
    expect(schema.parse(undefined)).toBe("default")
  })
})

describe("text(true) custom i18n messages", () => {
  beforeEach(() => setLocale("en-US"))

  it("should use custom messages when provided", () => {
    const schema = text(true, {
      minLength: 5,
      i18n: {
        "en-US": {
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
    const schema = text(true, {
      maxLength: 3,
      i18n: {
        "en-US": {
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
    const schema = text(true, {
      i18n: {
        "en-US": {
          required: "English required",
        },
        "zh-TW": {
          required: "繁體中文必填",
        },
      },
    })

    setLocale("en-US")
    expect(() => schema.parse("")).toThrow("English required")

    setLocale("zh-TW")
    expect(() => schema.parse("")).toThrow("繁體中文必填")
  })
})

describe("text(true) complex scenarios", () => {
  beforeEach(() => setLocale("en-US")) // Ensure a consistent locale for this test

  it("should work with multiple validations", () => {
    const schema = text(true, {
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
    const schema = text(false, {
      minLength: 5,
      includes: "test",
    })

    expect(schema.parse(null)).toBe(null)
    expect(schema.parse("")).toBe(null)
    expect(schema.parse(undefined)).toBe(null)
    expect(schema.parse("test12345")).toBe("test12345")
  })
})

describe("text() default behavior is unchanged", () => {
  beforeEach(() => setLocale("en-US"))

  it("should keep whitespace-only optional input as empty string after trim (no whitespaceAsEmpty)", () => {
    const schema = text(false)
    expect(schema.parse("   ")).toBe("")
    expect(schema.parse("")).toBe(null)
  })

  it("should report required for whitespace-only required input after trim", () => {
    const schema = text(true)
    expect(() => schema.parse("   ")).toThrow("Required")
  })

  it("should still coerce non-string input with String() when not strict", () => {
    const schema = text(true)
    expect(schema.parse(123)).toBe("123")
    expect(schema.parse(true)).toBe("true")
  })
})

describe("text() strict option", () => {
  beforeEach(() => setLocale("en-US"))

  it("should reject non-string input", () => {
    const schema = text(true, { strict: true })
    expect(() => schema.parse(123)).toThrow("Must be a string")
    expect(() => schema.parse(true)).toThrow("Must be a string")
    expect(() => schema.parse(new Date())).toThrow("Must be a string")
    expect(() => schema.parse({})).toThrow("Must be a string")
    expect(() => schema.parse([])).toThrow("Must be a string")
  })

  it("should reject non-string input when optional", () => {
    const schema = text(false, { strict: true })
    expect(() => schema.parse(0)).toThrow("Must be a string")
    expect(() => schema.parse(false)).toThrow("Must be a string")
  })

  it("should still accept strings and apply processing", () => {
    const schema = text(true, { strict: true, casing: "upper" })
    expect(schema.parse("  abc  ")).toBe("ABC")
  })

  it("should keep empty-value logic for null / undefined / empty string", () => {
    const required = text(true, { strict: true })
    expect(() => required.parse(null)).toThrow("Required")
    expect(() => required.parse(undefined)).toThrow("Required")
    expect(() => required.parse("")).toThrow("Required")

    const optional = text(false, { strict: true })
    expect(optional.parse(null)).toBe(null)
    expect(optional.parse(undefined)).toBe(null)
    expect(optional.parse("")).toBe(null)
  })

  it("should translate the notString message", () => {
    const schema = text(true, { strict: true })
    setLocale("zh-TW")
    expect(() => schema.parse(1)).toThrow("必須為文字")
    setLocale("ja-JP")
    expect(() => schema.parse(1)).toThrow("文字列である必要があります")
  })

  it("should support custom notString message", () => {
    const schema = text(true, { strict: true, i18n: { "en-US": { notString: "Text only" } } })
    expect(() => schema.parse(1)).toThrow("Text only")
  })
})

describe("text() whitespaceAsEmpty option", () => {
  beforeEach(() => setLocale("en-US"))

  it("should output null for whitespace-only optional input (default trim)", () => {
    const schema = text(false, { whitespaceAsEmpty: true })
    expect(schema.parse("   ")).toBe(null)
    expect(schema.parse("")).toBe(null)
    expect(schema.parse(" a ")).toBe("a")
  })

  it("should output null for whitespace-only optional input with trimMode none", () => {
    const schema = text(false, { whitespaceAsEmpty: true, trimMode: "none" })
    expect(schema.parse("   ")).toBe(null)
    expect(schema.parse("\t\n")).toBe(null)
    expect(schema.parse(" a ")).toBe(" a ")
  })

  it("should work with trimStart / trimEnd", () => {
    expect(text(false, { whitespaceAsEmpty: true, trimMode: "trimStart" }).parse("  ")).toBe(null)
    expect(text(false, { whitespaceAsEmpty: true, trimMode: "trimEnd" }).parse("  ")).toBe(null)
  })

  it("should use defaultValue for whitespace-only input", () => {
    const schema = text(false, { whitespaceAsEmpty: true, trimMode: "none", defaultValue: "" })
    expect(schema.parse("   ")).toBe("")
  })

  it("should report required instead of notEmpty when required", () => {
    const schema = text(true, { notEmpty: true, whitespaceAsEmpty: true, trimMode: "none" })
    expect(() => schema.parse("   ")).toThrow("Required")
    expect(() => schema.parse("   ")).not.toThrow("Cannot be empty or whitespace only")
    expect(schema.parse(" a ")).toBe(" a ")
  })

  it("should report required for whitespace-only required input with default trim", () => {
    const schema = text(true, { notEmpty: true, whitespaceAsEmpty: true })
    expect(() => schema.parse("   ")).toThrow("Required")
  })

  it("should output null for optional notEmpty whitespace-only input", () => {
    const schema = text(false, { notEmpty: true, whitespaceAsEmpty: true, trimMode: "none" })
    expect(schema.parse("   ")).toBe(null)
  })

  it("should keep reporting notEmpty when whitespaceAsEmpty is off", () => {
    const schema = text(false, { notEmpty: true, trimMode: "none" })
    expect(() => schema.parse("   ")).toThrow("Cannot be empty or whitespace only")
  })
})

describe("text() non-strict keeps Zod default type error", () => {
  beforeEach(() => setLocale("en-US"))

  const zodDefault = z.string().safeParse(1)

  it("should report Zod's default invalid_type message when transform returns a non-string", () => {
    const result = text(true, { transform: () => 1 as any }).safeParse("a")
    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
    expect(result.error?.issues[0].code).toBe("invalid_type")
    expect(result.error?.issues[0].message).toBe(zodDefault.error?.issues[0].message)
    expect(result.error?.issues[0].message).toBe("Invalid input: expected string, received number")
    expect(result.error?.issues[0].message).not.toBe(enUS.common.text.notString)
  })

  it("should report Zod's default invalid_type message when defaultValue is a non-string", () => {
    const required = text(true, { defaultValue: 1 as any }).safeParse(null)
    expect(required.success).toBe(false)
    expect(required.error?.issues[0].code).toBe("invalid_type")
    expect(required.error?.issues[0].message).toBe("Invalid input: expected string, received number")

    const optional = text(false, { defaultValue: 1 as any }).safeParse("")
    expect(optional.success).toBe(false)
    expect(optional.error?.issues[0].code).toBe("invalid_type")
    expect(optional.error?.issues[0].message).not.toBe(enUS.common.text.notString)
  })

  it("should not use the notString message in other locales either", () => {
    setLocale("zh-TW")
    const result = text(true, { transform: () => 1 as any }).safeParse("a")
    expect(result.error?.issues[0].message).toBe("Invalid input: expected string, received number")
  })
})

describe.each([
  { locale: "en-US", file: enUS },
  { locale: "en-GB", file: enGB },
  { locale: "zh-TW", file: zhTW },
  { locale: "zh-CN", file: zhCN },
  { locale: "ja-JP", file: jaJP },
  { locale: "ko-KR", file: koKR },
  { locale: "ms-MY", file: msMY },
  { locale: "id-ID", file: idID },
  { locale: "th-TH", file: thTH },
  { locale: "vi-VN", file: viVN },
])("text() strict notString locale: $locale", ({ locale, file }) => {
  beforeEach(() => setLocale(locale as Locale))

  it("should use the locale's notString message", () => {
    const expected = file.common.text.notString
    expect(typeof expected).toBe("string")
    expect(expected.length).toBeGreaterThan(0)
    const result = text(true, { strict: true }).safeParse(1)
    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
    expect(result.error?.issues[0].code).toBe("invalid_type")
    expect(result.error?.issues[0].message).toBe(expected)
  })
})

describe("text() whitespaceAsEmpty combinations", () => {
  beforeEach(() => setLocale("en-US"))

  it("should fall back to defaultValue for whitespace-only required input", () => {
    expect(text(true, { whitespaceAsEmpty: true, defaultValue: "x" }).parse("   ")).toBe("x")
  })

  it("should skip minLength for whitespace-only optional input", () => {
    expect(text(false, { whitespaceAsEmpty: true, minLength: 3 }).parse("  ")).toBe(null)
  })

  it("should skip regex and startsWith for whitespace-only optional input", () => {
    expect(text(false, { whitespaceAsEmpty: true, regex: /^[a-z]+$/ }).parse("  ")).toBe(null)
    expect(text(false, { whitespaceAsEmpty: true, startsWith: "pre" }).parse("  ")).toBe(null)
    expect(text(false, { whitespaceAsEmpty: true, trimMode: "none", regex: /^[a-z]+$/, startsWith: "pre" }).parse(" \t ")).toBe(null)
  })

  it("should skip transform for whitespace-only input", () => {
    expect(text(false, { whitespaceAsEmpty: true, transform: (v) => v + "X" }).parse("  ")).toBe(null)
    expect(text(false, { transform: (v) => v + "X" }).parse("  ")).toBe("X")
  })

  it("should skip casing for whitespace-only input", () => {
    expect(text(false, { whitespaceAsEmpty: true, casing: "upper" }).parse("  ")).toBe(null)
    expect(text(false, { whitespaceAsEmpty: true, casing: "title", trimMode: "none" }).parse("   ")).toBe(null)
    expect(text(false, { whitespaceAsEmpty: true, casing: "upper" }).parse(" ab ")).toBe("AB")
  })

  it("should treat full-width space (U+3000) as whitespace", () => {
    const fullWidth = "\u3000"
    // String.prototype.trim() strips U+3000, so it is whitespace-only input
    expect(text(false, { whitespaceAsEmpty: true }).parse(fullWidth)).toBe(null)
    expect(text(false, { whitespaceAsEmpty: true, trimMode: "none" }).parse(fullWidth + " " + fullWidth)).toBe(null)
    expect(() => text(true, { whitespaceAsEmpty: true, trimMode: "none" }).parse(fullWidth)).toThrow("Required")
    expect(text(false, { whitespaceAsEmpty: true }).parse(fullWidth + "a" + fullWidth)).toBe("a")
    // Without whitespaceAsEmpty the default trim also strips it
    expect(text(false).parse(fullWidth)).toBe("")
    expect(text(false, { trimMode: "none" }).parse(fullWidth)).toBe(fullWidth)
  })

  it("should report the zh-TW required message", () => {
    setLocale("zh-TW")
    const result = text(true, { whitespaceAsEmpty: true, trimMode: "none" }).safeParse("   ")
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe(zhTW.common.text.required)
    expect(result.error?.issues[0].message).toBe("必填")
  })
})

describe("text() strict combinations", () => {
  beforeEach(() => setLocale("en-US"))

  it("should not fall back to defaultValue for non-string input", () => {
    const result = text(false, { strict: true, defaultValue: "d" }).safeParse(5)
    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
    expect(result.error?.issues[0].message).toBe(enUS.common.text.notString)
  })

  it("should report notString for non-string input even with transform", () => {
    let called = false
    const schema = text(true, {
      strict: true,
      transform: (v) => {
        called = true
        return v + "X"
      },
    })
    const result = schema.safeParse(5)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe(enUS.common.text.notString)
    expect(called).toBe(false)
    expect(schema.parse("a")).toBe("aX")
  })

  it("should report notString when transform returns a non-string in strict mode", () => {
    const result = text(true, { strict: true, transform: () => 1 as any }).safeParse("a")
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe(enUS.common.text.notString)
  })

  it("should report required for whitespace-only input with whitespaceAsEmpty and trimMode none", () => {
    const result = text(true, { strict: true, whitespaceAsEmpty: true, trimMode: "none" }).safeParse("  ")
    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
    expect(result.error?.issues[0].message).toBe("Required")
  })

  it("should keep the field path inside z.object", () => {
    const result = z.object({ n: text(true, { strict: true }) }).safeParse({ n: 1 })
    expect(result.success).toBe(false)
    expect(result.error?.issues).toHaveLength(1)
    expect(result.error?.issues[0].path).toEqual(["n"])
    expect(result.error?.issues[0].message).toBe(enUS.common.text.notString)
  })

  it("should fall back to the built-in notString when the custom message is only set for another locale", () => {
    const schema = text(true, { strict: true, i18n: { "zh-TW": { notString: "只能是文字" } } })
    expect(schema.safeParse(1).error?.issues[0].message).toBe(enUS.common.text.notString)
    setLocale("ja-JP")
    expect(schema.safeParse(1).error?.issues[0].message).toBe(jaJP.common.text.notString)
    setLocale("zh-TW")
    expect(schema.safeParse(1).error?.issues[0].message).toBe("只能是文字")
  })
})

describe("text() type inference", () => {
  it("should infer input / output types", () => {
    const required = text(true)
    const optional = text(false)
    expectTypeOf<z.output<typeof required>>().toEqualTypeOf<string>()
    expectTypeOf<z.output<typeof optional>>().toEqualTypeOf<string | null>()
    expectTypeOf<z.input<typeof required>>().toEqualTypeOf<string | null | undefined>()
    expectTypeOf<z.input<typeof optional>>().toEqualTypeOf<string | null | undefined>()
  })
})
