import { describe, it, expect, expectTypeOf, beforeEach } from "vitest"
import { z } from "zod"
import { oneOf, setLocale, Locale } from "../../src"

const locales = [
  {
    locale: "en-US",
    messages: {
      required: "Required",
      invalid: "Must be one of: admin, editor, viewer",
    },
  },
  {
    locale: "zh-TW",
    messages: {
      required: "必填",
      invalid: "必須為以下其中一個值：admin, editor, viewer",
    },
  },
] as const

const stringValues = ["admin", "editor", "viewer"] as const
const numericValues = [1, 2, 3, 4, 5] as const

describe.each(locales)("oneOf(true) locale: $locale", ({ locale, messages }) => {
  beforeEach(() => setLocale(locale as Locale))

  describe("basic functionality", () => {
    it("should accept valid values", () => {
      const schema = oneOf(true, { values: [...stringValues] })
      expect(schema.parse("admin")).toBe("admin")
      expect(schema.parse("editor")).toBe("editor")
      expect(schema.parse("viewer")).toBe("viewer")
    })

    it("should reject invalid values", () => {
      const schema = oneOf(true, { values: [...stringValues] })
      expect(() => schema.parse("hacker")).toThrow(messages.invalid)
      expect(() => schema.parse("superadmin")).toThrow(messages.invalid)
    })

    it("should fail with empty when required", () => {
      const schema = oneOf(true, { values: [...stringValues] })
      expect(() => schema.parse("")).toThrow(messages.required)
      expect(() => schema.parse(null)).toThrow(messages.required)
      expect(() => schema.parse(undefined)).toThrow(messages.required)
    })

    it("should pass with null when not required", () => {
      const schema = oneOf(false, { values: [...stringValues] })
      expect(schema.parse("")).toBe(null)
      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
    })
  })

  describe("numeric values", () => {
    it("should accept valid numeric values", () => {
      const schema = oneOf(true, { values: [...numericValues] })
      expect(schema.parse(1)).toBe(1)
      expect(schema.parse(3)).toBe(3)
      expect(schema.parse(5)).toBe(5)
    })

    it("should reject invalid numeric values", () => {
      const schema = oneOf(true, { values: [...numericValues] })
      expect(() => schema.parse(10)).toThrow()
      expect(() => schema.parse(0)).toThrow()
    })

    it("should coerce number strings to numbers", () => {
      const schema = oneOf(true, { values: [...numericValues] })
      expect(schema.parse("3")).toBe(3)
      expect(schema.parse("5")).toBe(5)
    })
  })

  describe("case sensitivity", () => {
    it("should be case sensitive by default", () => {
      const schema = oneOf(true, { values: [...stringValues] })
      expect(() => schema.parse("Admin")).toThrow()
      expect(() => schema.parse("EDITOR")).toThrow()
    })

    it("should match case-insensitively when configured", () => {
      const schema = oneOf(true, { values: [...stringValues], caseSensitive: false })
      expect(schema.parse("Admin")).toBe("admin")
      expect(schema.parse("EDITOR")).toBe("editor")
      expect(schema.parse("VIEWER")).toBe("viewer")
    })
  })

  describe("default value", () => {
    it("should use default value when input is empty", () => {
      const schema = oneOf(false, { values: [...stringValues], defaultValue: "viewer" })
      expect(schema.parse("")).toBe("viewer")
      expect(schema.parse(null)).toBe("viewer")
      expect(schema.parse(undefined)).toBe("viewer")
    })

    it("should use provided value over default", () => {
      const schema = oneOf(false, { values: [...stringValues], defaultValue: "viewer" })
      expect(schema.parse("admin")).toBe("admin")
    })
  })

  describe("transform", () => {
    it("should apply transform to valid values", () => {
      const schema = oneOf(true, {
        values: [...stringValues],
        transform: (val) => val.toUpperCase() as any,
      })
      expect(schema.parse("admin")).toBe("ADMIN")
      expect(schema.parse("editor")).toBe("EDITOR")
    })
  })

  describe("custom i18n", () => {
    it("should use custom messages when provided", () => {
      const schema = oneOf(true, {
        values: [...stringValues],
        i18n: {
          "en-US": { required: "Pick a role!", invalid: "Bad role!" },
          "zh-TW": { required: "請選擇角色！", invalid: "無效角色！" },
        },
      })

      if (locale === "en-US") {
        expect(() => schema.parse("")).toThrow("Pick a role!")
        expect(() => schema.parse("hacker")).toThrow("Bad role!")
      } else {
        expect(() => schema.parse("")).toThrow("請選擇角色！")
        expect(() => schema.parse("hacker")).toThrow("無效角色！")
      }
    })
  })
})

