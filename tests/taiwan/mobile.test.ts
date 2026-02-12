import { describe, it, expect, beforeEach } from "vitest"
import { twMobile, setLocale, validateTaiwanMobile } from "../../src"

describe("Taiwan twMobile(true) validator", () => {
  beforeEach(() => setLocale("en-US"))

  describe("basic functionality", () => {
    it("should validate correct Taiwan mobile phone numbers", () => {
      const schema = twMobile(true)

      // Valid Taiwan mobile phone numbers
      expect(schema.parse("0923-658545")).toBe("0923-658545")
      expect(schema.parse("0901234567")).toBe("0901234567")
      expect(schema.parse("0911234567")).toBe("0911234567")
      expect(schema.parse("0921234567")).toBe("0921234567")
      expect(schema.parse("0931234567")).toBe("0931234567")
      expect(schema.parse("0941234567")).toBe("0941234567")
      expect(schema.parse("0951234567")).toBe("0951234567")
      expect(schema.parse("0961234567")).toBe("0961234567")
      expect(schema.parse("0971234567")).toBe("0971234567")
      expect(schema.parse("0981234567")).toBe("0981234567")
      expect(schema.parse("0991234567")).toBe("0991234567")
    })

    it("should reject invalid Taiwan mobile phone numbers", () => {
      const schema = twMobile(true)

      // Invalid formats
      expect(() => schema.parse("123456789")).toThrow("Invalid Taiwan mobile phone format") // Missing leading 09
      expect(() => schema.parse("01234567890")).toThrow("Invalid Taiwan mobile phone format") // Too long
      expect(() => schema.parse("090123456")).toThrow("Invalid Taiwan mobile phone format") // Too short
      expect(() => schema.parse("0801234567")).toThrow("Invalid Taiwan mobile phone format") // Wrong prefix (08)
      expect(() => schema.parse("0701234567")).toThrow("Invalid Taiwan mobile phone format") // Wrong prefix (07)
      expect(() => schema.parse("1901234567")).toThrow("Invalid Taiwan mobile phone format") // Wrong prefix (19)
      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("abcdefghij")).toThrow("Invalid Taiwan mobile phone format")
    })

    it("should handle whitespace trimming", () => {
      const schema = twMobile(true)

      expect(schema.parse("  0901234567  ")).toBe("0901234567")
      expect(schema.parse("\t0911234567\n")).toBe("0911234567")
    })
  })

  describe("whitelist functionality", () => {
    it("should accept any string in whitelist regardless of format", () => {
      const schema = twMobile(true, {
        whitelist: ["custom-phone", "emergency-contact", "0801234567"],
      })

      // Allowlist entries should be accepted even if they don't match Taiwan mobile formats
      expect(schema.parse("custom-phone")).toBe("custom-phone")
      expect(schema.parse("emergency-contact")).toBe("emergency-contact")
      expect(schema.parse("0801234567")).toBe("0801234567") // Invalid mobile but in allowlist

      // Valid mobile phones not in the allowlist should still be accepted
      expect(schema.parse("0901234567")).toBe("0901234567") // Valid format, not in whitelist
      expect(schema.parse("0911234567")).toBe("0911234567") // Valid format, not in whitelist

      // Invalid mobile numbers not in the allowlist should be rejected
      expect(() => schema.parse("invalid-phone")).toThrow("Invalid Taiwan mobile phone format")
    })

    it("should accept both whitelist values and valid mobile numbers", () => {
      const schema = twMobile(true, {
        whitelist: ["allowed-value", "0901234567"],
      })

      // In whitelist
      expect(schema.parse("allowed-value")).toBe("allowed-value")
      expect(schema.parse("0901234567")).toBe("0901234567")

      // Not in whitelist but valid format
      expect(schema.parse("0911234567")).toBe("0911234567")
      expect(schema.parse("0921234567")).toBe("0921234567")

      // Not in whitelist and invalid format
      expect(() => schema.parse("invalid-value")).toThrow("Invalid Taiwan mobile phone format")
    })

    it("should work with empty whitelist", () => {
      const schema = twMobile(true, {
        whitelist: [],
      })

      // With empty allowlist, should still validate a mobile phone format
      expect(schema.parse("0901234567")).toBe("0901234567")
      expect(() => schema.parse("0801234567")).toThrow("Invalid Taiwan mobile phone format")
    })

    it("should prioritize whitelist over format validation", () => {
      const schema = twMobile(false, { whitelist: ["not-a-phone", "123", ""] })

      // These should be accepted despite being invalid mobile phone formats
      expect(schema.parse("not-a-phone")).toBe("not-a-phone")
      expect(schema.parse("123")).toBe("123")
      expect(schema.parse("")).toBe("")
    })
  })

  describe("required/optional behavior", () => {
    it("should handle required=true (default)", () => {
      const schema = twMobile(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse(null)).toThrow()
      expect(() => schema.parse(undefined)).toThrow()
    })

    it("should handle required=false", () => {
      const schema = twMobile(false)

      expect(schema.parse("")).toBe(null)
      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
      expect(schema.parse("0901234567")).toBe("0901234567")
    })

    it("should use default values", () => {
      const requiredSchema = twMobile(true, { defaultValue: "0901234567" })
      const optionalSchema = twMobile(false, { defaultValue: "0901234567" })

      expect(requiredSchema.parse("")).toBe("0901234567")
      expect(optionalSchema.parse("")).toBe("0901234567")
    })

    it("should handle whitelist with optional fields", () => {
      const schema = twMobile(false, { whitelist: ["custom-value", "0901234567"] })

      expect(schema.parse("")).toBe(null)
      expect(schema.parse("custom-value")).toBe("custom-value")
      expect(schema.parse("0901234567")).toBe("0901234567")
      expect(schema.parse("0911234567")).toBe("0911234567") // Valid format, not in whitelist
    })
  })

  describe("transform function", () => {
    it("should apply custom transform", () => {
      const schema = twMobile(true, {
        transform: (val) => val.replace(/[-\s]/g, ""),
      })

      expect(schema.parse("090-123-4567")).toBe("0901234567")
      expect(schema.parse("091 123 4567")).toBe("0911234567")
    })

    it("should apply transform before validation", () => {
      const schema = twMobile(true, {
        transform: (val) => val.replace(/\s+/g, ""),
      })

      expect(schema.parse(" 090 123 4567 ")).toBe("0901234567")
      expect(() => schema.parse(" 080 123 4567 ")).toThrow("Invalid Taiwan mobile phone format")
    })

    it("should work with whitelist after transform", () => {
      // First test basic transform without allowlist
      const basicSchema = twMobile(true, {
        transform: (val) => val.replace(/[-\s]/g, ""),
      })
      expect(basicSchema.parse("090-123-4567")).toBe("0901234567")

      // Then test with whitelist - use simple value that transforms won't affect
      const whitelistSchema = twMobile(true, {
        transform: (val) => val.replace(/[-\s]/g, ""),
        whitelist: ["0901234567", "customvalue"],
      })

      expect(whitelistSchema.parse("customvalue")).toBe("customvalue")
      expect(whitelistSchema.parse("091-123-4567")).toBe("0911234567") // Valid format after transform
    })
  })

  describe("input preprocessing", () => {
    it("should handle string conversion", () => {
      const schema = twMobile(true)

      // Test string conversion of numbers
      expect(() => schema.parse(901234567)).toThrow("Invalid Taiwan mobile phone format") // Invalid because missing leading 0
    })

    it("should trim whitespace", () => {
      const schema = twMobile(true)

      expect(schema.parse("  0901234567  ")).toBe("0901234567")
      expect(schema.parse("\t0911234567\n")).toBe("0911234567")
    })
  })

  describe("utility function", () => {
    describe("validateTaiwanMobile", () => {
      it("should correctly validate Taiwan mobile phone numbers", () => {
        // Valid numbers
        expect(validateTaiwanMobile("0901234567")).toBe(true)
        expect(validateTaiwanMobile("0911234567")).toBe(true)
        expect(validateTaiwanMobile("0921234567")).toBe(true)
        expect(validateTaiwanMobile("0931234567")).toBe(true)
        expect(validateTaiwanMobile("0941234567")).toBe(true)
        expect(validateTaiwanMobile("0951234567")).toBe(true)
        expect(validateTaiwanMobile("0961234567")).toBe(true)
        expect(validateTaiwanMobile("0971234567")).toBe(true)
        expect(validateTaiwanMobile("0981234567")).toBe(true)
        expect(validateTaiwanMobile("0991234567")).toBe(true)

        // Invalid numbers
        expect(validateTaiwanMobile("0801234567")).toBe(false) // Wrong prefix
        expect(validateTaiwanMobile("1901234567")).toBe(false) // Wrong prefix
        expect(validateTaiwanMobile("090123456")).toBe(false) // Too short
        expect(validateTaiwanMobile("09012345678")).toBe(false) // Too long
        expect(validateTaiwanMobile("901234567")).toBe(false) // Missing leading 0
        expect(validateTaiwanMobile("")).toBe(false) // Empty
        expect(validateTaiwanMobile("abcdefghij")).toBe(false) // Non-numeric
      })
    })
  })

  describe("i18n support", () => {
    it("should use English messages by default", () => {
      setLocale("en-US")
      const schema = twMobile(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("0801234567")).toThrow("Invalid Taiwan mobile phone format")
    })

    it("should use Chinese messages when locale is zh-TW", () => {
      setLocale("zh-TW")
      const schema = twMobile(true)

      expect(() => schema.parse("")).toThrow("必填")
      expect(() => schema.parse("0801234567")).toThrow("無效的手機號碼格式")
    })

    it("should accept valid format even when not in whitelist", () => {
      setLocale("en-US")
      const schema = twMobile(true, {
        whitelist: ["0901234567"],
      })

      // Valid format, not in whitelist - should pass
      expect(schema.parse("0911234567")).toBe("0911234567")

      setLocale("zh-TW")
      expect(schema.parse("0921234567")).toBe("0921234567")
    })

    it("should support custom i18n messages", () => {
      const schema = twMobile(true, {
        i18n: {
          "en-US": {
            required: "Mobile phone is required",
            invalid: "Mobile phone format is invalid",
            notInWhitelist: "Mobile phone not allowed",
          },
          "zh-TW": {
            required: "請輸入手機號碼",
            invalid: "手機號碼格式錯誤",
            notInWhitelist: "手機號碼不被允許",
          },
        },
      })

      setLocale("en-US")
      expect(() => schema.parse("")).toThrow("Mobile phone is required")
      expect(() => schema.parse("0801234567")).toThrow("Mobile phone format is invalid")

      setLocale("zh-TW")
      expect(() => schema.parse("")).toThrow("請輸入手機號碼")
      expect(() => schema.parse("0801234567")).toThrow("手機號碼格式錯誤")
    })

    it("should support custom invalid messages", () => {
      const schema = twMobile(true, {
        whitelist: ["0901234567"],
        i18n: {
          "en-US": {
            invalid: "This mobile phone format is not valid",
          },
          "zh-TW": {
            invalid: "此手機號碼格式無效",
          },
        },
      })

      setLocale("en-US")
      expect(() => schema.parse("0801234567")).toThrow("This mobile phone format is not valid")

      setLocale("zh-TW")
      expect(() => schema.parse("0801234567")).toThrow("此手機號碼格式無效")
    })
  })

  describe("real world Taiwan mobile phone numbers", () => {
    it("should validate all carrier prefixes", () => {
      const schema = twMobile(true)

      // Test all valid Taiwan mobile prefixes (090-099)
      const validPrefixes = ["090", "091", "092", "093", "094", "095", "096", "097", "098", "099"]

      validPrefixes.forEach((prefix) => {
        const phoneNumber = prefix + "1234567"
        expect(schema.parse(phoneNumber)).toBe(phoneNumber)
      })
    })

    it("should reject non-mobile phone prefixes", () => {
      const schema = twMobile(true)

      // Test invalid prefixes
      const invalidPrefixes = ["080", "081", "082", "083", "084", "085", "086", "087", "088", "089"]

      invalidPrefixes.forEach((prefix) => {
        const phoneNumber = prefix + "1234567"
        expect(() => schema.parse(phoneNumber)).toThrow("Invalid Taiwan mobile phone format")
      })
    })

    it("should validate realistic phone number patterns", () => {
      const schema = twMobile(true)

      const realPhoneNumbers = ["0901234567", "0912345678", "0923456789", "0934567890", "0945678901", "0956789012", "0967890123", "0978901234", "0989012345", "0990123456"]

      realPhoneNumbers.forEach((phone) => {
        expect(schema.parse(phone)).toBe(phone)
      })
    })
  })

  describe("edge cases", () => {
    it("should handle various input types", () => {
      const schema = twMobile(true)

      // Test different input types that should be converted to string
      expect(schema.parse("0901234567")).toBe("0901234567")
    })

    it("should handle empty and whitespace inputs", () => {
      const schema = twMobile(true)
      const optionalSchema = twMobile(false)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("   ")).toThrow("Required")
      expect(() => schema.parse("\t\n")).toThrow("Required")

      expect(optionalSchema.parse("")).toBe(null)
      expect(optionalSchema.parse("   ")).toBe(null)
      expect(optionalSchema.parse("\t\n")).toBe(null)
    })

    it("should preserve valid format after transformation", () => {
      const schema = twMobile(true, {
        transform: (val) => val.replace(/[^0-9]/g, ""),
      })

      expect(schema.parse("090-123-4567")).toBe("0901234567")
      expect(schema.parse("090 123 4567")).toBe("0901234567")
      // Test with letters that should be filtered out, leaving a valid number
      expect(schema.parse("090abc123def4567")).toBe("0901234567")
    })

    it("should work with complex whitelist scenarios", () => {
      const schema = twMobile(false, { whitelist: ["0901234567", "emergency", "custom-contact-123", ""] })

      // Allowlist scenarios
      expect(schema.parse("0901234567")).toBe("0901234567")
      expect(schema.parse("emergency")).toBe("emergency")
      expect(schema.parse("custom-contact-123")).toBe("custom-contact-123")
      expect(schema.parse("")).toBe("")

      // Valid format but not in the allowlist - should pass
      expect(schema.parse("0911234567")).toBe("0911234567")

      // Invalid format and not in allowlist - should fail
      expect(() => schema.parse("other-value")).toThrow("Invalid Taiwan mobile phone format")
    })
  })
})
