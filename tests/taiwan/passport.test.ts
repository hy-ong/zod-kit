import { describe, it, expect, beforeEach } from "vitest"
import { twPassport, setLocale, validateTaiwanPassport } from "../../src"

describe("Taiwan twPassport(true) validator", () => {
  beforeEach(() => setLocale("en-US"))

  describe("basic functionality", () => {
    it("should validate ordinary passport numbers (starts with 2)", () => {
      const schema = twPassport(true)

      expect(schema.parse("200000001")).toBe("200000001")
      expect(schema.parse("299999999")).toBe("299999999")
    })

    it("should validate official passport numbers (starts with 1)", () => {
      const schema = twPassport(true)

      expect(schema.parse("100000001")).toBe("100000001")
      expect(schema.parse("199999999")).toBe("199999999")
    })

    it("should validate diplomatic passport numbers (starts with 0)", () => {
      const schema = twPassport(true)

      expect(schema.parse("000000001")).toBe("000000001")
      expect(schema.parse("099999999")).toBe("099999999")
    })

    it("should validate travel document numbers (starts with 3)", () => {
      const schema = twPassport(true)

      expect(schema.parse("300000001")).toBe("300000001")
      expect(schema.parse("399999999")).toBe("399999999")
    })

    it("should reject passport numbers starting with 4 or higher", () => {
      const schema = twPassport(true)

      expect(() => schema.parse("400000001")).toThrow("Invalid Taiwan passport number")
      expect(() => schema.parse("500000001")).toThrow("Invalid Taiwan passport number")
      expect(() => schema.parse("900000001")).toThrow("Invalid Taiwan passport number")
    })

    it("should reject passport numbers with wrong length (8 digits)", () => {
      const schema = twPassport(true)

      expect(() => schema.parse("12345678")).toThrow("Invalid Taiwan passport number")
    })

    it("should reject passport numbers with wrong length (10 digits)", () => {
      const schema = twPassport(true)

      expect(() => schema.parse("1234567890")).toThrow("Invalid Taiwan passport number")
    })

    it("should reject non-numeric input", () => {
      const schema = twPassport(true)

      expect(() => schema.parse("abcdefghi")).toThrow("Invalid Taiwan passport number")
      expect(() => schema.parse("12345678A")).toThrow("Invalid Taiwan passport number")
    })
  })

  describe("passportType option", () => {
    it("should accept only ordinary passports (type 2) when passportType is 'ordinary'", () => {
      const schema = twPassport(true, { passportType: "ordinary" })

      expect(schema.parse("200000001")).toBe("200000001")
      expect(() => schema.parse("000000001")).toThrow("Invalid Taiwan passport number")
      expect(() => schema.parse("100000001")).toThrow("Invalid Taiwan passport number")
      expect(() => schema.parse("300000001")).toThrow("Invalid Taiwan passport number")
    })

    it("should accept only diplomatic passports (type 0) when passportType is 'diplomatic'", () => {
      const schema = twPassport(true, { passportType: "diplomatic" })

      expect(schema.parse("000000001")).toBe("000000001")
      expect(() => schema.parse("100000001")).toThrow("Invalid Taiwan passport number")
      expect(() => schema.parse("200000001")).toThrow("Invalid Taiwan passport number")
      expect(() => schema.parse("300000001")).toThrow("Invalid Taiwan passport number")
    })

    it("should accept only official passports (type 1) when passportType is 'official'", () => {
      const schema = twPassport(true, { passportType: "official" })

      expect(schema.parse("100000001")).toBe("100000001")
      expect(() => schema.parse("000000001")).toThrow("Invalid Taiwan passport number")
      expect(() => schema.parse("200000001")).toThrow("Invalid Taiwan passport number")
      expect(() => schema.parse("300000001")).toThrow("Invalid Taiwan passport number")
    })

    it("should accept only travel documents (type 3) when passportType is 'travel'", () => {
      const schema = twPassport(true, { passportType: "travel" })

      expect(schema.parse("300000001")).toBe("300000001")
      expect(() => schema.parse("000000001")).toThrow("Invalid Taiwan passport number")
      expect(() => schema.parse("100000001")).toThrow("Invalid Taiwan passport number")
      expect(() => schema.parse("200000001")).toThrow("Invalid Taiwan passport number")
    })

    it("should accept all valid passport types when passportType is 'any'", () => {
      const schema = twPassport(true, { passportType: "any" })

      expect(schema.parse("000000001")).toBe("000000001")
      expect(schema.parse("100000001")).toBe("100000001")
      expect(schema.parse("200000001")).toBe("200000001")
      expect(schema.parse("300000001")).toBe("300000001")
    })

    it("should default to 'any' when passportType is not specified", () => {
      const schema = twPassport(true)

      expect(schema.parse("000000001")).toBe("000000001")
      expect(schema.parse("100000001")).toBe("100000001")
      expect(schema.parse("200000001")).toBe("200000001")
      expect(schema.parse("300000001")).toBe("300000001")
    })
  })

  describe("utility function validateTaiwanPassport", () => {
    it("should return true for valid passport numbers", () => {
      expect(validateTaiwanPassport("000000001")).toBe(true)
      expect(validateTaiwanPassport("100000001")).toBe(true)
      expect(validateTaiwanPassport("200000001")).toBe(true)
      expect(validateTaiwanPassport("300000001")).toBe(true)
    })

    it("should return false for invalid passport numbers", () => {
      expect(validateTaiwanPassport("400000001")).toBe(false)
      expect(validateTaiwanPassport("12345678")).toBe(false)
      expect(validateTaiwanPassport("1234567890")).toBe(false)
      expect(validateTaiwanPassport("abcdefghi")).toBe(false)
      expect(validateTaiwanPassport("")).toBe(false)
      expect(validateTaiwanPassport("A00000001")).toBe(false)
    })
  })

  describe("required/optional behavior", () => {
    it("should handle required=true", () => {
      const schema = twPassport(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse(null)).toThrow()
      expect(() => schema.parse(undefined)).toThrow()
    })

    it("should handle required=false", () => {
      const schema = twPassport(false)

      expect(schema.parse("")).toBe(null)
      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
      expect(schema.parse("200000001")).toBe("200000001")
    })

    it("should use default values", () => {
      const requiredSchema = twPassport(true, { defaultValue: "200000001" })
      const optionalSchema = twPassport(false, { defaultValue: "200000001" })

      expect(requiredSchema.parse("")).toBe("200000001")
      expect(optionalSchema.parse("")).toBe("200000001")
    })
  })

  describe("transform function", () => {
    it("should apply custom transform", () => {
      const schema = twPassport(true, {
        transform: (val) => val.replace(/-/g, ""),
      })

      expect(schema.parse("200-000-001")).toBe("200000001")
    })

    it("should apply transform before validation", () => {
      const schema = twPassport(true, {
        transform: (val) => val.replace(/\s+/g, ""),
      })

      expect(schema.parse("  200000001  ")).toBe("200000001")
      expect(schema.parse("2000 0000 1")).toBe("200000001")
      // Transform cannot fix non-digit characters
      expect(() => schema.parse("20000000X")).toThrow("Invalid Taiwan passport number")
    })
  })

  describe("input preprocessing", () => {
    it("should handle string conversion", () => {
      const schema = twPassport(true)

      expect(schema.parse(200000001)).toBe("200000001")
    })

    it("should trim whitespace", () => {
      const schema = twPassport(true)

      expect(schema.parse("  200000001  ")).toBe("200000001")
      expect(schema.parse("\t200000001\n")).toBe("200000001")
    })
  })

  describe("i18n support", () => {
    it("should use English messages by default", () => {
      setLocale("en-US")
      const schema = twPassport(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("INVALID")).toThrow("Invalid Taiwan passport number")
    })

    it("should use Chinese messages when locale is zh-TW", () => {
      setLocale("zh-TW")
      const schema = twPassport(true)

      expect(() => schema.parse("")).toThrow("必填")
      expect(() => schema.parse("INVALID")).toThrow("無效的護照號碼")
    })

    it("should support custom i18n messages", () => {
      const schema = twPassport(true, {
        i18n: {
          "en-US": {
            required: "Passport number is required",
            invalid: "Passport number is invalid",
          },
          "zh-TW": {
            required: "請輸入護照號碼",
            invalid: "護照號碼格式錯誤",
          },
        },
      })

      setLocale("en-US")
      expect(() => schema.parse("")).toThrow("Passport number is required")
      expect(() => schema.parse("INVALID")).toThrow("Passport number is invalid")

      setLocale("zh-TW")
      expect(() => schema.parse("")).toThrow("請輸入護照號碼")
      expect(() => schema.parse("INVALID")).toThrow("護照號碼格式錯誤")
    })
  })

  describe("edge cases", () => {
    it("should handle empty and whitespace inputs", () => {
      const schema = twPassport(true)
      const optionalSchema = twPassport(false)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("   ")).toThrow("Required")
      expect(() => schema.parse("\t\n")).toThrow("Required")

      expect(optionalSchema.parse("")).toBe(null)
      expect(optionalSchema.parse("   ")).toBe(null)
      expect(optionalSchema.parse("\t\n")).toBe(null)
    })

    it("should handle boundary values", () => {
      const schema = twPassport(true)

      expect(schema.parse("000000000")).toBe("000000000")
      expect(schema.parse("399999999")).toBe("399999999")
    })

    it("should reject passport numbers with leading spaces that break digit count", () => {
      const schema = twPassport(true)

      // After trim, "2 00000001" becomes "2 00000001" which has a space
      expect(() => schema.parse("2 00000001")).toThrow("Invalid Taiwan passport number")
    })

    it("should reject mixed alphanumeric input", () => {
      const schema = twPassport(true)

      expect(() => schema.parse("2A0000001")).toThrow("Invalid Taiwan passport number")
      expect(() => schema.parse("20000000A")).toThrow("Invalid Taiwan passport number")
    })
  })
})
