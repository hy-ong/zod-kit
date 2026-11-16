import { describe, it, expect, expectTypeOf, beforeEach } from "vitest"
import { z } from "zod"
import { number, setLocale } from "../../src"

describe("number(true) features", () => {
  beforeEach(() => setLocale("en-US"))

  describe("type validation", () => {
    it("should accept integers when type='integer'", () => {
      const schema = number(true, { type: "integer" })
      expect(schema.parse(42)).toBe(42)
      expect(schema.parse("123")).toBe(123)
    })

    it("should reject floats when type='integer'", () => {
      const schema = number(true, { type: "integer" })
      expect(() => schema.parse(3.14)).toThrow("Must be an integer")
      expect(() => schema.parse("3.14")).toThrow("Must be an integer")
    })

    it("should accept floats when type='float'", () => {
      const schema = number(true, { type: "float" })
      expect(schema.parse(3.14)).toBe(3.14)
      expect(schema.parse("3.14")).toBe(3.14)
    })

    it("should reject integers when type='float'", () => {
      const schema = number(true, { type: "float" })
      expect(() => schema.parse(42)).toThrow("Must be a decimal number")
      expect(() => schema.parse("42")).toThrow("Must be a decimal number")
    })

    it("should accept both when type='both' (default)", () => {
      const schema = number(true, { type: "both" })
      expect(schema.parse(42)).toBe(42)
      expect(schema.parse(3.14)).toBe(3.14)
    })
  })

  describe("sign validation", () => {
    it("should enforce positive numbers", () => {
      const schema = number(true, { positive: true })
      expect(schema.parse(5)).toBe(5)
      expect(() => schema.parse(0)).toThrow("Must be positive")
      expect(() => schema.parse(-5)).toThrow("Must be positive")
    })

    it("should enforce negative numbers", () => {
      const schema = number(true, { negative: true })
      expect(schema.parse(-5)).toBe(-5)
      expect(() => schema.parse(0)).toThrow("Must be negative")
      expect(() => schema.parse(5)).toThrow("Must be negative")
    })

    it("should enforce non-negative numbers", () => {
      const schema = number(true, { nonNegative: true })
      expect(schema.parse(0)).toBe(0)
      expect(schema.parse(5)).toBe(5)
      expect(() => schema.parse(-5)).toThrow("Must be non-negative")
    })

    it("should enforce non-positive numbers", () => {
      const schema = number(true, { nonPositive: true })
      expect(schema.parse(0)).toBe(0)
      expect(schema.parse(-5)).toBe(-5)
      expect(() => schema.parse(5)).toThrow("Must be non-positive")
    })
  })

  describe("multipleOf validation", () => {
    it("should enforce multiple of constraint", () => {
      const schema = number(true, { multipleOf: 5 })
      expect(schema.parse(0)).toBe(0)
      expect(schema.parse(5)).toBe(5)
      expect(schema.parse(10)).toBe(10)
      expect(schema.parse(-5)).toBe(-5)
      expect(() => schema.parse(3)).toThrow("Must be a multiple of 5")
      expect(() => schema.parse(7)).toThrow("Must be a multiple of 5")
    })
  })

  describe("precision validation", () => {
    it("should enforce decimal precision", () => {
      const schema = number(true, { precision: 2 })
      expect(schema.parse(3.14)).toBe(3.14)
      expect(schema.parse(3.1)).toBe(3.1)
      expect(schema.parse(3)).toBe(3)
      expect(() => schema.parse(3.141)).toThrow("Must have at most 2 decimal places")
      expect(() => schema.parse(3.1234)).toThrow("Must have at most 2 decimal places")
    })
  })

  describe("finite validation", () => {
    it("should reject infinite values by default", () => {
      const schema = number(true)
      expect(() => schema.parse(Infinity)).toThrow("Must be a finite number")
      expect(() => schema.parse(-Infinity)).toThrow("Must be a finite number")
    })

    it("should allow infinite values when finite=false", () => {
      const schema = number(true, { finite: false })
      expect(schema.parse(Infinity)).toBe(Infinity)
      expect(schema.parse(-Infinity)).toBe(-Infinity)
    })
  })

  describe("parseCommas functionality", () => {
    it("should parse comma-separated numbers", () => {
      const schema = number(true, { parseCommas: true })
      expect(schema.parse("1,234")).toBe(1234)
      expect(schema.parse("1,234.56")).toBe(1234.56)
      expect(schema.parse("12,345,678")).toBe(12345678)
    })

    it("should not parse commas by default", () => {
      const schema = number(true)
      expect(() => schema.parse("1,234")).toThrow("Must be a valid number")
    })
  })

  describe("transform functionality", () => {
    it("should apply transform function", () => {
      const schema = number(true, {
        transform: (val) => Math.round(val * 100) / 100, // Round to 2 decimals
      })
      expect(schema.parse(3.14159)).toBe(3.14)
      expect(schema.parse("2.71828")).toBe(2.72)
    })
  })

  describe("custom i18n messages", () => {
    it("should use custom messages when provided", () => {
      const schema = number(true, {
        type: "integer",
        min: 0,
        i18n: {
          "en-US": {
            required: "Custom required message",
            integer: "Custom integer message",
            min: "Custom min: at least ${min}",
          },
          "zh-TW": {
            required: "客製化必填訊息",
            integer: "客製化整數訊息",
            min: "客製化最小值: 至少 ${min}",
          },
        },
      })

      expect(() => schema.parse("")).toThrow("Custom required message")
      expect(() => schema.parse(3.14)).toThrow("Custom integer message")
      expect(() => schema.parse(-1)).toThrow("Custom min: at least 0")
    })

    it("should fallback to default messages when custom not provided", () => {
      const schema = number(true, {
        type: "integer",
        max: 10,
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
      expect(() => schema.parse(3.14)).toThrow("Must be an integer")
      expect(() => schema.parse(15)).toThrow("Must be at most 10")
    })

    it("should use correct locale for custom messages", () => {
      setLocale("en-US")
      const schemaEn = number(true, {
        type: "integer",
        i18n: {
          "en-US": {
            integer: "English integer message",
          },
          "zh-TW": {
            integer: "繁體中文整數訊息",
          },
        },
      })
      expect(() => schemaEn.parse(3.14)).toThrow("English integer message")

      setLocale("zh-TW")
      const schemaZh = number(true, {
        type: "integer",
        i18n: {
          "en-US": {
            integer: "English integer message",
          },
          "zh-TW": {
            integer: "繁體中文整數訊息",
          },
        },
      })
      expect(() => schemaZh.parse(3.14)).toThrow("繁體中文整數訊息")
    })
  })

  describe("complex scenarios", () => {
    it("should work with multiple validations", () => {
      const schema = number(true, {
        type: "integer",
        min: 1,
        max: 100,
        multipleOf: 5,
        positive: true,
      })

      expect(schema.parse(5)).toBe(5)
      expect(schema.parse(10)).toBe(10)
      expect(schema.parse(95)).toBe(95)

      expect(() => schema.parse(0)).toThrow("Must be positive")
      expect(() => schema.parse(3)).toThrow("Must be a multiple of 5")
      expect(() => schema.parse(105)).toThrow("Must be at most 100")
      expect(() => schema.parse(5.5)).toThrow("Must be an integer")
    })

    it("should handle null values correctly when not required", () => {
      const schema = number(false, {
        type: "integer",
        min: 0,
      })

      expect(schema.parse(null)).toBe(null)
      expect(schema.parse("")).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
      expect(schema.parse(5)).toBe(5)
    })

    it("should work with parseCommas and transform together", () => {
      const schema = number(true, {
        parseCommas: true,
        transform: (val) => Math.floor(val / 100) * 100, // Round down to nearest 100
      })

      expect(schema.parse("1,234")).toBe(1200)
      expect(schema.parse("5,678.90")).toBe(5600)
    })
  })
})

describe("number emptyValue option", () => {
  beforeEach(() => setLocale("en-US"))

  it("should default to null for empty input (backward compatible)", () => {
    const schema = number(false)
    expect(schema.parse("")).toBe(null)
    expect(schema.parse(null)).toBe(null)
    expect(schema.parse(undefined)).toBe(null)
  })

  it("should output null when emptyValue is null", () => {
    const schema = number(false, { emptyValue: null })
    expect(schema.parse("")).toBe(null)
    expect(schema.parse(null)).toBe(null)
    expect(schema.parse(undefined)).toBe(null)
    expect(schema.parse("5")).toBe(5)
  })

  it("should output undefined when emptyValue is undefined", () => {
    const schema = number(false, { emptyValue: undefined })
    expect(schema.parse("")).toBe(undefined)
    expect(schema.parse(null)).toBe(undefined)
    expect(schema.parse(undefined)).toBe(undefined)
    expect(schema.parse(5)).toBe(5)
  })

  it('should output "" when emptyValue is ""', () => {
    const schema = number(false, { emptyValue: "" })
    expect(schema.parse("")).toBe("")
    expect(schema.parse(null)).toBe("")
    expect(schema.parse(undefined)).toBe("")
    expect(schema.parse("1.5")).toBe(1.5)
  })

  it("should give defaultValue priority over emptyValue", () => {
    const schema = number(false, { emptyValue: undefined, defaultValue: 10 })
    expect(schema.parse("")).toBe(10)
    expect(schema.parse(undefined)).toBe(10)
    expect(schema.parse(3)).toBe(3)
  })

  it("should fall back to emptyValue when defaultValue is null", () => {
    const schema = number(false, { emptyValue: undefined, defaultValue: null })
    expect(schema.parse("")).toBe(undefined)
  })

  it("should skip other validations for empty values", () => {
    const schema = number(false, { emptyValue: undefined, min: 5, positive: true, type: "integer" })
    expect(schema.parse("")).toBe(undefined)
    expect(() => schema.parse(1)).toThrow("Must be at least 5")
  })

  it("should still report required for empty input when required", () => {
    for (const emptyValue of [null, undefined, ""] as const) {
      const schema = number(true, { emptyValue })
      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse(null)).toThrow("Required")
      expect(() => schema.parse(undefined)).toThrow("Required")
      expect(schema.parse(1)).toBe(1)
    }
  })

  it("should work inside z.object", () => {
    const schema = z.object({ amount: number(false, { emptyValue: undefined }) })
    expect(schema.parse({ amount: "" })).toEqual({ amount: undefined })
    expect(schema.parse({})).toEqual({})
    expect(schema.parse({ amount: "12" })).toEqual({ amount: 12 })
  })
})

describe("number whitespaceAsEmpty option", () => {
  beforeEach(() => setLocale("en-US"))

  it("should keep parsing whitespace-only strings as 0 by default (backward compatible)", () => {
    expect(number(false).parse("  ")).toBe(0)
    expect(number(true).parse("  ")).toBe(0)
  })

  it("should report required for whitespace-only strings when required", () => {
    const schema = number(true, { whitespaceAsEmpty: true })
    expect(() => schema.parse("  ")).toThrow("Required")
    expect(() => schema.parse("\t\n")).toThrow("Required")
    expect(schema.parse(" 12 ")).toBe(12)
  })

  it("should output emptyValue for whitespace-only strings when optional", () => {
    expect(number(false, { whitespaceAsEmpty: true }).parse("  ")).toBe(null)
    expect(number(false, { whitespaceAsEmpty: true, emptyValue: undefined }).parse("  ")).toBe(undefined)
    expect(number(false, { whitespaceAsEmpty: true, emptyValue: "" }).parse("  ")).toBe("")
  })

  it("should output defaultValue for whitespace-only strings when set", () => {
    expect(number(false, { whitespaceAsEmpty: true, defaultValue: 7 }).parse("   ")).toBe(7)
    expect(number(true, { whitespaceAsEmpty: true, defaultValue: 7 }).parse("   ")).toBe(7)
  })

  it("should not apply transform to whitespace-only strings", () => {
    const schema = number(false, { whitespaceAsEmpty: true, transform: (v) => v + 1 })
    expect(schema.parse("  ")).toBe(null)
    expect(schema.parse("1")).toBe(2)
  })
})

describe("number type inference", () => {
  it("should infer output types", () => {
    expectTypeOf<z.output<ReturnType<typeof number<true>>>>().toEqualTypeOf<number>()

    const optional = number(false)
    expectTypeOf<z.output<typeof optional>>().toEqualTypeOf<number | null>()

    const defaultOptional = number()
    expectTypeOf<z.output<typeof defaultOptional>>().toEqualTypeOf<number | null>()

    const required = number(true)
    expectTypeOf<z.output<typeof required>>().toEqualTypeOf<number>()

    const requiredUndefined = number(true, { emptyValue: undefined })
    expectTypeOf<z.output<typeof requiredUndefined>>().toEqualTypeOf<number>()

    const nullEmpty = number(false, { emptyValue: null })
    expectTypeOf<z.output<typeof nullEmpty>>().toEqualTypeOf<number | null>()

    const undefinedEmpty = number(false, { emptyValue: undefined })
    expectTypeOf<z.output<typeof undefinedEmpty>>().toEqualTypeOf<number | undefined>()

    const stringEmpty = number(false, { emptyValue: "" })
    expectTypeOf<z.output<typeof stringEmpty>>().toEqualTypeOf<number | "">()
  })

  it("should infer input types that accept preprocessed values", () => {
    const schema = number(false, { emptyValue: undefined })
    expectTypeOf<z.input<typeof schema>>().toEqualTypeOf<string | number | null | undefined>()
    expectTypeOf<z.input<ReturnType<typeof number<true>>>>().toEqualTypeOf<string | number | null | undefined>()

    const form = z.object({ amount: number(true) })
    expectTypeOf<{ amount: "" }>().toExtend<z.input<typeof form>>()
    expectTypeOf<z.output<typeof form>>().toEqualTypeOf<{ amount: number }>()
  })
})
