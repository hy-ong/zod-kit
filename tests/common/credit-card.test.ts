import { describe, it, expect, beforeEach } from "vitest"
import { creditCard, setLocale, validateCreditCard, detectCardType } from "../../src"

describe("creditCard(true) validator", () => {
  beforeEach(() => setLocale("en-US"))

  describe("basic functionality", () => {
    it("should validate correct Luhn numbers", () => {
      const schema = creditCard(true)

      expect(schema.parse("4111111111111111")).toBe("4111111111111111")
      expect(schema.parse("4012888888881881")).toBe("4012888888881881")
      expect(schema.parse("5500000000000004")).toBe("5500000000000004")
      expect(schema.parse("5105105105105100")).toBe("5105105105105100")
      expect(schema.parse("378282246310005")).toBe("378282246310005")
      expect(schema.parse("371449635398431")).toBe("371449635398431")
      expect(schema.parse("3530111333300000")).toBe("3530111333300000")
      expect(schema.parse("6011111111111117")).toBe("6011111111111117")
      expect(schema.parse("6200000000000005")).toBe("6200000000000005")
    })

    it("should reject invalid Luhn numbers", () => {
      const schema = creditCard(true)

      expect(() => schema.parse("4111111111111112")).toThrow("Invalid credit card number")
      expect(() => schema.parse("1234567890123456")).toThrow("Invalid credit card number")
    })
  })

  describe("card type detection", () => {
    it("should detect Visa cards", () => {
      const schema = creditCard(true, { cardType: "visa" })

      expect(schema.parse("4111111111111111")).toBe("4111111111111111")
      expect(schema.parse("4012888888881881")).toBe("4012888888881881")
    })

    it("should detect Mastercard cards", () => {
      const schema = creditCard(true, { cardType: "mastercard" })

      expect(schema.parse("5500000000000004")).toBe("5500000000000004")
      expect(schema.parse("5105105105105100")).toBe("5105105105105100")
    })

    it("should detect AMEX cards", () => {
      const schema = creditCard(true, { cardType: "amex" })

      expect(schema.parse("378282246310005")).toBe("378282246310005")
      expect(schema.parse("371449635398431")).toBe("371449635398431")
    })

    it("should detect JCB cards", () => {
      const schema = creditCard(true, { cardType: "jcb" })

      expect(schema.parse("3530111333300000")).toBe("3530111333300000")
    })

    it("should detect Discover cards", () => {
      const schema = creditCard(true, { cardType: "discover" })

      expect(schema.parse("6011111111111117")).toBe("6011111111111117")
    })

    it("should detect UnionPay cards", () => {
      const schema = creditCard(true, { cardType: "unionpay" })

      expect(schema.parse("6200000000000005")).toBe("6200000000000005")
    })
  })

  describe("card type filtering", () => {
    it("should reject cards not matching the required type", () => {
      const visaOnly = creditCard(true, { cardType: "visa" })

      expect(() => visaOnly.parse("5500000000000004")).toThrow("Invalid credit card number")
      expect(() => visaOnly.parse("378282246310005")).toThrow("Invalid credit card number")
      expect(() => visaOnly.parse("3530111333300000")).toThrow("Invalid credit card number")
    })

    it("should accept multiple card types", () => {
      const visaOrMc = creditCard(true, { cardType: ["visa", "mastercard"] })

      expect(visaOrMc.parse("4111111111111111")).toBe("4111111111111111")
      expect(visaOrMc.parse("5500000000000004")).toBe("5500000000000004")
      expect(() => visaOrMc.parse("378282246310005")).toThrow("Invalid credit card number")
    })

    it("should accept any card type when 'any' is specified", () => {
      const anyType = creditCard(true, { cardType: "any" })

      expect(anyType.parse("4111111111111111")).toBe("4111111111111111")
      expect(anyType.parse("5500000000000004")).toBe("5500000000000004")
      expect(anyType.parse("378282246310005")).toBe("378282246310005")
      expect(anyType.parse("3530111333300000")).toBe("3530111333300000")
      expect(anyType.parse("6011111111111117")).toBe("6011111111111117")
      expect(anyType.parse("6200000000000005")).toBe("6200000000000005")
    })

    it("should accept any card type when 'any' is included in array", () => {
      const withAny = creditCard(true, { cardType: ["any", "visa"] })

      expect(withAny.parse("5500000000000004")).toBe("5500000000000004")
      expect(withAny.parse("378282246310005")).toBe("378282246310005")
    })
  })

  describe("whitelist", () => {
    it("should accept whitelisted card numbers", () => {
      const schema = creditCard(true, { whitelist: ["4111111111111111", "5500000000000004"] })

      expect(schema.parse("4111111111111111")).toBe("4111111111111111")
      expect(schema.parse("5500000000000004")).toBe("5500000000000004")
    })

    it("should reject non-whitelisted card numbers", () => {
      const schema = creditCard(true, { whitelist: ["4111111111111111"] })

      expect(() => schema.parse("5500000000000004")).toThrow("Credit card number is not in the allowed list")
    })

    it("should normalize whitelist entries by stripping spaces and hyphens", () => {
      const schema = creditCard(true, { whitelist: ["4111-1111-1111-1111"] })

      expect(schema.parse("4111111111111111")).toBe("4111111111111111")
    })
  })

  describe("required/optional behavior", () => {
    it("should handle required=true", () => {
      const schema = creditCard(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse(null)).toThrow()
      expect(() => schema.parse(undefined)).toThrow()
    })

    it("should handle required=false", () => {
      const schema = creditCard(false)

      expect(schema.parse("")).toBe(null)
      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
      expect(schema.parse("4111111111111111")).toBe("4111111111111111")
    })

    it("should use default values", () => {
      const requiredSchema = creditCard(true, { defaultValue: "4111111111111111" })
      const optionalSchema = creditCard(false, { defaultValue: "4111111111111111" })

      expect(requiredSchema.parse("")).toBe("4111111111111111")
      expect(optionalSchema.parse("")).toBe("4111111111111111")
    })
  })

  describe("transform function", () => {
    it("should apply custom transform before validation", () => {
      const schema = creditCard(true, {
        transform: (val) => val.toUpperCase(),
      })

      expect(schema.parse("4111111111111111")).toBe("4111111111111111")
    })

    it("should apply transform on the stripped value", () => {
      const transformed: string[] = []
      const schema = creditCard(true, {
        transform: (val) => {
          transformed.push(val)
          return val
        },
      })

      schema.parse("4111 1111 1111 1111")
      expect(transformed[0]).toBe("4111111111111111")
    })
  })

  describe("input preprocessing", () => {
    it("should strip spaces from input", () => {
      const schema = creditCard(true)

      expect(schema.parse("4111 1111 1111 1111")).toBe("4111111111111111")
      expect(schema.parse("  4111 1111 1111 1111  ")).toBe("4111111111111111")
    })

    it("should strip hyphens from input", () => {
      const schema = creditCard(true)

      expect(schema.parse("4111-1111-1111-1111")).toBe("4111111111111111")
      expect(schema.parse("5500-0000-0000-0004")).toBe("5500000000000004")
    })

    it("should handle mixed spaces and hyphens", () => {
      const schema = creditCard(true)

      expect(schema.parse("4111 - 1111 - 1111 - 1111")).toBe("4111111111111111")
    })

    it("should handle string conversion from numbers", () => {
      const schema = creditCard(true)

      expect(schema.parse(4111111111111111)).toBe("4111111111111111")
    })
  })

  describe("i18n support", () => {
    it("should use English messages by default", () => {
      setLocale("en-US")
      const schema = creditCard(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("4111111111111112")).toThrow("Invalid credit card number")
    })

    it("should use Chinese messages when locale is zh-TW", () => {
      setLocale("zh-TW")
      const schema = creditCard(true)

      expect(() => schema.parse("")).toThrow("必填")
      expect(() => schema.parse("4111111111111112")).toThrow("無效的信用卡號碼")
    })

    it("should support custom i18n messages", () => {
      const schema = creditCard(true, {
        i18n: {
          "en-US": {
            required: "Card number is required",
            invalid: "Card number is invalid",
            notInWhitelist: "Card not allowed",
          },
          "zh-TW": {
            required: "請輸入信用卡號",
            invalid: "信用卡號格式錯誤",
            notInWhitelist: "此卡號不允許使用",
          },
        },
      })

      setLocale("en-US")
      expect(() => schema.parse("")).toThrow("Card number is required")
      expect(() => schema.parse("4111111111111112")).toThrow("Card number is invalid")

      setLocale("zh-TW")
      expect(() => schema.parse("")).toThrow("請輸入信用卡號")
      expect(() => schema.parse("4111111111111112")).toThrow("信用卡號格式錯誤")
    })

    it("should use custom notInWhitelist message", () => {
      const schema = creditCard(true, {
        whitelist: ["4111111111111111"],
        i18n: {
          "en-US": {
            notInWhitelist: "This card is not accepted",
          },
        },
      })

      expect(() => schema.parse("5500000000000004")).toThrow("This card is not accepted")
    })
  })

  describe("edge cases", () => {
    it("should reject numbers that are too short", () => {
      const schema = creditCard(true)

      expect(() => schema.parse("411111111111")).toThrow("Invalid credit card number")
      expect(() => schema.parse("41111")).toThrow("Invalid credit card number")
      expect(() => schema.parse("1")).toThrow("Invalid credit card number")
    })

    it("should reject numbers that are too long", () => {
      const schema = creditCard(true)

      expect(() => schema.parse("41111111111111111111")).toThrow("Invalid credit card number")
    })

    it("should reject non-numeric input", () => {
      const schema = creditCard(true)

      expect(() => schema.parse("abcdefghijklmnop")).toThrow("Invalid credit card number")
      expect(() => schema.parse("4111-ABCD-1111-1111")).toThrow("Invalid credit card number")
      expect(() => schema.parse("41111111111111xx")).toThrow("Invalid credit card number")
    })

    it("should handle 'null' and 'undefined' string values as required", () => {
      const schema = creditCard(true)

      expect(() => schema.parse("null")).toThrow("Required")
      expect(() => schema.parse("undefined")).toThrow("Required")
    })

    it("should handle empty and whitespace inputs", () => {
      const schema = creditCard(true)
      const optionalSchema = creditCard(false)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("   ")).toThrow("Required")

      expect(optionalSchema.parse("")).toBe(null)
      expect(optionalSchema.parse("   ")).toBe(null)
    })
  })

  describe("utility functions", () => {
    describe("validateCreditCard", () => {
      it("should return true for valid Luhn numbers", () => {
        expect(validateCreditCard("4111111111111111")).toBe(true)
        expect(validateCreditCard("4012888888881881")).toBe(true)
        expect(validateCreditCard("5500000000000004")).toBe(true)
        expect(validateCreditCard("5105105105105100")).toBe(true)
        expect(validateCreditCard("378282246310005")).toBe(true)
        expect(validateCreditCard("371449635398431")).toBe(true)
        expect(validateCreditCard("3530111333300000")).toBe(true)
        expect(validateCreditCard("6011111111111117")).toBe(true)
        expect(validateCreditCard("6200000000000005")).toBe(true)
      })

      it("should return false for invalid Luhn numbers", () => {
        expect(validateCreditCard("4111111111111112")).toBe(false)
        expect(validateCreditCard("1234567890123456")).toBe(false)
      })

      it("should return false for non-numeric strings", () => {
        expect(validateCreditCard("abcdefghijklmnop")).toBe(false)
        expect(validateCreditCard("")).toBe(false)
      })

      it("should return false for wrong-length strings", () => {
        expect(validateCreditCard("41111")).toBe(false)
        expect(validateCreditCard("41111111111111111111")).toBe(false)
      })

      it("should handle strings with spaces and hyphens", () => {
        expect(validateCreditCard("4111 1111 1111 1111")).toBe(true)
        expect(validateCreditCard("4111-1111-1111-1111")).toBe(true)
      })
    })

    describe("detectCardType", () => {
      it("should detect Visa", () => {
        expect(detectCardType("4111111111111111")).toBe("visa")
        expect(detectCardType("4012888888881881")).toBe("visa")
      })

      it("should detect Mastercard", () => {
        expect(detectCardType("5500000000000004")).toBe("mastercard")
        expect(detectCardType("5105105105105100")).toBe("mastercard")
      })

      it("should detect AMEX", () => {
        expect(detectCardType("378282246310005")).toBe("amex")
        expect(detectCardType("371449635398431")).toBe("amex")
      })

      it("should detect JCB", () => {
        expect(detectCardType("3530111333300000")).toBe("jcb")
      })

      it("should detect Discover", () => {
        expect(detectCardType("6011111111111117")).toBe("discover")
      })

      it("should detect UnionPay", () => {
        expect(detectCardType("6200000000000005")).toBe("unionpay")
      })

      it("should return 'any' for unrecognized prefixes", () => {
        expect(detectCardType("9999999999999999")).toBe("any")
        expect(detectCardType("1111111111111111")).toBe("any")
      })

      it("should handle strings with spaces and hyphens", () => {
        expect(detectCardType("4111 1111 1111 1111")).toBe("visa")
        expect(detectCardType("5500-0000-0000-0004")).toBe("mastercard")
      })
    })
  })
})