describe.each(locales)("oneOf directIssue option locale: $locale", ({ locale, messages }) => {
  beforeEach(() => setLocale(locale as Locale))

  it("should keep union issue structure by default", () => {
    const schema = oneOf(true, { values: [...stringValues] })
    const result = schema.safeParse("hacker")
    expect(result.success).toBe(false)
    expect(result.error!.issues[0].code).toBe("invalid_union")
  })

  it("should report invalid message as top-level issue for required schema", () => {
    const schema = oneOf(true, { values: [...stringValues], directIssue: true })
    const result = schema.safeParse("hacker")
    expect(result.success).toBe(false)
    expect(result.error!.issues).toHaveLength(1)
    expect(result.error!.issues[0].message).toBe(messages.invalid)
  })

  it("should report invalid message as top-level issue for optional schema", () => {
    const schema = oneOf(false, { values: [...stringValues], directIssue: true })
    const result = schema.safeParse("hacker")
    expect(result.success).toBe(false)
    expect(result.error!.issues[0].message).toBe(messages.invalid)
  })

  it("should report invalid message for non-string inputs", () => {
    const schema = oneOf(true, { values: [...stringValues], directIssue: true })
    expect(schema.safeParse(123).error!.issues[0].message).toBe(messages.invalid)
    expect(schema.safeParse({}).error!.issues[0].message).toBe(messages.invalid)
  })

  it("should accept valid values", () => {
    const schema = oneOf(true, { values: [...stringValues], directIssue: true })
    expect(schema.parse("admin")).toBe("admin")
  })

  it("should report required for empty values when required", () => {
    const schema = oneOf(true, { values: [...stringValues], directIssue: true })
    for (const input of ["", null, undefined]) {
      const result = schema.safeParse(input)
      expect(result.success).toBe(false)
      expect(result.error!.issues[0].message).toBe(messages.required)
    }
  })

  it("should report required for missing object key", () => {
    const schema = z.object({ role: oneOf(true, { values: [...stringValues], directIssue: true }) })
    const result = schema.safeParse({})
    expect(result.success).toBe(false)
    expect(result.error!.issues[0].message).toBe(messages.required)
    expect(result.error!.issues[0].path).toEqual(["role"])
  })

  it("should return null or default for empty values when optional", () => {
    const schema = oneOf(false, { values: [...stringValues], directIssue: true })
    expect(schema.parse("")).toBe(null)
    expect(schema.parse(null)).toBe(null)
    expect(schema.parse(undefined)).toBe(null)

    const withDefault = oneOf(false, { values: [...stringValues], defaultValue: "viewer", directIssue: true })
    expect(withDefault.parse("")).toBe("viewer")
    expect(withDefault.parse(null)).toBe("viewer")

    const requiredWithDefault = oneOf(true, { values: [...stringValues], defaultValue: "viewer", directIssue: true })
    expect(requiredWithDefault.parse(undefined)).toBe("viewer")
    expect(requiredWithDefault.safeParse("hacker").error!.issues[0].message).toBe(messages.invalid)
  })

  it("should handle numeric values and string coercion", () => {
    const schema = oneOf(true, { values: [...numericValues], directIssue: true })
    expect(schema.parse(3)).toBe(3)
    expect(schema.parse("3")).toBe(3)
    const result = schema.safeParse(10)
    expect(result.error!.issues[0].message).toBe(locale === "en-US" ? "Must be one of: 1, 2, 3, 4, 5" : "必須為以下其中一個值：1, 2, 3, 4, 5")
    expect(schema.safeParse("abc").error!.issues[0].message).toBe(locale === "en-US" ? "Must be one of: 1, 2, 3, 4, 5" : "必須為以下其中一個值：1, 2, 3, 4, 5")
  })

  it("should support caseSensitive and transform", () => {
    const schema = oneOf(true, { values: [...stringValues], caseSensitive: false, transform: (v) => v.toUpperCase() as any, directIssue: true })
    expect(schema.parse("ADMIN")).toBe("ADMIN")
    expect(schema.safeParse("nope").error!.issues[0].message).toBe(messages.invalid)
  })

  it("should use custom i18n messages", () => {
    const schema = oneOf(true, {
      values: [...stringValues],
      directIssue: true,
      i18n: {
        "en-US": { required: "Pick a role!", invalid: "Bad role!" },
        "zh-TW": { required: "請選擇角色！", invalid: "無效角色！" },
      },
    })
    expect(schema.safeParse("").error!.issues[0].message).toBe(locale === "en-US" ? "Pick a role!" : "請選擇角色！")
    expect(schema.safeParse("hacker").error!.issues[0].message).toBe(locale === "en-US" ? "Bad role!" : "無效角色！")
  })
})

