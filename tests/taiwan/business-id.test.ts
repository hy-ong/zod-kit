import { describe, it, expect, beforeEach } from "vitest"
import { businessId, setLocale, validateTaiwanBusinessId } from "../../src"

describe("Taiwan businessId() validator", () => {
  beforeEach(() => setLocale("en"))

  describe("basic functionality", () => {
    it("should validate correct Taiwan business IDs", () => {
      const schema = businessId()

      // Valid Taiwan business IDs (統一編號) - using calculation based on new/old rules
      expect(schema.parse("22550077")).toBe("22550077") // Sum = 50, 50 % 5 = 0 (new rule)
      expect(schema.parse("12345675")).toBe("12345675") // Should be valid with our algorithm
      expect(schema.parse("04595257")).toBe("04595257") // Should be valid
    })

    it("should reject invalid Taiwan business IDs", () => {
      const schema = businessId()

      // Invalid checksums
      expect(() => schema.parse("12345672")).toThrow("Invalid Taiwan Business ID checksum")
      expect(() => schema.parse("12345673")).toThrow("Invalid Taiwan Business ID checksum")
      expect(() => schema.parse("12345674")).toThrow("Invalid Taiwan Business ID checksum")
    })

    it("should reject non-numeric inputs", () => {
      const schema = businessId()

      expect(() => schema.parse("1234567A")).toThrow("Must contain only numbers")
      expect(() => schema.parse("abcdefgh")).toThrow("Must contain only numbers")
      expect(() => schema.parse("123-45-67")).toThrow("Must contain only numbers")
    })

    it("should reject wrong length inputs", () => {
      const schema = businessId()

      expect(() => schema.parse("1234567")).toThrow("Must be exactly 8 digits")
      expect(() => schema.parse("123456789")).toThrow("Must be exactly 8 digits")
      expect(() => schema.parse("12")).toThrow("Must be exactly 8 digits")
      expect(() => schema.parse("")).toThrow("Required")
    })
  })

  describe("special case validation (7th digit = 7)", () => {
    it("should handle special case where 7th digit is 7", () => {
      const schema = businessId()

      // Valid number with 7th digit = 7 for testing special case
      expect(schema.parse("12345670")).toBe("12345670") // Should be valid with special case
    })
  })

  describe("utility function validateTaiwanBusinessId", () => {
    it("should correctly validate business IDs", () => {
      // Valid IDs (confirmed by our algorithm)
      expect(validateTaiwanBusinessId("12345675")).toBe(true)
      expect(validateTaiwanBusinessId("22550077")).toBe(true)
      expect(validateTaiwanBusinessId("04595257")).toBe(true)
      expect(validateTaiwanBusinessId("53885486")).toBe(true)

      // Invalid IDs
      expect(validateTaiwanBusinessId("12345672")).toBe(false)
      expect(validateTaiwanBusinessId("12345673")).toBe(false)
      expect(validateTaiwanBusinessId("12345674")).toBe(false)
      expect(validateTaiwanBusinessId("1234567")).toBe(false)
      expect(validateTaiwanBusinessId("123456789")).toBe(false)
      expect(validateTaiwanBusinessId("abcdefgh")).toBe(false)
    })

    it("should handle special case for 7th digit = 7", () => {
      // Test with 7th digit = 7 (requires special calculation)
      expect(validateTaiwanBusinessId("12345670")).toBe(true) // Should be valid with special case
    })
  })

  describe("required/optional behavior", () => {
    it("should handle required=true (default)", () => {
      const schema = businessId()

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse(null)).toThrow()
      expect(() => schema.parse(undefined)).toThrow()
    })

    it("should handle required=false", () => {
      const schema = businessId({ required: false })

      expect(schema.parse("")).toBe(null)
      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
      expect(schema.parse("12345675")).toBe("12345675")
    })

    it("should use default values", () => {
      const requiredSchema = businessId({ defaultValue: "12345675" })
      const optionalSchema = businessId({ required: false, defaultValue: "12345675" })

      expect(requiredSchema.parse("")).toBe("12345675")
      expect(optionalSchema.parse("")).toBe("12345675")
    })
  })

  describe("transform function", () => {
    it("should apply custom transform", () => {
      const schema = businessId({
        transform: (val) => val.replace(/[-\s]/g, ""),
      })

      expect(schema.parse("1234-5675")).toBe("12345675")
      // Note: This will fail validation since the cleaned value has wrong checksum
      expect(() => schema.parse("1234-5672")).toThrow("Invalid Taiwan Business ID checksum")
    })

    it("should apply transform before validation", () => {
      const schema = businessId({
        transform: (val) => val.replace(/\s+/g, ""),
      })

      expect(schema.parse(" 12345675 ")).toBe("12345675")
      expect(() => schema.parse(" 1234567 2 ")).toThrow("Invalid Taiwan Business ID checksum")
    })
  })

  describe("input preprocessing", () => {
    it("should handle string conversion", () => {
      const schema = businessId()

      expect(schema.parse(12345675)).toBe("12345675")
      expect(() => schema.parse(12345672)).toThrow("Invalid Taiwan Business ID checksum")
    })

    it("should trim whitespace", () => {
      const schema = businessId()

      expect(schema.parse("  12345675  ")).toBe("12345675")
      expect(schema.parse("\t12345675\n")).toBe("12345675")
    })
  })

  describe("i18n support", () => {
    it("should use English messages by default", () => {
      setLocale("en")
      const schema = businessId()

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("1234567")).toThrow("Must be exactly 8 digits")
      expect(() => schema.parse("12345672")).toThrow("Invalid Taiwan Business ID checksum")
    })

    it("should use Chinese messages when locale is zh-TW", () => {
      setLocale("zh-TW")
      const schema = businessId()

      expect(() => schema.parse("")).toThrow("必填")
      expect(() => schema.parse("1234567")).toThrow("必須為8位數字")
      expect(() => schema.parse("12345672")).toThrow("統一編號檢查碼錯誤")
    })

    it("should support custom i18n messages", () => {
      const schema = businessId({
        i18n: {
          en: {
            required: "Business ID is required",
            checksum: "Business ID checksum is invalid",
          },
          "zh-TW": {
            required: "請輸入統一編號",
            checksum: "統一編號驗證碼不正確",
          },
        },
      })

      setLocale("en")
      expect(() => schema.parse("")).toThrow("Business ID is required")
      expect(() => schema.parse("12345672")).toThrow("Business ID checksum is invalid")

      setLocale("zh-TW")
      expect(() => schema.parse("")).toThrow("請輸入統一編號")
      expect(() => schema.parse("12345672")).toThrow("統一編號驗證碼不正確")
    })
  })

  describe("real world Taiwan business IDs", () => {
    it("should validate known real business IDs", () => {
      const schema = businessId()

      // These are example valid Taiwan business IDs for testing
      const validIds = [
        "12345675", // Calculated valid example
        "22550077", // Calculated valid example
        "04595257", // Calculated valid example
        "53885486", // Calculated valid example
      ]

      validIds.forEach((id) => {
        expect(schema.parse(id)).toBe(id)
      })
    })

    it("should reject common invalid patterns", () => {
      const schema = businessId()

      const invalidIds = [
        "00000001", // All zeros with bad checksum
        "11111111", // All ones
        "12345672", // Sequential but wrong checksum
        "12345673", // Almost valid but wrong checksum
        "12345674", // Almost valid but wrong checksum
        "98765432", // Reverse sequential but wrong checksum
        "87654321", // Another invalid pattern
      ]

      invalidIds.forEach((id) => {
        expect(() => schema.parse(id)).toThrow()
      })
    })
  })

  describe("edge cases", () => {
    it("should handle leading zeros", () => {
      const schema = businessId()

      expect(schema.parse("04595257")).toBe("04595257")
      expect(() => schema.parse("00123456")).toThrow("Invalid Taiwan Business ID checksum")
    })

    it("should handle empty and whitespace inputs", () => {
      const schema = businessId()
      const optionalSchema = businessId({ required: false })

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("   ")).toThrow("Required")
      expect(() => schema.parse("\t\n")).toThrow("Required")

      expect(optionalSchema.parse("")).toBe(null)
      expect(optionalSchema.parse("   ")).toBe(null)
      expect(optionalSchema.parse("\t\n")).toBe(null)
    })
  })
})
