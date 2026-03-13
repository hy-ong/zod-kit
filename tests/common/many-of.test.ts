import { describe, it, expect, beforeEach } from "vitest"
import { manyOf, setLocale, Locale } from "../../src"

const locales = [
  {
    locale: "en-US",
    messages: {
      required: "Required",
      invalid: "Must be from: react, vue, angular, svelte",
      minSelect: "Must select at least 2 item(s)",
      maxSelect: "Must select at most 3 item(s)",
      duplicate: "Duplicate values are not allowed",
    },
  },
  {
    locale: "zh-TW",
    messages: {
      required: "必填",
      invalid: "必須為以下值之一：react, vue, angular, svelte",
      minSelect: "至少需選擇 2 項",
      maxSelect: "最多只能選擇 3 項",
      duplicate: "不允許重複的值",
    },
  },
] as const

const frameworks = ["react", "vue", "angular", "svelte"] as const

describe.each(locales)("manyOf(true) locale: $locale", ({ locale, messages }) => {
  beforeEach(() => setLocale(locale as Locale))

  describe("basic functionality", () => {
    it("should accept valid arrays", () => {
      const schema = manyOf(true, { values: [...frameworks] })
      expect(schema.parse(["react"])).toEqual(["react"])
      expect(schema.parse(["react", "vue"])).toEqual(["react", "vue"])
      expect(schema.parse(["react", "vue", "angular", "svelte"])).toEqual(["react", "vue", "angular", "svelte"])
    })

    it("should reject invalid values in array", () => {
      const schema = manyOf(true, { values: [...frameworks] })
      expect(() => schema.parse(["react", "jquery"])).toThrow(messages.invalid)
    })

    it("should fail with empty when required", () => {
      const schema = manyOf(true, { values: [...frameworks] })
      expect(() => schema.parse(null)).toThrow(messages.required)
      expect(() => schema.parse(undefined)).toThrow(messages.required)
      expect(() => schema.parse("")).toThrow(messages.required)
    })

    it("should pass with null when not required", () => {
      const schema = manyOf(false, { values: [...frameworks] })
      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
      expect(schema.parse("")).toBe(null)
    })

    it("should wrap single value in array", () => {
      const schema = manyOf(true, { values: [...frameworks] })
      expect(schema.parse("react")).toEqual(["react"])
    })
  })

  describe("min/max selection", () => {
    it("should enforce minimum selections", () => {
      const schema = manyOf(true, { values: [...frameworks], min: 2 })
      expect(() => schema.parse(["react"])).toThrow(messages.minSelect)
      expect(schema.parse(["react", "vue"])).toEqual(["react", "vue"])
    })

    it("should enforce maximum selections", () => {
      const schema = manyOf(true, { values: [...frameworks], max: 3 })
      expect(() => schema.parse(["react", "vue", "angular", "svelte"])).toThrow(messages.maxSelect)
      expect(schema.parse(["react", "vue", "angular"])).toEqual(["react", "vue", "angular"])
    })

    it("should enforce both min and max", () => {
      const schema = manyOf(true, { values: [...frameworks], min: 2, max: 3 })
      expect(() => schema.parse(["react"])).toThrow(messages.minSelect)
      expect(() => schema.parse(["react", "vue", "angular", "svelte"])).toThrow(messages.maxSelect)
      expect(schema.parse(["react", "vue"])).toEqual(["react", "vue"])
      expect(schema.parse(["react", "vue", "angular"])).toEqual(["react", "vue", "angular"])
    })
  })

  describe("duplicate handling", () => {
    it("should reject duplicates by default", () => {
      const schema = manyOf(true, { values: [...frameworks] })
      expect(() => schema.parse(["react", "react"])).toThrow(messages.duplicate)
    })

    it("should allow duplicates when configured", () => {
      const schema = manyOf(true, { values: [...frameworks], allowDuplicates: true })
      expect(schema.parse(["react", "react"])).toEqual(["react", "react"])
    })
  })

  describe("numeric values", () => {
    it("should accept valid numeric arrays", () => {
      const schema = manyOf(true, { values: [1, 2, 3, 4, 5] })
      expect(schema.parse([1, 3, 5])).toEqual([1, 3, 5])
    })

    it("should reject invalid numeric values", () => {
      const schema = manyOf(true, { values: [1, 2, 3] })
      expect(() => schema.parse([1, 10])).toThrow()
    })

    it("should coerce number strings", () => {
      const schema = manyOf(true, { values: [1, 2, 3] })
      expect(schema.parse(["1", "2"])).toEqual([1, 2])
    })
  })

  describe("case sensitivity", () => {
    it("should be case sensitive by default", () => {
      const schema = manyOf(true, { values: [...frameworks] })
      expect(() => schema.parse(["React"])).toThrow()
    })

    it("should match case-insensitively when configured", () => {
      const schema = manyOf(true, { values: [...frameworks], caseSensitive: false })
      expect(schema.parse(["REACT", "Vue"])).toEqual(["react", "vue"])
    })
  })

  describe("default value", () => {
    it("should use default value when input is empty", () => {
      const schema = manyOf(false, { values: [...frameworks], defaultValue: ["react"] })
      expect(schema.parse(null)).toEqual(["react"])
      expect(schema.parse(undefined)).toEqual(["react"])
      expect(schema.parse("")).toEqual(["react"])
    })

    it("should use provided value over default", () => {
      const schema = manyOf(false, { values: [...frameworks], defaultValue: ["react"] })
      expect(schema.parse(["vue", "angular"])).toEqual(["vue", "angular"])
    })
  })

  describe("transform", () => {
    it("should apply transform to valid arrays", () => {
      const schema = manyOf(true, {
        values: [...frameworks],
        transform: (vals) => vals.map((v) => v.toUpperCase()) as any,
      })
      expect(schema.parse(["react", "vue"])).toEqual(["REACT", "VUE"])
    })
  })

  describe("custom i18n", () => {
    it("should use custom messages when provided", () => {
      const schema = manyOf(true, {
        values: [...frameworks],
        i18n: {
          "en-US": { required: "Pick frameworks!", duplicate: "No repeats!" },
          "zh-TW": { required: "請選擇框架！", duplicate: "不能重複！" },
        },
      })

      if (locale === "en-US") {
        expect(() => schema.parse(null)).toThrow("Pick frameworks!")
        expect(() => schema.parse(["react", "react"])).toThrow("No repeats!")
      } else {
        expect(() => schema.parse(null)).toThrow("請選擇框架！")
        expect(() => schema.parse(["react", "react"])).toThrow("不能重複！")
      }
    })
  })

  describe("complex scenarios", () => {
    it("should work with all options combined", () => {
      const schema = manyOf(true, {
        values: [...frameworks],
        min: 1,
        max: 3,
        caseSensitive: false,
      })

      expect(schema.parse(["REACT", "Vue"])).toEqual(["react", "vue"])
      expect(() => schema.parse([])).toThrow() // min 1
      expect(() => schema.parse(["react", "vue", "angular", "svelte"])).toThrow() // max 3
      expect(() => schema.parse(["jquery"])).toThrow() // invalid
    })

    it("should handle empty array when required with no min", () => {
      const schema = manyOf(true, { values: [...frameworks] })
      // Empty array is a valid array, just has 0 items — not null
      expect(schema.parse([])).toEqual([])
    })

    it("should handle empty array with min constraint", () => {
      const schema = manyOf(true, { values: [...frameworks], min: 1 })
      expect(() => schema.parse([])).toThrow()
    })
  })
})
