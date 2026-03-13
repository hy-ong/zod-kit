import { describe, it, expect, beforeEach } from "vitest"
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