describe("oneOf directIssue type inference", () => {
  it("should keep the same inferred types", () => {
    const req = oneOf(true, { values: ["a", "b"], directIssue: true })
    const opt = oneOf(false, { values: ["a", "b"], directIssue: true })
    expectTypeOf<z.output<typeof req>>().toEqualTypeOf<"a" | "b">()
    expectTypeOf<z.input<typeof req>>().toEqualTypeOf<"a" | "b">()
    expectTypeOf<z.output<typeof opt>>().toEqualTypeOf<"a" | "b" | null>()
    expectTypeOf<z.input<typeof opt>>().toEqualTypeOf<"a" | "b" | "" | null | undefined>()
  })
})

describe("oneOf directIssue edge cases", () => {
  beforeEach(() => setLocale("en-US"))

  it("should report the invalid message at top level for a single value", () => {
    const direct = oneOf(true, { values: ["only"], directIssue: true }).safeParse("x")
    expect(direct.success).toBe(false)
    expect(direct.error!.issues).toHaveLength(1)
    expect(direct.error!.issues[0].code).toBe("custom")
    expect(direct.error!.issues[0].message).toBe("Must be one of: only")
  })

  it("should keep the default (union) top-level issue for a single value without directIssue", () => {
    const fallback = oneOf(true, { values: ["only"] }).safeParse("x")
    expect(fallback.success).toBe(false)
    expect(fallback.error!.issues).toHaveLength(1)
    expect(fallback.error!.issues[0].code).toBe("invalid_union")
    expect(fallback.error!.issues[0].message).toBe("Invalid input")
  })

  it("should handle mixed string and number values", () => {
    const schema = oneOf(true, { values: ["a", 1], directIssue: true })
    expect(schema.parse("1")).toBe(1)
    expect(schema.parse("a")).toBe("a")
    // Same as the default path
    expect(oneOf(true, { values: ["a", 1] }).parse("1")).toBe(1)
    expect(oneOf(true, { values: ["a", 1] }).parse("a")).toBe("a")
  })

  it("should reject values with surrounding whitespace", () => {
    const direct = oneOf(true, { values: ["a"], directIssue: true }).safeParse(" a ")
    expect(direct.success).toBe(false)
    expect(direct.error!.issues[0].message).toBe("Must be one of: a")
    expect(oneOf(true, { values: ["a"] }).safeParse(" a ").success).toBe(false)
  })

  it("should match the default path for a missing optional key in z.object", () => {
    const direct = z.object({ r: oneOf(false, { values: ["a", "b"], directIssue: true }) }).safeParse({})
    const fallback = z.object({ r: oneOf(false, { values: ["a", "b"] }) }).safeParse({})

    // Pre-existing behavior (0.2.9): a missing key fails with nonoptional; directIssue must not change it
    expect(fallback.success).toBe(false)
    expect(fallback.error!.issues).toHaveLength(1)
    expect(fallback.error!.issues[0]).toMatchObject({ code: "invalid_type", expected: "nonoptional", path: ["r"] })

    expect(direct.success).toBe(fallback.success)
    expect(direct.error!.issues).toEqual(fallback.error!.issues)
  })
})
