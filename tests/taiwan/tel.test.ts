import { describe, it, expect, beforeEach } from "vitest"
import { twTel, setLocale, validateTaiwanTel } from "../../src"

describe("Taiwan twTel(true) validator", () => {
  beforeEach(() => setLocale("en"))

  describe("basic functionality", () => {
    it("should validate correct Taiwan landline telephone numbers", () => {
      const schema = twTel(true)

      // Valid Taiwan landline numbers (various formats)
      // Taipei (02) - requires 10 digits total, first digit after 02 must be 2,3,5-8
      expect(schema.parse("0223456789")).toBe("0223456789") // 02-2345-6789 (10 digits)
      expect(schema.parse("0232345678")).toBe("0232345678") // 02-3234-5678 (10 digits)

      // Kaohsiung (07) - requires 9 digits total, the first digit after 07 must be 2-9
      expect(schema.parse("072345678")).toBe("072345678") // 07-234-5678 (9 digits)
      expect(schema.parse("073456789")).toBe("073456789") // 07-345-6789 (9 digits)

      // Taichung (04) - requires 9 digits total
      expect(schema.parse("041234567")).toBe("041234567") // 04-123-4567 (9 digits)
      expect(schema.parse("043456789")).toBe("043456789") // 04-345-6789 (9 digits)

      // Tainan (06) - requires 9 digits total
      expect(schema.parse("061234567")).toBe("061234567") // 06-123-4567 (9 digits)
      expect(schema.parse("063456789")).toBe("063456789") // 06-345-6789 (9 digits)

      // Other areas
      expect(schema.parse("031234567")).toBe("031234567") // 03-123-4567 (9 digits)
      expect(schema.parse("051234567")).toBe("051234567") // 05-123-4567 (9 digits)
      expect(schema.parse("084234567")).toBe("084234567") // 08-423-4567 (9 digits, 08 area code with 4)
      expect(schema.parse("087234567")).toBe("087234567") // 08-723-4567 (9 digits, 08 area code with 7)

      // 3-digit area codes
      expect(schema.parse("082234567")).toBe("082234567") // 082-234567 (9 digits, Kinmen)
      expect(schema.parse("089234567")).toBe("089234567") // 089-234567 (9 digits, Taitung)

      // 4-digit area codes
      expect(schema.parse("082661234")).toBe("082661234") // 0826-61234 (9 digits, Wuqiu)
      expect(schema.parse("083621234")).toBe("083621234") // 0836-21234 (9 digits, Matsu)
    })

    it("should validate numbers with separators", () => {
      const schema = twTel(true)

      // Numbers with dashes
      expect(schema.parse("02-2345-6789")).toBe("02-2345-6789")
      expect(schema.parse("07-234-5678")).toBe("07-234-5678")
      expect(schema.parse("082-234567")).toBe("082-234567")

      // Numbers with spaces
      expect(schema.parse("02 2345 6789")).toBe("02 2345 6789")
      expect(schema.parse("07 234 5678")).toBe("07 234 5678")
      expect(schema.parse("082 234567")).toBe("082 234567")

      // Mixed separators
      expect(schema.parse("02-2345 6789")).toBe("02-2345 6789")
      expect(schema.parse("07 234-5678")).toBe("07 234-5678")
    })

    it("should reject invalid Taiwan telephone numbers", () => {
      const schema = twTel(true)

      // Invalid formats
      expect(() => schema.parse("123456789")).toThrow("Invalid Taiwan telephone format") // Missing leading 0
      expect(() => schema.parse("01234567890")).toThrow("Invalid Taiwan telephone format") // Too long
      expect(() => schema.parse("0123456")).toThrow("Invalid Taiwan telephone format") // Too short
      expect(() => schema.parse("1012345678")).toThrow("Invalid Taiwan telephone format") // Wrong prefix (10)
      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("abcdefghij")).toThrow("Invalid Taiwan telephone format")

      // Invalid area codes
      expect(() => schema.parse("0012345678")).toThrow("Invalid Taiwan telephone format") // 00 not valid
      expect(() => schema.parse("0112345678")).toThrow("Invalid Taiwan telephone format") // 01 not valid
      expect(() => schema.parse("0912345678")).toThrow("Invalid Taiwan telephone format") // 09 is mobile, not landline

      // Invalid 3-digit codes
      expect(() => schema.parse("081123456")).toThrow("Invalid Taiwan telephone format") // 081 not valid
      expect(() => schema.parse("083123456")).toThrow("Invalid Taiwan telephone format") // 083 not valid

      // Wrong length for valid area codes
      expect(() => schema.parse("02123456789")).toThrow("Invalid Taiwan telephone format") // Too long for 02
      expect(() => schema.parse("82123456")).toThrow("Invalid Taiwan telephone format") // Missing leading 0
    })

    it("should handle whitespace trimming", () => {
      const schema = twTel(true)

      expect(schema.parse("  0223456789  ")).toBe("0223456789")
      expect(schema.parse("\t072345678\n")).toBe("072345678")
    })
  })

  describe("whitelist functionality", () => {
    it("should accept any string in whitelist regardless of format", () => {
      const schema = twTel(true, {
        whitelist: ["custom-tel", "emergency-line", "0912345678"],
      })

      // Allowlist entries should be accepted even if they don't match Taiwan telephone formats
      expect(schema.parse("custom-tel")).toBe("custom-tel")
      expect(schema.parse("emergency-line")).toBe("emergency-line")
      expect(schema.parse("0912345678")).toBe("0912345678") // Mobile number but in allowlist

      // Valid telephone numbers not in the allowlist should be rejected
      expect(() => schema.parse("0212345678")).toThrow("Not in allowed telephone list")
      expect(() => schema.parse("0711111111")).toThrow("Not in allowed telephone list")
    })

    it("should reject values not in whitelist when whitelist is provided", () => {
      const schema = twTel(true, {
        whitelist: ["allowed-value", "0223456789"],
      })

      expect(() => schema.parse("0312345678")).toThrow("Not in allowed telephone list")
      expect(() => schema.parse("invalid-value")).toThrow("Not in allowed telephone list")
    })

    it("should work with empty whitelist", () => {
      const schema = twTel(true, {
        whitelist: [],
      })

      // With empty allowlist, should still validate a telephone format
      expect(schema.parse("0223456789")).toBe("0223456789")
      expect(() => schema.parse("0912345678")).toThrow("Invalid Taiwan telephone format")
    })

    it("should prioritize whitelist over format validation", () => {
      const schema = twTel(false, { whitelist: ["not-a-phone", "123", ""] })

      // These should be accepted despite being invalid telephone formats
      expect(schema.parse("not-a-phone")).toBe("not-a-phone")
      expect(schema.parse("123")).toBe("123")
      expect(schema.parse("")).toBe("")
    })
  })

  describe("required/optional behavior", () => {
    it("should handle required=true (default)", () => {
      const schema = twTel(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse(null)).toThrow()
      expect(() => schema.parse(undefined)).toThrow()
    })

    it("should handle required=false", () => {
      const schema = twTel(false)

      expect(schema.parse("")).toBe(null)
      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
      expect(schema.parse("0223456789")).toBe("0223456789")
    })

    it("should use default values", () => {
      const requiredSchema = twTel(true, { defaultValue: "0223456789" })
      const optionalSchema = twTel(false, { defaultValue: "0223456789" })

      expect(requiredSchema.parse("")).toBe("0223456789")
      expect(optionalSchema.parse("")).toBe("0223456789")
    })

    it("should handle whitelist with optional fields", () => {
      const schema = twTel(false, { whitelist: ["custom-value", "0223456789"] })

      expect(schema.parse("")).toBe(null)
      expect(schema.parse("custom-value")).toBe("custom-value")
      expect(schema.parse("0223456789")).toBe("0223456789")
      expect(() => schema.parse("0312345678")).toThrow("Not in allowed telephone list")
    })
  })

  describe("transform function", () => {
    it("should apply custom transform", () => {
      const schema = twTel(true, {
        transform: (val) => val.replace(/[-\s]/g, ""),
      })

      expect(schema.parse("02-2345-6789")).toBe("0223456789")
      expect(schema.parse("07 234 5678")).toBe("072345678")
    })

    it("should apply transform before validation", () => {
      const schema = twTel(true, {
        transform: (val) => val.replace(/\s+/g, ""),
      })

      expect(schema.parse(" 02 234 5678 9 ")).toBe("0223456789")
      expect(() => schema.parse(" 09 123 4567 8 ")).toThrow("Invalid Taiwan telephone format")
    })

    it("should work with whitelist after transform", () => {
      const schema = twTel(true, {
        transform: (val) => val.replace(/[-\s]/g, ""),
        whitelist: ["0223456789", "customvalue"],
      })

      expect(schema.parse("customvalue")).toBe("customvalue")
      expect(() => schema.parse("03-123-4567")).toThrow("Not in allowed telephone list")
    })
  })

  describe("input preprocessing", () => {
    it("should handle string conversion", () => {
      const schema = twTel(true)

      // Test string conversion of numbers
      expect(() => schema.parse(212345678)).toThrow("Invalid Taiwan telephone format") // Invalid because missing leading 0
    })

    it("should trim whitespace", () => {
      const schema = twTel(true)

      expect(schema.parse("  0223456789  ")).toBe("0223456789")
      expect(schema.parse("\t072345678\n")).toBe("072345678")
    })
  })

  describe("utility function", () => {
    describe("validateTaiwanTel", () => {
      it("should correctly validate Taiwan telephone numbers", () => {
        // Valid numbers
        expect(validateTaiwanTel("0223456789")).toBe(true) // Taipei
        expect(validateTaiwanTel("072345678")).toBe(true) // Kaohsiung
        expect(validateTaiwanTel("041234567")).toBe(true) // Taichung
        expect(validateTaiwanTel("037234567")).toBe(true) // Miaoli
        expect(validateTaiwanTel("0492345678")).toBe(true) // Nantou
        expect(validateTaiwanTel("084234567")).toBe(true) // Pingtung
        expect(validateTaiwanTel("082234567")).toBe(true) // Kinmen
        expect(validateTaiwanTel("089234567")).toBe(true) // Taitung
        expect(validateTaiwanTel("082661234")).toBe(true) // Wuqiu
        expect(validateTaiwanTel("083621234")).toBe(true) // Matsu

        // Valid with separators
        expect(validateTaiwanTel("02-2345-6789")).toBe(true)
        expect(validateTaiwanTel("07 234 5678")).toBe(true)
        expect(validateTaiwanTel("082-234567")).toBe(true)

        // Invalid numbers
        expect(validateTaiwanTel("0912345678")).toBe(false) // Mobile prefix
        expect(validateTaiwanTel("1212345678")).toBe(false) // Wrong prefix
        expect(validateTaiwanTel("02123456")).toBe(false) // Too short for 02
        expect(validateTaiwanTel("021234567890")).toBe(false) // Too long
        expect(validateTaiwanTel("212345678")).toBe(false) // Missing leading 0
        expect(validateTaiwanTel("")).toBe(false) // Empty
        expect(validateTaiwanTel("abcdefghij")).toBe(false) // Non-numeric
        expect(validateTaiwanTel("081123456")).toBe(false) // Invalid 3-digit area code
        expect(validateTaiwanTel("0214567890")).toBe(false) // Invalid first digit for 02
        expect(validateTaiwanTel("071234567")).toBe(false) // Invalid first digit for 07
        expect(validateTaiwanTel("037134567")).toBe(false) // Invalid first digit for 037
        expect(validateTaiwanTel("081234567")).toBe(false) // Invalid first digit for 08
      })
    })
  })

  describe("i18n support", () => {
    it("should use English messages by default", () => {
      setLocale("en")
      const schema = twTel(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("0912345678")).toThrow("Invalid Taiwan telephone format")
    })

    it("should use Chinese messages when locale is zh-TW", () => {
      setLocale("zh-TW")
      const schema = twTel(true)

      expect(() => schema.parse("")).toThrow("必填")
      expect(() => schema.parse("0912345678")).toThrow("無效的市話號碼格式")
    })

    it("should support whitelist error messages", () => {
      setLocale("en")
      const schema = twTel(true, {
        whitelist: ["0212345678"],
      })

      expect(() => schema.parse("0312345678")).toThrow("Not in allowed telephone list")

      setLocale("zh-TW")
      expect(() => schema.parse("0312345678")).toThrow("不在允許的市話號碼清單中")
    })

    it("should support custom i18n messages", () => {
      const schema = twTel(true, {
        i18n: {
          en: {
            required: "Telephone number is required",
            invalid: "Telephone number format is invalid",
            notInWhitelist: "Telephone number not allowed",
          },
          "zh-TW": {
            required: "請輸入電話號碼",
            invalid: "電話號碼格式錯誤",
            notInWhitelist: "電話號碼不被允許",
          },
        },
      })

      setLocale("en")
      expect(() => schema.parse("")).toThrow("Telephone number is required")
      expect(() => schema.parse("0912345678")).toThrow("Telephone number format is invalid")

      setLocale("zh-TW")
      expect(() => schema.parse("")).toThrow("請輸入電話號碼")
      expect(() => schema.parse("0912345678")).toThrow("電話號碼格式錯誤")
    })

    it("should support custom whitelist messages", () => {
      const schema = twTel(true, {
        whitelist: ["0212345678"],
        i18n: {
          en: {
            notInWhitelist: "This telephone number is not allowed",
          },
          "zh-TW": {
            notInWhitelist: "此電話號碼不被允許",
          },
        },
      })

      setLocale("en")
      expect(() => schema.parse("0312345678")).toThrow("This telephone number is not allowed")

      setLocale("zh-TW")
      expect(() => schema.parse("0312345678")).toThrow("此電話號碼不被允許")
    })
  })

  describe("real world Taiwan telephone numbers", () => {
    it("should validate all major area codes", () => {
      const schema = twTel(true)

      // Test Taiwan landline area codes using exact working numbers from a utility test
      const validAreaCodes = [
        { code: "02", numbers: ["0223456789"] }, // Taipei (10 digits, first digit 2) - from utility test ✓
        { code: "04", numbers: ["041234567"] }, // Taichung (9 digits) - from utility test ✓
        { code: "037", numbers: ["037234567"] }, // Miaoli (9 digits, first digit 2) - from utility test ✓
        { code: "049", numbers: ["0492345678"] }, // Nantou (10 digits, first digit 2) - from utility test ✓
        { code: "07", numbers: ["072345678"] }, // Kaohsiung (9 digits, first digit 2) - from utility test ✓
        { code: "08", numbers: ["084234567"] }, // Pingtung (9 digits, first digit 4) - from utility test ✓
        { code: "082", numbers: ["082234567"] }, // Kinmen (9 digits, first digit 2) - from utility test ✓
        { code: "089", numbers: ["089234567"] }, // Taitung (9 digits, first digit 2) - from utility test ✓
        { code: "0826", numbers: ["082661234"] }, // Wuqiu (9 digits, first digit 6) - from utility test ✓
        { code: "0836", numbers: ["083621234"] }, // Matsu (9 digits, first digit 2) - from utility test ✓
      ]

      validAreaCodes.forEach(({ numbers }) => {
        numbers.forEach((number) => {
          expect(schema.parse(number)).toBe(number)
        })
      })
    })

    it("should reject mobile phone prefixes", () => {
      const schema = twTel(true)

      // Test invalid mobile prefixes (090-099)
      const mobilePrefixes = ["090", "091", "092", "093", "094", "095", "096", "097", "098", "099"]

      mobilePrefixes.forEach((prefix) => {
        const phoneNumber = prefix + "1234567"
        expect(() => schema.parse(phoneNumber)).toThrow("Invalid Taiwan telephone format")
      })
    })

    it("should validate realistic landline number patterns", () => {
      const schema = twTel(true)

      const realLandlineNumbers = [
        "0223456789", // Taipei 10-digit (valid first digit 2) - from utility test ✓
        "072345678", // Kaohsiung 9-digit (valid first digit 2) - from utility test ✓
        "041234567", // Taichung 9-digit - from utility test ✓
        "037234567", // Miaoli 9-digit (valid first digit 2) - from utility test ✓
        "0492345678", // Nantou 10-digit (valid first digit 2) - from utility test ✓
        "084234567", // Pingtung 9-digit (valid first digit 4) - from utility test ✓
        "082234567", // Kinmen 9-digit (valid first digit 2) - from utility test ✓
        "089234567", // Taitung 9-digit (valid first digit 2) - from utility test ✓
        "082661234", // Wuqiu 9-digit (valid first digit 6) - from utility test ✓
        "083621234", // Matsu (valid) - from utility test ✓
      ]

      realLandlineNumbers.forEach((phone) => {
        expect(schema.parse(phone)).toBe(phone)
      })
    })
  })

  describe("edge cases", () => {
    it("should handle various input types", () => {
      const schema = twTel(true)

      // Test different input types that should be converted to string
      expect(schema.parse("0223456789")).toBe("0223456789")
    })

    it("should handle empty and whitespace inputs", () => {
      const schema = twTel(true)
      const optionalSchema = twTel(false)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("   ")).toThrow("Required")
      expect(() => schema.parse("\t\n")).toThrow("Required")

      expect(optionalSchema.parse("")).toBe(null)
      expect(optionalSchema.parse("   ")).toBe(null)
      expect(optionalSchema.parse("\t\n")).toBe(null)
    })

    it("should preserve valid format after transformation", () => {
      const schema = twTel(true, {
        transform: (val) => val.replace(/[^0-9]/g, ""),
      })

      expect(schema.parse("02-234-56789")).toBe("0223456789")
      expect(schema.parse("07 234 5678")).toBe("072345678")
      // Test with letters that should be filtered out, leaving a valid number
      expect(schema.parse("02abc234def56789")).toBe("0223456789")
    })

    it("should work with complex whitelist scenarios", () => {
      const schema = twTel(false, { whitelist: ["0223456789", "emergency", "custom-contact-123", ""] })

      // Allowlist scenarios
      expect(schema.parse("0223456789")).toBe("0223456789")
      expect(schema.parse("emergency")).toBe("emergency")
      expect(schema.parse("custom-contact-123")).toBe("custom-contact-123")
      expect(schema.parse("")).toBe("")

      // Not in the allowlist
      expect(() => schema.parse("0312345678")).toThrow("Not in allowed telephone list")
      expect(() => schema.parse("other-value")).toThrow("Not in allowed telephone list")
    })

    it("should handle boundary cases for area codes", () => {
      const schema = twTel(true)

      // Test minimum and maximum valid lengths for different area codes
      // 2-digit area codes: 9-10 digits total
      expect(schema.parse("0223456789")).toBe("0223456789") // 10 digits (02 area requires 10)
      expect(() => schema.parse("02123456")).toThrow("Invalid Taiwan telephone format") // 8 digits (too short)
      expect(() => schema.parse("021234567890")).toThrow("Invalid Taiwan telephone format") // 12 digits (too long)

      // 3-digit area codes: 9 digits total
      expect(schema.parse("082234567")).toBe("082234567") // 9 digits (082 area, first digit 2)
      expect(() => schema.parse("08212345")).toThrow("Invalid Taiwan telephone format") // 8 digits (too short)
      expect(() => schema.parse("0821234567")).toThrow("Invalid Taiwan telephone format") // 10 digits (too long)

      // 4-digit area codes: 9 digits total
      expect(schema.parse("082661234")).toBe("082661234") // 9 digits (0826 + 6 + 4 digits)
      expect(() => schema.parse("08261234")).toThrow("Invalid Taiwan telephone format") // 8 digits (too short)
      expect(() => schema.parse("0826123456")).toThrow("Invalid Taiwan telephone format") // 10 digits (too long)
    })
  })
})
