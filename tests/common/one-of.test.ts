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

    // A missing optional key resolves to null on both paths (0.2.9–0.3.0 failed with "expected nonoptional")
    expect(fallback.success).toBe(true)
    expect(fallback.data).toEqual({ r: null })
    expect(direct.success).toBe(true)
    expect(direct.data).toEqual(fallback.data)
  })
})

const directIssueModes = [false, true] as const

describe.each(locales)("oneOf bug fixes (0.3.1) locale: $locale", ({ locale, messages }) => {
  beforeEach(() => setLocale(locale as Locale))

  const numInvalid = (vals: string) => (locale === "en-US" ? `Must be one of: ${vals}` : `必須為以下其中一個值：${vals}`)

  describe.each(directIssueModes)("directIssue: %s", (directIssue) => {
    describe("missing z.object key", () => {
      it("should resolve an optional field to null", () => {
        const result = z.object({ r: oneOf(false, { values: [...stringValues], directIssue }) }).safeParse({})
        expect(result.success).toBe(true)
        expect(result.data).toEqual({ r: null })
      })

      it("should resolve an optional numeric field to null", () => {
        const result = z.object({ r: oneOf(false, { values: [...numericValues], directIssue }) }).safeParse({})
        expect(result.success).toBe(true)
        expect(result.data).toEqual({ r: null })
      })

      it("should resolve to defaultValue when optional or required with a default", () => {
        expect(z.object({ r: oneOf(false, { values: [...stringValues], defaultValue: "viewer", directIssue }) }).parse({})).toEqual({ r: "viewer" })
        expect(z.object({ r: oneOf(true, { values: [...stringValues], defaultValue: "editor", directIssue }) }).parse({})).toEqual({ r: "editor" })
        expect(z.object({ r: oneOf(true, { values: [...numericValues], defaultValue: 2, directIssue }) }).parse({})).toEqual({ r: 2 })
      })

      it("should keep reporting required (not nonoptional) for a required field without default", () => {
        for (const values of [[...stringValues], [...numericValues]]) {
          const result = z.object({ r: oneOf(true, { values, directIssue }) }).safeParse({})
          expect(result.success).toBe(false)
          expect(result.error!.issues).toHaveLength(1)
          expect(result.error!.issues[0].path).toEqual(["r"])
          expect(result.error!.issues[0].message).toBe(messages.required)
          expect(result.error!.issues[0]).not.toMatchObject({ expected: "nonoptional" })
        }
      })

      it("should still validate a present key", () => {
        const schema = z.object({ r: oneOf(false, { values: [...stringValues], directIssue }) })
        expect(schema.parse({ r: "admin" })).toEqual({ r: "admin" })
        expect(schema.safeParse({ r: "hacker" }).success).toBe(false)
        expect(schema.parse({ r: undefined })).toEqual({ r: null })
      })
    })

    describe("caseSensitive: false with numeric values", () => {
      it("should accept number input", () => {
        const schema = oneOf(true, { values: [1, 2], caseSensitive: false, directIssue })
        expect(schema.parse(1)).toBe(1)
        expect(schema.parse(2)).toBe(2)
      })

      it("should coerce numeric strings to numbers", () => {
        const schema = oneOf(true, { values: [1, 2], caseSensitive: false, directIssue })
        expect(schema.parse("1")).toBe(1)
      })

      it("should reject numbers outside the list", () => {
        const result = oneOf(true, { values: [1, 2], caseSensitive: false, directIssue }).safeParse(3)
        expect(result.success).toBe(false)
        if (directIssue) expect(result.error!.issues[0].message).toBe(numInvalid("1, 2"))
      })

      it("should match strings case-insensitively and numbers exactly in mixed values", () => {
        const schema = oneOf(true, { values: ["Low", 1, 2], caseSensitive: false, directIssue })
        expect(schema.parse("LOW")).toBe("Low")
        expect(schema.parse("low")).toBe("Low")
        expect(schema.parse(1)).toBe(1)
        expect(schema.parse("2")).toBe(2)
        expect(schema.safeParse("high").success).toBe(false)
        expect(schema.safeParse(3).success).toBe(false)
      })

      it("should apply transform to number input", () => {
        const schema = oneOf(true, { values: [1, 2], caseSensitive: false, transform: (v) => (v === 1 ? 2 : 1), directIssue })
        expect(schema.parse(1)).toBe(2)
      })
    })

    describe("whitespace-only input with numeric values", () => {
      const expectInvalid = (result: { success: boolean; error?: { issues: { code: string; message: string }[] } }, vals: string) => {
        expect(result.success).toBe(false)
        expect(result.error!.issues).toHaveLength(1)
        if (directIssue) expect(result.error!.issues[0].message).toBe(numInvalid(vals))
        else expect(result.error!.issues[0].code).toBe("invalid_union")
      }

      it("should report invalid instead of coercing to 0", () => {
        for (const required of [true, false]) {
          const schema = oneOf(required, { values: [0, 1], directIssue })
          for (const input of [" ", "   ", "\t\n"]) expectInvalid(schema.safeParse(input), "0, 1")
        }
      })

      it("should not fall back to defaultValue", () => {
        expectInvalid(oneOf(false, { values: [0, 1], defaultValue: 1, directIssue }).safeParse(" "), "0, 1")
        expectInvalid(oneOf(true, { values: [0, 1], defaultValue: 1, directIssue }).safeParse(" "), "0, 1")
      })

      it("should report invalid in mixed values and with caseSensitive: false", () => {
        expectInvalid(oneOf(false, { values: ["a", 0], directIssue }).safeParse(" "), "a, 0")
        expectInvalid(oneOf(true, { values: [0, 1], caseSensitive: false, directIssue }).safeParse(" "), "0, 1")
      })

      it("should report invalid inside z.object", () => {
        const result = z.object({ r: oneOf(false, { values: [0, 1], directIssue }) }).safeParse({ r: " " })
        expect(result.success).toBe(false)
        expect(result.error!.issues[0].path).toEqual(["r"])
      })

      it("should still match a whitespace string that is itself an option", () => {
        expect(oneOf(true, { values: [" ", 1], directIssue }).parse(" ")).toBe(" ")
        expect(oneOf(true, { values: [" ", 1], directIssue }).parse("1")).toBe(1)
      })

      it("should treat an empty string as empty instead of coercing to 0", () => {
        expect(oneOf(false, { values: [0, 1], directIssue }).parse("")).toBe(null)
        expect(oneOf(false, { values: [0, 1], defaultValue: 1, directIssue }).parse("")).toBe(1)
        expect(oneOf(true, { values: [0, 1], defaultValue: 1, directIssue }).parse("")).toBe(1)
        const result = oneOf(true, { values: [0, 1], directIssue }).safeParse("")
        expect(result.success).toBe(false)
        expect(result.error!.issues[0].message).toBe(messages.required)
      })

      it("should still coerce numeric strings and accept 0", () => {
        const schema = oneOf(true, { values: [0, 1], directIssue })
        expect(schema.parse(0)).toBe(0)
        expect(schema.parse("0")).toBe(0)
        expect(schema.parse("1")).toBe(1)
      })

      it("should keep whitespace-only input invalid (not empty) for string-only values", () => {
        for (const required of [true, false]) {
          const result = oneOf(required, { values: [...stringValues], directIssue }).safeParse(" ")
          expect(result.success).toBe(false)
          if (directIssue) expect(result.error!.issues[0].message).toBe(messages.invalid)
          else expect(result.error!.issues[0].code).toBe("invalid_union")
        }
      })
    })
  })
})

