import { describe, it, expect, expectTypeOf, beforeEach } from "vitest"
import { z } from "zod"
import { boolean, setLocale, type BooleanOptions, type BooleanEmptyValue } from "../../src"

describe("boolean", () => {
  describe("required (default)", () => {
    it("should validate true values", () => {
      const schema = boolean(true)
      expect(schema.parse(true)).toBe(true)
      expect(schema.parse("true")).toBe(true)
      expect(schema.parse(1)).toBe(true)
      expect(schema.parse("1")).toBe(true)
      expect(schema.parse("yes")).toBe(true)
      expect(schema.parse("on")).toBe(true)
    })

    it("should validate false values", () => {
      const schema = boolean(true)
      expect(schema.parse(false)).toBe(false)
      expect(schema.parse("false")).toBe(false)
      expect(schema.parse(0)).toBe(false)
      expect(schema.parse("0")).toBe(false)
      expect(schema.parse("no")).toBe(false)
      expect(schema.parse("off")).toBe(false)
    })

    it("should reject empty string", () => {
      const schema = boolean(true)
      expect(() => schema.parse("")).toThrow()
    })

    it("should reject null", () => {
      const schema = boolean(true)
      expect(() => schema.parse(null)).toThrow()
    })

    it("should reject undefined", () => {
      const schema = boolean(true)
      expect(() => schema.parse(undefined)).toThrow()
    })

    it("should reject invalid values", () => {
      const schema = boolean(true)
      expect(() => schema.parse("invalid")).toThrow()
      expect(() => schema.parse({})).toThrow()
      expect(() => schema.parse([])).toThrow()
      expect(() => schema.parse(2)).toThrow()
    })
  })

  describe("optional", () => {
    it("should allow null when not required", () => {
      const schema = boolean(false)
      expect(schema.parse(null)).toBe(null)
    })

    it("should allow empty string when not required", () => {
      const schema = boolean(false)
      expect(schema.parse("")).toBe(null)
    })

    it("should allow undefined when not required", () => {
      const schema = boolean(false)
      expect(schema.parse(undefined)).toBe(null)
    })

    it("should validate true values when not required", () => {
      const schema = boolean(false)
      expect(schema.parse(true)).toBe(true)
      expect(schema.parse("true")).toBe(true)
      expect(schema.parse(1)).toBe(true)
    })

    it("should validate false values when not required", () => {
      const schema = boolean(false)
      expect(schema.parse(false)).toBe(false)
      expect(schema.parse("false")).toBe(false)
      expect(schema.parse(0)).toBe(false)
    })
  })

  describe("shouldBe validation", () => {
    it("should enforce true when shouldBe is true", () => {
      const schema = boolean(true, { shouldBe: true })
      expect(schema.parse(true)).toBe(true)
      expect(schema.parse("true")).toBe(true)
      expect(schema.parse(1)).toBe(true)
    })

    it("should reject false when shouldBe is true", () => {
      const schema = boolean(true, { shouldBe: true })
      expect(() => schema.parse(false)).toThrow()
      expect(() => schema.parse("false")).toThrow()
      expect(() => schema.parse(0)).toThrow()
    })

    it("should enforce false when shouldBe is false", () => {
      const schema = boolean(true, { shouldBe: false })
      expect(schema.parse(false)).toBe(false)
      expect(schema.parse("false")).toBe(false)
      expect(schema.parse(0)).toBe(false)
    })

    it("should reject true when shouldBe is false", () => {
      const schema = boolean(true, { shouldBe: false })
      expect(() => schema.parse(true)).toThrow()
      expect(() => schema.parse("true")).toThrow()
      expect(() => schema.parse(1)).toThrow()
    })
  })

  describe("default value", () => {
    it("should use default value true when input is empty", () => {
      const schema = boolean(true, { defaultValue: true })
      expect(schema.parse("")).toBe(true)
      expect(schema.parse(null)).toBe(true)
      expect(schema.parse(undefined)).toBe(true)
    })

    it("should use default value false when input is empty", () => {
      const schema = boolean(true, { defaultValue: false })
      expect(schema.parse("")).toBe(false)
      expect(schema.parse(null)).toBe(false)
      expect(schema.parse(undefined)).toBe(false)
    })

    it("should use default value when optional and input is empty", () => {
      const schema = boolean(false, { defaultValue: true })
      expect(schema.parse("")).toBe(true)
      expect(schema.parse(null)).toBe(true)
      expect(schema.parse(undefined)).toBe(true)
    })

    it("should override default value with provided input", () => {
      const schema = boolean(true, { defaultValue: true })
      expect(schema.parse(false)).toBe(false)
      expect(schema.parse("false")).toBe(false)
      expect(schema.parse(0)).toBe(false)
    })
  })

  describe("combined options", () => {
    it("should work with shouldBe and defaultValue", () => {
      const schema = boolean(true, { shouldBe: true, defaultValue: true })
      expect(schema.parse("")).toBe(true)
      expect(schema.parse(null)).toBe(true)
      expect(schema.parse(true)).toBe(true)
      expect(() => schema.parse(false)).toThrow()
    })

    it("should work with optional, shouldBe and defaultValue", () => {
      const schema = boolean(false, { shouldBe: false, defaultValue: false })
      expect(schema.parse("")).toBe(false)
      expect(schema.parse(null)).toBe(false)
      expect(schema.parse(false)).toBe(false)
      expect(() => schema.parse(true)).toThrow()
    })

    it("should fail validation when defaultValue conflicts with shouldBe", () => {
      const schema = boolean(true, { shouldBe: true, defaultValue: false })
      expect(() => schema.parse("")).toThrow()
      expect(() => schema.parse(null)).toThrow()
      expect(() => schema.parse(undefined)).toThrow()
    })
  })

  describe("edge cases", () => {
    it("should handle string numbers correctly", () => {
      const schema = boolean(true)
      expect(schema.parse("1")).toBe(true)
      expect(schema.parse("0")).toBe(false)
    })

    it("should handle exact boolean strings", () => {
      const schema = boolean(true)
      expect(schema.parse("true")).toBe(true)
      expect(schema.parse("false")).toBe(false)
    })

    it("should reject partial boolean strings", () => {
      const schema = boolean(true)
      expect(() => schema.parse("t")).toThrow()
      expect(() => schema.parse("f")).toThrow()
      expect(() => schema.parse("TRUE")).toThrow()
      expect(() => schema.parse("FALSE")).toThrow()
    })

    it("should reject numeric values other than 0 and 1", () => {
      const schema = boolean(true)
      expect(() => schema.parse(2)).toThrow()
      expect(() => schema.parse(-1)).toThrow()
      expect(() => schema.parse(0.5)).toThrow()
      expect(() => schema.parse(NaN)).toThrow()
      expect(() => schema.parse(Infinity)).toThrow()
    })

    it("should reject non-boolean objects", () => {
      const schema = boolean(true)
      expect(() => schema.parse({})).toThrow()
      expect(() => schema.parse([])).toThrow()
      expect(() => schema.parse(new Date())).toThrow()
      expect(() => schema.parse(/test/)).toThrow()
      expect(() => schema.parse(Symbol("test"))).toThrow()
      expect(() => schema.parse(() => true)).toThrow()
    })

    it("should handle complex scenarios", () => {
      const schema = boolean(false, { shouldBe: true, defaultValue: true })

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
      const schema = boolean(true, {
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
      const schema = boolean(true, { strict: true })

      expect(schema.parse(true)).toBe(true)
      expect(schema.parse(false)).toBe(false)

      expect(() => schema.parse("true")).toThrow()
      expect(() => schema.parse("false")).toThrow()
      expect(() => schema.parse(1)).toThrow()
      expect(() => schema.parse(0)).toThrow()
      expect(() => schema.parse("yes")).toThrow()
    })

    it("should allow null when not required in strict mode", () => {
      const schema = boolean(false, { strict: true })

      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
      expect(schema.parse("")).toBe(null)
    })
  })

  describe("transform functionality", () => {
    it("should apply transform to boolean values", () => {
      const schema = boolean(true, {
        transform: (val) => !val, // Invert the boolean
      })

      expect(schema.parse(true)).toBe(false)
      expect(schema.parse(false)).toBe(true)
      expect(schema.parse("yes")).toBe(false)
      expect(schema.parse("no")).toBe(true)
    })
  })

  describe("custom i18n messages", () => {
    beforeEach(() => setLocale("en-US"))

    it("should use custom messages when provided", () => {
      const schema = boolean(true, {
        shouldBe: true,
        i18n: {
          "en-US": {
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
      const schema = boolean(true, {
        shouldBe: false,
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
      expect(() => schema.parse(true)).toThrow("Must be False")
    })

    it("should use correct locale for custom messages", () => {
      setLocale("en-US")
      const schemaEn = boolean(true, {
        i18n: {
          "en-US": {
            required: "English required",
          },
          "zh-TW": {
            required: "繁體中文必填",
          },
        },
      })
      expect(() => schemaEn.parse("")).toThrow("English required")

      setLocale("zh-TW")
      const schemaZh = boolean(true, {
        i18n: {
          "en-US": {
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
      const schema = boolean(true, { strict: true })

      expect(() => schema.parse("true")).toThrow() // Will throw Zod's union error
      expect(() => schema.parse(1)).toThrow() // Will throw Zod's union error
    })
  })

  describe("complex scenarios", () => {
    it("should work with multiple options", () => {
      const schema = boolean(true, {
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

describe("boolean emptyValue option", () => {
  beforeEach(() => setLocale("en-US"))

  it("should default to null for empty input (backward compatible)", () => {
    const schema = boolean(false)
    expect(schema.parse("")).toBe(null)
    expect(schema.parse(null)).toBe(null)
    expect(schema.parse(undefined)).toBe(null)
  })

  it("should output null when emptyValue is null", () => {
    const schema = boolean(false, { emptyValue: null })
    expect(schema.parse("")).toBe(null)
    expect(schema.parse(undefined)).toBe(null)
    expect(schema.parse("yes")).toBe(true)
  })

  it("should output undefined when emptyValue is undefined", () => {
    const schema = boolean(false, { emptyValue: undefined })
    expect(schema.parse("")).toBe(undefined)
    expect(schema.parse(null)).toBe(undefined)
    expect(schema.parse(undefined)).toBe(undefined)
    expect(schema.parse("false")).toBe(false)
  })

  it('should output "" when emptyValue is ""', () => {
    const schema = boolean(false, { emptyValue: "" })
    expect(schema.parse("")).toBe("")
    expect(schema.parse(null)).toBe("")
    expect(schema.parse(undefined)).toBe("")
    expect(schema.parse(1)).toBe(true)
  })

  it("should give defaultValue priority over emptyValue", () => {
    const schema = boolean(false, { emptyValue: undefined, defaultValue: false })
    expect(schema.parse("")).toBe(false)
    expect(schema.parse(undefined)).toBe(false)
  })

  it("should still report required for empty input when required", () => {
    for (const emptyValue of [null, undefined, ""] as const) {
      const schema = boolean(true, { emptyValue })
      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse(null)).toThrow("Required")
      expect(() => schema.parse(undefined)).toThrow("Required")
      expect(schema.parse(true)).toBe(true)
    }
  })

  it("should work with strict mode", () => {
    const schema = boolean(false, { strict: true, emptyValue: undefined })
    expect(schema.parse("")).toBe(undefined)
    expect(schema.parse(true)).toBe(true)
    expect(() => schema.parse("true")).toThrow()
  })

  it("should fail shouldBe for empty values (same as null)", () => {
    const schema = boolean(false, { shouldBe: true, emptyValue: undefined })
    expect(() => schema.parse("")).toThrow("Must be True")
    expect(boolean(false, { shouldBe: true }).safeParse("").success).toBe(false)
  })

  it("should work inside z.object", () => {
    const schema = z.object({ agree: boolean(false, { emptyValue: undefined }) })
    expect(schema.parse({ agree: "" })).toEqual({ agree: undefined })
    expect(schema.parse({ agree: "on" })).toEqual({ agree: true })
  })
})

describe("boolean type inference", () => {
  it("should infer output types", () => {
    const optional = boolean(false)
    expectTypeOf<z.output<typeof optional>>().toEqualTypeOf<boolean | null>()

    const defaultOptional = boolean()
    expectTypeOf<z.output<typeof defaultOptional>>().toEqualTypeOf<boolean | null>()

    const required = boolean(true)
    expectTypeOf<z.output<typeof required>>().toEqualTypeOf<boolean>()

    const nullEmpty = boolean(false, { emptyValue: null })
    expectTypeOf<z.output<typeof nullEmpty>>().toEqualTypeOf<boolean | null>()

    const undefinedEmpty = boolean(false, { emptyValue: undefined })
    expectTypeOf<z.output<typeof undefinedEmpty>>().toEqualTypeOf<boolean | undefined>()

    const stringEmpty = boolean(false, { emptyValue: "" })
    expectTypeOf<z.output<typeof stringEmpty>>().toEqualTypeOf<boolean | "">()
  })

  it("should infer input types that accept preprocessed values", () => {
    const schema = boolean(true)
    expectTypeOf<z.input<typeof schema>>().toEqualTypeOf<boolean | string | number | null | undefined>()

    const form = z.object({ agree: boolean(false) })
    expectTypeOf<{ agree: "" }>().toExtend<z.input<typeof form>>()
    expectTypeOf<z.output<typeof form>>().toEqualTypeOf<{ agree: boolean | null }>()
  })
})

describe("boolean default schema stays backward compatible", () => {
  beforeEach(() => setLocale("en-US"))

  it("should still fail when transform returns undefined", () => {
    for (const required of [false, true]) {
      const result = boolean(required, { transform: () => undefined as unknown as boolean }).safeParse("true")
      expect(result.success).toBe(false)
      expect(result.error!.issues.map((i) => i.code)).toEqual(["invalid_union"])
      const issue = result.error!.issues[0] as unknown as { errors: unknown[][] }
      expect(issue.errors).toHaveLength(3)
    }
  })

  it('should still fail when transform returns ""', () => {
    for (const required of [false, true]) {
      const result = boolean(required, { transform: () => "" as unknown as boolean }).safeParse(1)
      expect(result.success).toBe(false)
      expect(result.error!.issues.map((i) => i.code)).toEqual(["invalid_union"])
    }
  })

  it("should keep the same JSON Schema as before emptyValue was added", () => {
    const expected = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      anyOf: [
        { type: "boolean", const: true },
        { type: "boolean", const: false },
        { type: "null", const: null },
      ],
    }
    expect(z.toJSONSchema(boolean(false))).toEqual(expected)
    expect(z.toJSONSchema(boolean(true))).toEqual(expected)
  })

  it("should only add the empty string branch when emptyValue is an empty string", () => {
    expect(z.toJSONSchema(boolean(false, { emptyValue: "" })).anyOf).toContainEqual({ type: "string", const: "" })
    expect(z.toJSONSchema(boolean(false, { emptyValue: null })).anyOf).toHaveLength(3)
  })
})

describe("boolean emptyValue combinations", () => {
  beforeEach(() => setLocale("en-US"))

  it("should not apply transform to empty values", () => {
    const schema = boolean(false, { transform: (v) => !v, emptyValue: undefined })
    expect(schema.parse("")).toBe(undefined)
    expect(schema.parse(null)).toBe(undefined)
    expect(schema.parse("true")).toBe(false)
  })

  it("should fail shouldBe: false for empty values", () => {
    const schema = boolean(false, { shouldBe: false, emptyValue: undefined })
    expect(() => schema.parse("")).toThrow("Must be False")
    expect(() => schema.parse(undefined)).toThrow("Must be False")
    expect(schema.parse("no")).toBe(false)
  })

  it("should omit missing keys in z.object when emptyValue is undefined (default fills null)", () => {
    const withUndefined = z.object({ a: boolean(false, { emptyValue: undefined }) }).parse({})
    expect(withUndefined).toEqual({})
    expect("a" in withUndefined).toBe(false)
    expect(z.object({ a: boolean(false) }).parse({})).toEqual({ a: null })
  })

  it("should combine custom truthyValues / falsyValues with emptyValue", () => {
    const schema = boolean(false, { truthyValues: ["Y"], falsyValues: ["N"], emptyValue: undefined })
    expect(schema.parse("Y")).toBe(true)
    expect(schema.parse("N")).toBe(false)
    expect(schema.parse("")).toBe(undefined)
    expect(schema.parse(null)).toBe(undefined)
    expect(schema.safeParse("true").success).toBe(false)

    const stringEmpty = boolean(false, { truthyValues: ["Y"], falsyValues: ["N"], emptyValue: "" })
    expect(stringEmpty.parse(undefined)).toBe("")
  })

  it("should use defaultValue: true for empty input when required", () => {
    for (const emptyValue of [null, undefined, ""] as const) {
      const schema = boolean(true, { defaultValue: true, emptyValue })
      expect(schema.parse("")).toBe(true)
      expect(schema.parse(null)).toBe(true)
      expect(schema.parse(undefined)).toBe(true)
      expect(schema.parse("off")).toBe(false)
    }
  })
})

describe("boolean emptyValue i18n", () => {
  beforeEach(() => setLocale("en-US"))

  it("should use zh-TW messages", () => {
    setLocale("zh-TW")
    expect(() => boolean(true, { emptyValue: undefined }).parse("")).toThrow("必填")
    expect(() => boolean(true, { emptyValue: "" }).parse(null)).toThrow("必填")
    expect(() => boolean(false, { shouldBe: false, emptyValue: undefined }).parse("")).toThrow("必須為否")
  })

  it("should use custom i18n messages", () => {
    const i18n = { "en-US": { required: "Please choose", shouldBeTrue: "Please agree" }, "zh-TW": { required: "請選擇", shouldBeTrue: "請同意" } }
    expect(() => boolean(true, { emptyValue: undefined, i18n }).parse("")).toThrow("Please choose")
    expect(() => boolean(false, { shouldBe: true, emptyValue: "", i18n }).parse(undefined)).toThrow("Please agree")
    setLocale("zh-TW")
    expect(() => boolean(true, { emptyValue: "", i18n }).parse(undefined)).toThrow("請選擇")
    expect(() => boolean(false, { shouldBe: true, emptyValue: undefined, i18n }).parse("")).toThrow("請同意")
  })
})

describe("boolean options variable type inference", () => {
  it("should keep BooleanOptions<false> variables (without emptyValue) as boolean | null (0.2.9 compatible)", () => {
    const options: BooleanOptions<false> = { strict: false }
    const schema = boolean(false, options)
    expectTypeOf<z.output<typeof schema>>().toEqualTypeOf<boolean | null>()
    expect(schema.parse("")).toBe(null)

    const omitted: Omit<BooleanOptions<false>, "required"> = { strict: false }
    const omittedSchema = boolean(false, omitted)
    expectTypeOf<z.output<typeof omittedSchema>>().toEqualTypeOf<boolean | null>()
  })

  it("should keep BooleanOptions<true> variables as boolean", () => {
    const options: BooleanOptions<true> = { strict: false }
    const schema = boolean(true, options)
    expectTypeOf<z.output<typeof schema>>().toEqualTypeOf<boolean>()
  })

  it("should infer the explicit EmptyValue generic of a pre-declared options variable", () => {
    const undefinedOptions: BooleanOptions<false, undefined> = { emptyValue: undefined }
    const undefinedSchema = boolean(false, undefinedOptions)
    expectTypeOf<z.output<typeof undefinedSchema>>().toEqualTypeOf<boolean | undefined>()
    expect(undefinedSchema.parse("")).toBe(undefined)

    const stringOptions: BooleanOptions<false, ""> = { emptyValue: "" }
    const stringSchema = boolean(false, stringOptions)
    expectTypeOf<z.output<typeof stringSchema>>().toEqualTypeOf<boolean | "">()
    expect(stringSchema.parse(null)).toBe("")
  })

  it("should keep literal inference unchanged", () => {
    const plain = boolean(false, { strict: true })
    expectTypeOf<z.output<typeof plain>>().toEqualTypeOf<boolean | null>()
    const undefinedEmpty = boolean(false, { emptyValue: undefined })
    expectTypeOf<z.output<typeof undefinedEmpty>>().toEqualTypeOf<boolean | undefined>()
    expect(boolean(false, { emptyValue: undefined }).parse(null)).toBe(undefined)
    expect(boolean(true, { strict: true }).parse(true)).toBe(true)
  })

  it("should reject invalid emptyValue at the type level", () => {
    // @ts-expect-error 0 is not an allowed emptyValue
    boolean(false, { emptyValue: 0 })
    // @ts-expect-error false is not an allowed emptyValue
    const options: BooleanOptions<false, BooleanEmptyValue> = { emptyValue: false }
    expect(options).toBeDefined()
  })
})
