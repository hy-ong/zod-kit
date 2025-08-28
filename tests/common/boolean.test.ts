import { describe, it, expect, beforeEach } from "vitest"
import { boolean, setLocale } from "../../src"

describe("boolean", () => {
  describe("required (default)", () => {
    it("should validate true values", () => {
      const schema = boolean()
      expect(schema.parse(true)).toBe(true)
      expect(schema.parse("true")).toBe(true)
      expect(schema.parse(1)).toBe(true)
      expect(schema.parse("1")).toBe(true)
      expect(schema.parse("yes")).toBe(true)
      expect(schema.parse("on")).toBe(true)
    })

    it("should validate false values", () => {
      const schema = boolean()
      expect(schema.parse(false)).toBe(false)
      expect(schema.parse("false")).toBe(false)
      expect(schema.parse(0)).toBe(false)
      expect(schema.parse("0")).toBe(false)
      expect(schema.parse("no")).toBe(false)
      expect(schema.parse("off")).toBe(false)
    })

    it("should reject empty string", () => {
      const schema = boolean()
      expect(() => schema.parse("")).toThrow()
    })

    it("should reject null", () => {
      const schema = boolean()
      expect(() => schema.parse(null)).toThrow()
    })

    it("should reject undefined", () => {
      const schema = boolean()
      expect(() => schema.parse(undefined)).toThrow()
    })

    it("should reject invalid values", () => {
      const schema = boolean()
      expect(() => schema.parse("invalid")).toThrow()
      expect(() => schema.parse({})).toThrow()
      expect(() => schema.parse([])).toThrow()
      expect(() => schema.parse(2)).toThrow()
    })
  })

  describe("optional", () => {
    it("should allow null when not required", () => {
      const schema = boolean({ required: false })
      expect(schema.parse(null)).toBe(null)
    })

    it("should allow empty string when not required", () => {
      const schema = boolean({ required: false })
      expect(schema.parse("")).toBe(null)
    })

    it("should allow undefined when not required", () => {
      const schema = boolean({ required: false })
      expect(schema.parse(undefined)).toBe(null)
    })

    it("should validate true values when not required", () => {
      const schema = boolean({ required: false })
      expect(schema.parse(true)).toBe(true)
      expect(schema.parse("true")).toBe(true)
      expect(schema.parse(1)).toBe(true)
    })

    it("should validate false values when not required", () => {
      const schema = boolean({ required: false })
      expect(schema.parse(false)).toBe(false)
      expect(schema.parse("false")).toBe(false)
      expect(schema.parse(0)).toBe(false)
    })
  })

  describe("shouldBe validation", () => {
    it("should enforce true when shouldBe is true", () => {
      const schema = boolean({ shouldBe: true })
      expect(schema.parse(true)).toBe(true)
      expect(schema.parse("true")).toBe(true)
      expect(schema.parse(1)).toBe(true)
    })

    it("should reject false when shouldBe is true", () => {
      const schema = boolean({ shouldBe: true })
      expect(() => schema.parse(false)).toThrow()
      expect(() => schema.parse("false")).toThrow()
      expect(() => schema.parse(0)).toThrow()
    })

    it("should enforce false when shouldBe is false", () => {
      const schema = boolean({ shouldBe: false })
      expect(schema.parse(false)).toBe(false)
      expect(schema.parse("false")).toBe(false)
      expect(schema.parse(0)).toBe(false)
    })

    it("should reject true when shouldBe is false", () => {
      const schema = boolean({ shouldBe: false })
      expect(() => schema.parse(true)).toThrow()
      expect(() => schema.parse("true")).toThrow()
      expect(() => schema.parse(1)).toThrow()
    })
  })

  describe("default value", () => {
    it("should use default value true when input is empty", () => {
      const schema = boolean({ defaultValue: true })
      expect(schema.parse("")).toBe(true)
      expect(schema.parse(null)).toBe(true)
      expect(schema.parse(undefined)).toBe(true)
    })

    it("should use default value false when input is empty", () => {
      const schema = boolean({ defaultValue: false })
      expect(schema.parse("")).toBe(false)
      expect(schema.parse(null)).toBe(false)
      expect(schema.parse(undefined)).toBe(false)
    })

    it("should use default value when optional and input is empty", () => {
      const schema = boolean({ required: false, defaultValue: true })
      expect(schema.parse("")).toBe(true)
      expect(schema.parse(null)).toBe(true)
      expect(schema.parse(undefined)).toBe(true)
    })

    it("should override default value with provided input", () => {
      const schema = boolean({ defaultValue: true })
      expect(schema.parse(false)).toBe(false)
      expect(schema.parse("false")).toBe(false)
      expect(schema.parse(0)).toBe(false)
    })
  })

  describe("combined options", () => {
    it("should work with shouldBe and defaultValue", () => {
      const schema = boolean({ shouldBe: true, defaultValue: true })
      expect(schema.parse("")).toBe(true)
      expect(schema.parse(null)).toBe(true)
      expect(schema.parse(true)).toBe(true)
      expect(() => schema.parse(false)).toThrow()
    })

    it("should work with optional, shouldBe and defaultValue", () => {
      const schema = boolean({ required: false, shouldBe: false, defaultValue: false })
      expect(schema.parse("")).toBe(false)
      expect(schema.parse(null)).toBe(false)
      expect(schema.parse(false)).toBe(false)
      expect(() => schema.parse(true)).toThrow()
    })

    it("should fail validation when defaultValue conflicts with shouldBe", () => {
      const schema = boolean({ shouldBe: true, defaultValue: false })
      expect(() => schema.parse("")).toThrow()
      expect(() => schema.parse(null)).toThrow()
      expect(() => schema.parse(undefined)).toThrow()
    })
  })

  describe("edge cases", () => {
    it("should handle string numbers correctly", () => {
      const schema = boolean()
      expect(schema.parse("1")).toBe(true)
      expect(schema.parse("0")).toBe(false)
    })

    it("should handle exact boolean strings", () => {
      const schema = boolean()
      expect(schema.parse("true")).toBe(true)
      expect(schema.parse("false")).toBe(false)
    })

    it("should reject partial boolean strings", () => {
      const schema = boolean()
      expect(() => schema.parse("t")).toThrow()
      expect(() => schema.parse("f")).toThrow()
      expect(() => schema.parse("TRUE")).toThrow()
      expect(() => schema.parse("FALSE")).toThrow()
    })

    it("should reject numeric values other than 0 and 1", () => {
      const schema = boolean()
      expect(() => schema.parse(2)).toThrow()
      expect(() => schema.parse(-1)).toThrow()
      expect(() => schema.parse(0.5)).toThrow()
      expect(() => schema.parse(NaN)).toThrow()
      expect(() => schema.parse(Infinity)).toThrow()
    })

    it("should reject non-boolean objects", () => {
      const schema = boolean()
      expect(() => schema.parse({})).toThrow()
      expect(() => schema.parse([])).toThrow()
      expect(() => schema.parse(new Date())).toThrow()
      expect(() => schema.parse(/test/)).toThrow()
      expect(() => schema.parse(Symbol("test"))).toThrow()
      expect(() => schema.parse(() => true)).toThrow()
    })

    it("should handle complex scenarios", () => {
      const schema = boolean({ required: false, shouldBe: true, defaultValue: true })

      expect(schema.parse("")).toBe(true)
      expect(schema.parse(null)).toBe(true)
      expect(schema.parse(undefined)).toBe(true)
      expect(schema.parse(true)).toBe(true)
      expect(() => schema.parse(false)).toThrow()
      expect(() => schema.parse("invalid")).toThrow()
    })
  })

  describe("custom truthy/falsy values", () => {
    it("should accept custom truthy values", () => {
      const schema = boolean({
        truthyValues: ["Y", "YES", 1],
        falsyValues: ["N", "NO", 0],
      })

      expect(schema.parse("Y")).toBe(true)
      expect(schema.parse("YES")).toBe(true)
      expect(schema.parse(1)).toBe(true)
      expect(schema.parse("N")).toBe(false)
      expect(schema.parse("NO")).toBe(false)
      expect(schema.parse(0)).toBe(false)

      // Original values should now be invalid
      expect(() => schema.parse("yes")).toThrow()
      expect(() => schema.parse("true")).toThrow()
    })
  })

  describe("strict mode", () => {
    it("should only accept actual booleans in strict mode", () => {
      const schema = boolean({ strict: true })

      expect(schema.parse(true)).toBe(true)
      expect(schema.parse(false)).toBe(false)

      expect(() => schema.parse("true")).toThrow()
      expect(() => schema.parse("false")).toThrow()
      expect(() => schema.parse(1)).toThrow()
      expect(() => schema.parse(0)).toThrow()
      expect(() => schema.parse("yes")).toThrow()
    })

    it("should allow null when not required in strict mode", () => {
      const schema = boolean({ strict: true, required: false })

      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
      expect(schema.parse("")).toBe(null)
    })
  })

  describe("transform functionality", () => {
    it("should apply transform to boolean values", () => {
      const schema = boolean({
        transform: (val) => !val, // Invert the boolean
      })

      expect(schema.parse(true)).toBe(false)
      expect(schema.parse(false)).toBe(true)
      expect(schema.parse("yes")).toBe(false)
      expect(schema.parse("no")).toBe(true)
    })
  })

  describe("custom i18n messages", () => {
    beforeEach(() => setLocale("en"))

    it("should use custom messages when provided", () => {
      const schema = boolean({
        shouldBe: true,
        i18n: {
          en: {
            required: "Custom required message",
            shouldBeTrue: "Custom should be true message",
          },
          "zh-TW": {
            required: "客製化必填訊息",
            shouldBeTrue: "客製化必須為真訊息",
          },
        },
      })

      expect(() => schema.parse("")).toThrow("Custom required message")
      expect(() => schema.parse(false)).toThrow("Custom should be true message")
    })

    it("should fallback to default messages when custom not provided", () => {
      const schema = boolean({
        shouldBe: false,
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
      expect(() => schema.parse(true)).toThrow("Must be False")
    })

    it("should use correct locale for custom messages", () => {
      setLocale("en")
      const schemaEn = boolean({
        i18n: {
          en: {
            required: "English required",
          },
          "zh-TW": {
            required: "繁體中文必填",
          },
        },
      })
      expect(() => schemaEn.parse("")).toThrow("English required")

      setLocale("zh-TW")
      const schemaZh = boolean({
        i18n: {
          en: {
            required: "English required",
          },
          "zh-TW": {
            required: "繁體中文必填",
          },
        },
      })
      expect(() => schemaZh.parse("")).toThrow("繁體中文必填")
    })

    it("should work with strict mode (note: uses Zod's built-in error messages)", () => {
      const schema = boolean({ strict: true })

      expect(() => schema.parse("true")).toThrow() // Will throw Zod's union error
      expect(() => schema.parse(1)).toThrow() // Will throw Zod's union error
    })
  })

  describe("complex scenarios", () => {
    it("should work with multiple options", () => {
      const schema = boolean({
        truthyValues: ["YES", "Y"],
        falsyValues: ["NO", "N"],
        shouldBe: true,
        transform: (val) => val, // Identity transform
        defaultValue: true,
      })

      expect(schema.parse("")).toBe(true)
      expect(schema.parse("YES")).toBe(true)
      expect(schema.parse("Y")).toBe(true)
      expect(() => schema.parse("NO")).toThrow("Must be True")
      expect(() => schema.parse("N")).toThrow("Must be True")
    })
  })
})
