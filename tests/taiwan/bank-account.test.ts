import { describe, it, expect, beforeEach } from "vitest"
import { twBankAccount, setLocale, validateTaiwanBankAccount, TAIWAN_BANK_CODES } from "../../src"

describe("Taiwan twBankAccount(true) validator", () => {
  beforeEach(() => setLocale("en-US"))

  describe("basic functionality", () => {
    it("should validate combined bank code + account number", () => {
      const schema = twBankAccount(true)

      expect(schema.parse("004-1234567890")).toBe("004-1234567890")
      expect(schema.parse("808-9876543210")).toBe("808-9876543210")
      expect(schema.parse("822-1234567890123456")).toBe("822-1234567890123456")
    })

    it("should validate account number only (10 digits)", () => {
      const schema = twBankAccount(true)

      expect(schema.parse("1234567890")).toBe("1234567890")
    })

    it("should validate account number only (16 digits)", () => {
      const schema = twBankAccount(true)

      expect(schema.parse("1234567890123456")).toBe("1234567890123456")
    })

    it("should validate account numbers with 10-16 digits", () => {
      const schema = twBankAccount(true)

      expect(schema.parse("1234567890")).toBe("1234567890") // 10 digits
      expect(schema.parse("12345678901")).toBe("12345678901") // 11 digits
      expect(schema.parse("123456789012")).toBe("123456789012") // 12 digits
      expect(schema.parse("1234567890123")).toBe("1234567890123") // 13 digits
      expect(schema.parse("12345678901234")).toBe("12345678901234") // 14 digits
      expect(schema.parse("123456789012345")).toBe("123456789012345") // 15 digits
      expect(schema.parse("1234567890123456")).toBe("1234567890123456") // 16 digits
    })

    it("should reject invalid bank codes (not in list when validateBankCode=true)", () => {
      const schema = twBankAccount(true)

      expect(() => schema.parse("999-1234567890")).toThrow("Invalid bank code")
      expect(() => schema.parse("000-1234567890")).toThrow("Invalid bank code")
    })

    it("should reject non-numeric bank codes", () => {
      const schema = twBankAccount(true)

      expect(() => schema.parse("AB1-1234567890")).toThrow("Invalid bank code")
      expect(() => schema.parse("A12-1234567890")).toThrow("Invalid bank code")
    })

    it("should reject account numbers with fewer than 10 digits", () => {
      const schema = twBankAccount(true)

      expect(() => schema.parse("004-123456789")).toThrow("Invalid account number")
      expect(() => schema.parse("123456789")).toThrow("Invalid account number")
    })

    it("should reject account numbers with more than 16 digits", () => {
      const schema = twBankAccount(true)

      expect(() => schema.parse("004-12345678901234567")).toThrow("Invalid account number")
      expect(() => schema.parse("12345678901234567")).toThrow("Invalid account number")
    })
  })

  describe("validateBankCode option", () => {
    it("should allow any 3-digit bank code when validateBankCode is false", () => {
      const schema = twBankAccount(true, { validateBankCode: false })

      expect(schema.parse("999-1234567890")).toBe("999-1234567890")
      expect(schema.parse("000-1234567890")).toBe("000-1234567890")
      expect(schema.parse("123-1234567890")).toBe("123-1234567890")
    })

    it("should still reject non-numeric bank codes when validateBankCode is false", () => {
      const schema = twBankAccount(true, { validateBankCode: false })

      expect(() => schema.parse("AB1-1234567890")).toThrow("Invalid bank code")
    })
  })

  describe("bankCode option", () => {
    it("should prepend bank code when value has no hyphen", () => {
      const schema = twBankAccount(true, { bankCode: "004" })

      expect(schema.parse("1234567890")).toBe("004-1234567890")
    })

    it("should not prepend bank code when value already has a hyphen", () => {
      const schema = twBankAccount(true, { bankCode: "004" })

      expect(schema.parse("808-1234567890")).toBe("808-1234567890")
    })
  })

  describe("utility function validateTaiwanBankAccount", () => {
    it("should return true for valid bank account formats", () => {
      expect(validateTaiwanBankAccount("004-1234567890")).toBe(true)
      expect(validateTaiwanBankAccount("808-9876543210")).toBe(true)
      expect(validateTaiwanBankAccount("1234567890")).toBe(true)
      expect(validateTaiwanBankAccount("1234567890123456")).toBe(true)
    })

    it("should return false for invalid bank account formats", () => {
      expect(validateTaiwanBankAccount("999-1234567890")).toBe(false) // invalid bank code
      expect(validateTaiwanBankAccount("AB1-1234567890")).toBe(false) // non-numeric bank code
      expect(validateTaiwanBankAccount("004-123456789")).toBe(false) // 9 digits
      expect(validateTaiwanBankAccount("004-12345678901234567")).toBe(false) // 17 digits
      expect(validateTaiwanBankAccount("")).toBe(false)
    })

    it("should respect validateBankCode parameter", () => {
      expect(validateTaiwanBankAccount("999-1234567890", true)).toBe(false)
      expect(validateTaiwanBankAccount("999-1234567890", false)).toBe(true)
    })

    it("should reject malformed hyphenated input", () => {
      expect(validateTaiwanBankAccount("004-123-456")).toBe(false) // multiple hyphens
    })
  })

  describe("TAIWAN_BANK_CODES", () => {
    it("should contain known major bank codes", () => {
      expect(TAIWAN_BANK_CODES["004"]).toBe("台灣銀行")
      expect(TAIWAN_BANK_CODES["808"]).toBe("玉山")
      expect(TAIWAN_BANK_CODES["822"]).toBe("中信")
      expect(TAIWAN_BANK_CODES["700"]).toBe("中華郵政")
      expect(TAIWAN_BANK_CODES["812"]).toBe("台新")
      expect(TAIWAN_BANK_CODES["013"]).toBe("國泰世華")
    })

    it("should not contain invalid bank codes", () => {
      expect(TAIWAN_BANK_CODES["999"]).toBeUndefined()
      expect(TAIWAN_BANK_CODES["000"]).toBeUndefined()
    })

    it("should have string values for all entries", () => {
      for (const [code, name] of Object.entries(TAIWAN_BANK_CODES)) {
        expect(code).toMatch(/^\d{3}$/)
        expect(typeof name).toBe("string")
        expect(name.length).toBeGreaterThan(0)
      }
    })
  })

  describe("required/optional behavior", () => {
    it("should handle required=true", () => {
      const schema = twBankAccount(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse(null)).toThrow()
      expect(() => schema.parse(undefined)).toThrow()
    })

    it("should handle required=false", () => {
      const schema = twBankAccount(false)

      expect(schema.parse("")).toBe(null)
      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
      expect(schema.parse("004-1234567890")).toBe("004-1234567890")
    })

    it("should use default values", () => {
      const requiredSchema = twBankAccount(true, { defaultValue: "004-1234567890" })
      const optionalSchema = twBankAccount(false, { defaultValue: "004-1234567890" })

      expect(requiredSchema.parse("")).toBe("004-1234567890")
      expect(optionalSchema.parse("")).toBe("004-1234567890")
    })
  })

  describe("transform function", () => {
    it("should apply custom transform", () => {
      const schema = twBankAccount(true, {
        transform: (val) => val.replace(/\s+/g, ""),
      })

      expect(schema.parse("004 - 1234567890")).toBe("004-1234567890")
    })

    it("should apply transform before validation", () => {
      const schema = twBankAccount(true, {
        transform: (val) => val.replace(/\s+/g, ""),
      })

      expect(schema.parse("  004-1234567890  ")).toBe("004-1234567890")
    })
  })

  describe("input preprocessing", () => {
    it("should trim whitespace", () => {
      const schema = twBankAccount(true)

      expect(schema.parse("  004-1234567890  ")).toBe("004-1234567890")
      expect(schema.parse("\t1234567890\n")).toBe("1234567890")
    })

    it("should strip internal spaces", () => {
      const schema = twBankAccount(true)

      expect(schema.parse("004-12345 67890")).toBe("004-1234567890")
    })
  })

  describe("i18n support", () => {
    it("should use English messages by default", () => {
      setLocale("en-US")
      const schema = twBankAccount(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("999-1234567890")).toThrow("Invalid bank code")
      expect(() => schema.parse("004-123456789")).toThrow("Invalid account number")
    })

    it("should use Chinese messages when locale is zh-TW", () => {
      setLocale("zh-TW")
      const schema = twBankAccount(true)

      expect(() => schema.parse("")).toThrow("必填")
      expect(() => schema.parse("999-1234567890")).toThrow("無效的銀行代碼")
      expect(() => schema.parse("004-123456789")).toThrow("無效的帳號號碼")
    })

    it("should support custom i18n messages", () => {
      const schema = twBankAccount(true, {
        i18n: {
          "en-US": {
            required: "Bank account is required",
            invalidBankCode: "Bad bank code",
            invalidAccountNumber: "Bad account number",
          },
          "zh-TW": {
            required: "請輸入銀行帳號",
            invalidBankCode: "銀行代碼有誤",
            invalidAccountNumber: "帳號有誤",
          },
        },
      })

      setLocale("en-US")
      expect(() => schema.parse("")).toThrow("Bank account is required")
      expect(() => schema.parse("999-1234567890")).toThrow("Bad bank code")
      expect(() => schema.parse("004-123456789")).toThrow("Bad account number")

      setLocale("zh-TW")
      expect(() => schema.parse("")).toThrow("請輸入銀行帳號")
      expect(() => schema.parse("999-1234567890")).toThrow("銀行代碼有誤")
      expect(() => schema.parse("004-123456789")).toThrow("帳號有誤")
    })
  })

  describe("edge cases", () => {
    it("should handle empty and whitespace inputs", () => {
      const schema = twBankAccount(true)
      const optionalSchema = twBankAccount(false)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("   ")).toThrow("Required")
      expect(() => schema.parse("\t\n")).toThrow("Required")

      expect(optionalSchema.parse("")).toBe(null)
      expect(optionalSchema.parse("   ")).toBe(null)
      expect(optionalSchema.parse("\t\n")).toBe(null)
    })

    it("should handle boundary account lengths", () => {
      const schema = twBankAccount(true)

      // Exactly 10 digits (minimum)
      expect(schema.parse("1234567890")).toBe("1234567890")
      // Exactly 16 digits (maximum)
      expect(schema.parse("1234567890123456")).toBe("1234567890123456")
    })

    it("should reject non-digit account numbers", () => {
      const schema = twBankAccount(true)

      expect(() => schema.parse("004-123456789A")).toThrow("Invalid account number")
      expect(() => schema.parse("abcdefghij")).toThrow("Invalid account number")
    })
  })
})