describe("oneOf bug fixes (0.3.1) type inference", () => {
  it("should keep the same inferred types for both paths and option combinations", () => {
    for (const directIssue of [false, true]) {
      const req = oneOf(true, { values: ["a", "b"], directIssue })
      const opt = oneOf(false, { values: ["a", "b"], directIssue })
      const reqNum = oneOf(true, { values: [1, 2], caseSensitive: false, directIssue })
      const optNum = oneOf(false, { values: [0, 1], defaultValue: 1, directIssue })
      expectTypeOf<z.output<typeof req>>().toEqualTypeOf<"a" | "b">()
      expectTypeOf<z.input<typeof req>>().toEqualTypeOf<"a" | "b">()
      expectTypeOf<z.output<typeof opt>>().toEqualTypeOf<"a" | "b" | null>()
      expectTypeOf<z.input<typeof opt>>().toEqualTypeOf<"a" | "b" | "" | null | undefined>()
      expectTypeOf<z.output<typeof reqNum>>().toEqualTypeOf<1 | 2>()
      expectTypeOf<z.input<typeof reqNum>>().toEqualTypeOf<1 | 2>()
      expectTypeOf<z.output<typeof optNum>>().toEqualTypeOf<0 | 1 | null>()
      expectTypeOf<z.input<typeof optNum>>().toEqualTypeOf<0 | 1 | "" | null | undefined>()

      const obj = z.object({ r: opt, n: req })
      expectTypeOf<z.output<typeof obj>>().toEqualTypeOf<{ r: "a" | "b" | null; n: "a" | "b" }>()
      expectTypeOf<z.input<typeof obj>>().toEqualTypeOf<{ r: "a" | "b" | "" | null | undefined; n: "a" | "b" }>()
    }
  })
})
