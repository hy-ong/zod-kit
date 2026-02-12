import { describe, it, expect, beforeEach } from "vitest"
import { twLicensePlate, setLocale, validateTaiwanLicensePlate } from "../../src"

describe("Taiwan twLicensePlate(true) validator", () => {
  beforeEach(() => setLocale("en-US"))

  describe("basic functionality", () => {
    it("should validate new-style car plates (3 letters + 4 digits)", () => {
      const schema = twLicensePlate(true)

      expect(schema.parse("ABC1234")).toBe("ABC1234")
      expect(schema.parse("XYZ9876")).toBe("XYZ9876")
    })

    it("should validate new-style car plates with hyphen stripped (ABC-1234)", () => {
      const schema = twLicensePlate(true)

      expect(schema.parse("ABC-1234")).toBe("ABC1234")
    })

    it("should validate car plates with 4 digits + 2 letters", () => {
      const schema = twLicensePlate(true)

      expect(schema.parse("1234AB")).toBe("1234AB")
      expect(schema.parse("1234-AB")).toBe("1234AB")
    })

    it("should validate legacy car plates (2 letters + 4 digits)", () => {
      const schema = twLicensePlate(true)

      expect(schema.parse("AB1234")).toBe("AB1234")
      expect(schema.parse("AB-1234")).toBe("AB1234")
    })

    it("should validate legacy mixed car plates (1 letter + 5 digits)", () => {
      const schema = twLicensePlate(true)

      expect(schema.parse("A12345")).toBe("A12345")
    })

    it("should validate motorcycle plates (3 digits + 3 letters)", () => {
      const schema = twLicensePlate(true)

      expect(schema.parse("123ABC")).toBe("123ABC")
      expect(schema.parse("123-ABC")).toBe("123ABC")
    })

    it("should auto-uppercase lowercase input", () => {
      const schema = twLicensePlate(true)

      expect(schema.parse("abc1234")).toBe("ABC1234")
      expect(schema.parse("abc-1234")).toBe("ABC1234")
    })

    it("should reject plates that are too short", () => {
      const schema = twLicensePlate(true)

      expect(() => schema.parse("AB123")).toThrow("Invalid Taiwan license plate number")
    })

    it("should reject just digits", () => {
      const schema = twLicensePlate(true)

      expect(() => schema.parse("1234")).toThrow("Invalid Taiwan license plate number")
      expect(() => schema.parse("1234567")).toThrow("Invalid Taiwan license plate number")
    })

    it("should reject 4 letters + 4 digits", () => {
      const schema = twLicensePlate(true)

      expect(() => schema.parse("ABCD1234")).toThrow("Invalid Taiwan license plate number")
    })
  })

  describe("plateType option", () => {
    it("should validate car plates only when plateType is 'car'", () => {
      const schema = twLicensePlate(true, { plateType: "car" })

      expect(schema.parse("ABC1234")).toBe("ABC1234")
      expect(schema.parse("1234AB")).toBe("1234AB")
      expect(schema.parse("AB1234")).toBe("AB1234")
      expect(schema.parse("A12345")).toBe("A12345")
    })

    it("should reject motorcycle-only plates when plateType is 'car'", () => {
      const schema = twLicensePlate(true, { plateType: "car" })

      // 123ABC (3 digits + 3 letters) is motorcycle-only
      expect(() => schema.parse("123ABC")).toThrow("Invalid Taiwan license plate number")
    })

    it("should validate motorcycle plates when plateType is 'motorcycle'", () => {
      const schema = twLicensePlate(true, { plateType: "motorcycle" })

      expect(schema.parse("ABC1234")).toBe("ABC1234")
      expect(schema.parse("123ABC")).toBe("123ABC")
      expect(schema.parse("AB1234")).toBe("AB1234")
      expect(schema.parse("1234AB")).toBe("1234AB")
    })

    it("should reject car-only plates when plateType is 'motorcycle'", () => {
      const schema = twLicensePlate(true, { plateType: "motorcycle" })

      // A12345 (1 letter + 5 digits) is car-only
      expect(() => schema.parse("A12345")).toThrow("Invalid Taiwan license plate number")
    })

    it("should validate all plate types when plateType is 'any'", () => {
      const schema = twLicensePlate(true, { plateType: "any" })

      expect(schema.parse("ABC1234")).toBe("ABC1234")
      expect(schema.parse("1234AB")).toBe("1234AB")
      expect(schema.parse("AB1234")).toBe("AB1234")
      expect(schema.parse("A12345")).toBe("A12345")
      expect(schema.parse("123ABC")).toBe("123ABC")
    })
  })

  describe("utility function validateTaiwanLicensePlate", () => {
    it("should return true for valid plate numbers", () => {
      expect(validateTaiwanLicensePlate("ABC1234")).toBe(true)
      expect(validateTaiwanLicensePlate("1234AB")).toBe(true)
      expect(validateTaiwanLicensePlate("AB1234")).toBe(true)
      expect(validateTaiwanLicensePlate("A12345")).toBe(true)
      expect(validateTaiwanLicensePlate("123ABC")).toBe(true)
    })

    it("should return false for invalid plate numbers", () => {
      expect(validateTaiwanLicensePlate("AB123")).toBe(false)
      expect(validateTaiwanLicensePlate("ABCD1234")).toBe(false)
      expect(validateTaiwanLicensePlate("1234")).toBe(false)
      expect(validateTaiwanLicensePlate("")).toBe(false)
      expect(validateTaiwanLicensePlate("abc1234")).toBe(false) // lowercase
    })

    it("should respect plateType parameter", () => {
      // A12345 is car-only
      expect(validateTaiwanLicensePlate("A12345", "car")).toBe(true)
      expect(validateTaiwanLicensePlate("A12345", "motorcycle")).toBe(false)
      expect(validateTaiwanLicensePlate("A12345", "any")).toBe(true)

      // 123ABC is motorcycle-only
      expect(validateTaiwanLicensePlate("123ABC", "motorcycle")).toBe(true)
      expect(validateTaiwanLicensePlate("123ABC", "car")).toBe(false)
      expect(validateTaiwanLicensePlate("123ABC", "any")).toBe(true)
    })
  })

  describe("required/optional behavior", () => {
    it("should handle required=true", () => {
      const schema = twLicensePlate(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse(null)).toThrow()
      expect(() => schema.parse(undefined)).toThrow()
    })

    it("should handle required=false", () => {
      const schema = twLicensePlate(false)

      expect(schema.parse("")).toBe(null)
      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
      expect(schema.parse("ABC1234")).toBe("ABC1234")
    })

    it("should use default values", () => {
      const requiredSchema = twLicensePlate(true, { defaultValue: "ABC1234" })
      const optionalSchema = twLicensePlate(false, { defaultValue: "ABC1234" })

      expect(requiredSchema.parse("")).toBe("ABC1234")
      expect(optionalSchema.parse("")).toBe("ABC1234")
    })
  })

  describe("transform function", () => {
    it("should apply custom transform", () => {
      const schema = twLicensePlate(true, {
        transform: (val) => val.replace(/\s+/g, ""),
      })

      expect(schema.parse("ABC 1234")).toBe("ABC1234")
    })

    it("should apply transform before validation", () => {
      const schema = twLicensePlate(true, {
        transform: (val) => val.replace(/\s+/g, ""),
      })

      expect(schema.parse("  ABC1234  ")).toBe("ABC1234")
    })
  })

  describe("input preprocessing", () => {
    it("should trim whitespace", () => {
      const schema = twLicensePlate(true)

      expect(schema.parse("  ABC1234  ")).toBe("ABC1234")
      expect(schema.parse("\tABC1234\n")).toBe("ABC1234")
    })

    it("should strip hyphens and spaces from input", () => {
      const schema = twLicensePlate(true)

      expect(schema.parse("ABC-1234")).toBe("ABC1234")
      expect(schema.parse("123-ABC")).toBe("123ABC")
      expect(schema.parse("AB-1234")).toBe("AB1234")
    })
  })

  describe("i18n support", () => {
    it("should use English messages by default", () => {
      setLocale("en-US")
      const schema = twLicensePlate(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("INVALID")).toThrow("Invalid Taiwan license plate number")
    })

    it("should use Chinese messages when locale is zh-TW", () => {
      setLocale("zh-TW")
      const schema = twLicensePlate(true)

      expect(() => schema.parse("")).toThrow("必填")
      expect(() => schema.parse("INVALID")).toThrow("無效的車牌號碼")
    })

    it("should support custom i18n messages", () => {
      const schema = twLicensePlate(true, {
        i18n: {
          "en-US": {
            required: "Plate number is required",
            invalid: "Plate number is invalid",
          },
          "zh-TW": {
            required: "請輸入車牌號碼",
            invalid: "車牌號碼格式錯誤",
          },
        },
      })

      setLocale("en-US")
      expect(() => schema.parse("")).toThrow("Plate number is required")
      expect(() => schema.parse("INVALID")).toThrow("Plate number is invalid")

      setLocale("zh-TW")
      expect(() => schema.parse("")).toThrow("請輸入車牌號碼")
      expect(() => schema.parse("INVALID")).toThrow("車牌號碼格式錯誤")
    })
  })

  describe("edge cases", () => {
    it("should handle empty and whitespace inputs", () => {
      const schema = twLicensePlate(true)
      const optionalSchema = twLicensePlate(false)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("   ")).toThrow("Required")
      expect(() => schema.parse("\t\n")).toThrow("Required")

      expect(optionalSchema.parse("")).toBe(null)
      expect(optionalSchema.parse("   ")).toBe(null)
      expect(optionalSchema.parse("\t\n")).toBe(null)
    })

    it("should reject just letters", () => {
      const schema = twLicensePlate(true)

      expect(() => schema.parse("ABCDEF")).toThrow("Invalid Taiwan license plate number")
      expect(() => schema.parse("ABC")).toThrow("Invalid Taiwan license plate number")
    })

    it("should reject mixed patterns that do not match any format", () => {
      const schema = twLicensePlate(true)

      expect(() => schema.parse("A1B2C3")).toThrow("Invalid Taiwan license plate number")
      expect(() => schema.parse("1A2B3C")).toThrow("Invalid Taiwan license plate number")
    })
  })
})
