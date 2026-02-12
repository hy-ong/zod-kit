import { describe, it, expect, beforeEach } from "vitest"
import { twInvoice, setLocale, validateTaiwanInvoice } from "../../src"

describe("Taiwan twInvoice(true) validator", () => {
  beforeEach(() => setLocale("en-US"))

  describe("basic functionality", () => {
    it("should validate correct Taiwan invoice numbers", () => {
      const schema = twInvoice(true)

      expect(schema.parse("AB12345678")).toBe("AB12345678")
      expect(schema.parse("CD99887766")).toBe("CD99887766")
      expect(schema.parse("ZZ00000000")).toBe("ZZ00000000")
    })

    it("should auto-strip hyphens from input", () => {
      const schema = twInvoice(true)

      expect(schema.parse("CD-12345678")).toBe("CD12345678")
      expect(schema.parse("AB-99887766")).toBe("AB99887766")
    })

    it("should auto-uppercase lowercase input", () => {
      const schema = twInvoice(true)

      expect(schema.parse("ab12345678")).toBe("AB12345678")
      expect(schema.parse("cd-12345678")).toBe("CD12345678")
      expect(schema.parse("Ab12345678")).toBe("AB12345678")
    })

    it("should reject input with only 1 letter", () => {
      const schema = twInvoice(true)

      expect(() => schema.parse("A123456789")).toThrow("Invalid Taiwan uniform invoice number")
    })

    it("should reject input with 3 letters", () => {
      const schema = twInvoice(true)

      expect(() => schema.parse("ABC1234567")).toThrow("Invalid Taiwan uniform invoice number")
    })

    it("should reject input with 7 digits", () => {
      const schema = twInvoice(true)

      expect(() => schema.parse("AB1234567")).toThrow("Invalid Taiwan uniform invoice number")
    })

    it("should reject input with 9 digits", () => {
      const schema = twInvoice(true)

      expect(() => schema.parse("AB123456789")).toThrow("Invalid Taiwan uniform invoice number")
    })

    it("should reject digits before letters", () => {
      const schema = twInvoice(true)

      expect(() => schema.parse("12AB345678")).toThrow("Invalid Taiwan uniform invoice number")
    })

    it("should reject non-alphanumeric inputs", () => {
      const schema = twInvoice(true)

      expect(() => schema.parse("AB@#345678")).toThrow("Invalid Taiwan uniform invoice number")
      expect(() => schema.parse("!!12345678")).toThrow("Invalid Taiwan uniform invoice number")
    })
  })

  describe("utility function validateTaiwanInvoice", () => {
    it("should return true for valid invoice numbers", () => {
      expect(validateTaiwanInvoice("AB12345678")).toBe(true)
      expect(validateTaiwanInvoice("CD99887766")).toBe(true)
      expect(validateTaiwanInvoice("ZZ00000000")).toBe(true)
    })

    it("should handle hyphens in input", () => {
      expect(validateTaiwanInvoice("AB-12345678")).toBe(true)
      expect(validateTaiwanInvoice("CD-99887766")).toBe(true)
    })

    it("should return false for invalid invoice numbers", () => {
      expect(validateTaiwanInvoice("A123456789")).toBe(false)
      expect(validateTaiwanInvoice("ABC1234567")).toBe(false)
      expect(validateTaiwanInvoice("AB1234567")).toBe(false)
      expect(validateTaiwanInvoice("AB123456789")).toBe(false)
      expect(validateTaiwanInvoice("12AB345678")).toBe(false)
      expect(validateTaiwanInvoice("12345678")).toBe(false)
      expect(validateTaiwanInvoice("")).toBe(false)
    })

    it("should be case-sensitive (lowercase returns false)", () => {
      expect(validateTaiwanInvoice("ab12345678")).toBe(false)
    })
  })

  describe("required/optional behavior", () => {
    it("should handle required=true", () => {
      const schema = twInvoice(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse(null)).toThrow()
      expect(() => schema.parse(undefined)).toThrow()
    })

    it("should handle required=false", () => {
      const schema = twInvoice(false)

      expect(schema.parse("")).toBe(null)
      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
      expect(schema.parse("AB12345678")).toBe("AB12345678")
    })

    it("should use default values", () => {
      const requiredSchema = twInvoice(true, { defaultValue: "AB12345678" })
      const optionalSchema = twInvoice(false, { defaultValue: "AB12345678" })

      expect(requiredSchema.parse("")).toBe("AB12345678")
      expect(optionalSchema.parse("")).toBe("AB12345678")
    })
  })

  describe("transform function", () => {
    it("should apply custom transform", () => {
      const schema = twInvoice(true, {
        transform: (val) => val.replace(/\s+/g, ""),
      })

      expect(schema.parse("AB 12345678")).toBe("AB12345678")
    })

    it("should apply transform before validation", () => {
      const schema = twInvoice(true, {
        transform: (val) => val.replace(/\s+/g, ""),
      })

      expect(schema.parse("  AB12345678  ")).toBe("AB12345678")
      expect(() => schema.parse("AB 1234 567")).toThrow("Invalid Taiwan uniform invoice number")
    })
  })

  describe("input preprocessing", () => {
    it("should handle string conversion", () => {
      const schema = twInvoice(true)

      // Pure digits have no letter prefix, so they fail validation
      expect(() => schema.parse(12345678)).toThrow("Invalid Taiwan uniform invoice number")
    })

    it("should trim whitespace", () => {
      const schema = twInvoice(true)

      expect(schema.parse("  AB12345678  ")).toBe("AB12345678")
      expect(schema.parse("\tAB12345678\n")).toBe("AB12345678")
    })
  })

  describe("i18n support", () => {
    it("should use English messages by default", () => {
      setLocale("en-US")
      const schema = twInvoice(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("INVALID")).toThrow("Invalid Taiwan uniform invoice number")
    })

    it("should use Chinese messages when locale is zh-TW", () => {
      setLocale("zh-TW")
      const schema = twInvoice(true)

      expect(() => schema.parse("")).toThrow("必填")
      expect(() => schema.parse("INVALID")).toThrow("無效的統一發票號碼")
    })

    it("should support custom i18n messages", () => {
      const schema = twInvoice(true, {
        i18n: {
          "en-US": {
            required: "Invoice number is required",
            invalid: "Invoice number is invalid",
          },
          "zh-TW": {
            required: "請輸入發票號碼",
            invalid: "發票號碼格式錯誤",
          },
        },
      })

      setLocale("en-US")
      expect(() => schema.parse("")).toThrow("Invoice number is required")
      expect(() => schema.parse("INVALID")).toThrow("Invoice number is invalid")

      setLocale("zh-TW")
      expect(() => schema.parse("")).toThrow("請輸入發票號碼")
      expect(() => schema.parse("INVALID")).toThrow("發票號碼格式錯誤")
    })
  })

  describe("edge cases", () => {
    it("should handle empty and whitespace inputs", () => {
      const schema = twInvoice(true)
      const optionalSchema = twInvoice(false)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("   ")).toThrow("Required")
      expect(() => schema.parse("\t\n")).toThrow("Required")

      expect(optionalSchema.parse("")).toBe(null)
      expect(optionalSchema.parse("   ")).toBe(null)
      expect(optionalSchema.parse("\t\n")).toBe(null)
    })

    it("should handle boundary letter/digit combinations", () => {
      const schema = twInvoice(true)

      expect(schema.parse("AA00000000")).toBe("AA00000000")
      expect(schema.parse("ZZ99999999")).toBe("ZZ99999999")
    })

    it("should reject special characters mixed in", () => {
      const schema = twInvoice(true)

      expect(() => schema.parse("AB!2345678")).toThrow("Invalid Taiwan uniform invoice number")
      expect(() => schema.parse("AB 2345678")).toThrow("Invalid Taiwan uniform invoice number")
    })
  })
})
