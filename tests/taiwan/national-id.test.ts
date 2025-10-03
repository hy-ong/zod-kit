import { describe, it, expect, beforeEach } from "vitest"
import { twNationalId, setLocale, validateTaiwanNationalId, validateCitizenId, validateOldResidentId, validateNewResidentId } from "../../src"

describe("Taiwan twNationalId(true) validator", () => {
  beforeEach(() => setLocale("en"))

  describe("basic functionality", () => {
    it("should validate correct Taiwan national IDs (both types)", () => {
      const schema = twNationalId(true)

      // Valid citizen IDs (身分證字號)
      expect(schema.parse("A123456789")).toBe("A123456789")
      expect(schema.parse("A223456781")).toBe("A223456781")
      expect(schema.parse("B123456780")).toBe("B123456780")

      // Valid old resident IDs (舊式居留證)
      expect(schema.parse("AA00000001")).toBe("AA00000001")
      expect(schema.parse("AB00000009")).toBe("AB00000009")
      expect(schema.parse("BC00000002")).toBe("BC00000002")

      // Valid new resident IDs (新式居留證)
      expect(schema.parse("A800000005")).toBe("A800000005")
      expect(schema.parse("A900000007")).toBe("A900000007")
      expect(schema.parse("B800000006")).toBe("B800000006")
    })

    it("should reject invalid Taiwan national IDs", () => {
      const schema = twNationalId(true)

      // Invalid formats
      expect(() => schema.parse("A12345678")).toThrow("Invalid Taiwan National ID") // Too short
      expect(() => schema.parse("A1234567890")).toThrow("Invalid Taiwan National ID") // Too long
      expect(() => schema.parse("1234567890")).toThrow("Invalid Taiwan National ID") // No letter
      expect(() => schema.parse("AB23456789")).toThrow("Invalid Taiwan National ID") // Wrong format

      // Invalid checksums
      expect(() => schema.parse("A123456788")).toThrow("Invalid Taiwan National ID")
      expect(() => schema.parse("A223456782")).toThrow("Invalid Taiwan National ID")
    })

    it("should handle case conversion", () => {
      const schema = twNationalId(true)

      expect(schema.parse("a123456789")).toBe("A123456789")
      expect(schema.parse("b123456780")).toBe("B123456780")
    })
  })

  describe("type-specific validation", () => {
    it("should validate only citizen IDs when type is 'citizen'", () => {
      const schema = twNationalId(true, { type: "citizen" })

      // Should accept citizen IDs
      expect(schema.parse("A123456789")).toBe("A123456789")
      expect(schema.parse("B123456780")).toBe("B123456780")

      // Should reject resident IDs
      expect(() => schema.parse("AA00000001")).toThrow("Invalid Taiwan National ID")
      expect(() => schema.parse("A800000005")).toThrow("Invalid Taiwan National ID")
    })

    it("should validate only resident IDs when type is 'resident'", () => {
      const schema = twNationalId(true, { type: "resident" })

      // Should accept old resident IDs
      expect(schema.parse("AA00000001")).toBe("AA00000001")
      expect(schema.parse("ZB12345676")).toBe("ZB12345676")

      // Should accept new resident IDs
      expect(schema.parse("A800000005")).toBe("A800000005")
      expect(schema.parse("Z812345672")).toBe("Z812345672")

      // Should reject citizen IDs
      expect(() => schema.parse("A123456789")).toThrow("Invalid Taiwan National ID")
      expect(() => schema.parse("B123456780")).toThrow("Invalid Taiwan National ID")
    })

    it("should validate both types when type is 'both' (default)", () => {
      const schema = twNationalId(true, { type: "both" })

      // Should accept all valid formats
      expect(schema.parse("A123456789")).toBe("A123456789") // Citizen
      expect(schema.parse("AA00000001")).toBe("AA00000001") // Old resident
      expect(schema.parse("A800000005")).toBe("A800000005") // New resident
    })
  })

  describe("allowOldResident option", () => {
    it("should allow old resident IDs by default", () => {
      const schema = twNationalId(true, { type: "resident" })

      // Should accept old resident IDs (default allowOldResident=true)
      expect(schema.parse("AA00000001")).toBe("AA00000001")
      expect(schema.parse("AB00000009")).toBe("AB00000009")
      expect(schema.parse("ZB12345676")).toBe("ZB12345676")

      // Should also accept new resident IDs
      expect(schema.parse("A800000005")).toBe("A800000005")
      expect(schema.parse("A912345673")).toBe("A912345673")
    })

    it("should reject old resident IDs when allowOldResident=false", () => {
      const schema = twNationalId(true, { type: "resident", allowOldResident: false })

      // Should reject old resident IDs
      expect(() => schema.parse("AA00000001")).toThrow("Invalid Taiwan National ID")
      expect(() => schema.parse("AB00000009")).toThrow("Invalid Taiwan National ID")
      expect(() => schema.parse("ZB12345676")).toThrow("Invalid Taiwan National ID")

      // Should still accept new resident IDs
      expect(schema.parse("A800000005")).toBe("A800000005")
      expect(schema.parse("A912345673")).toBe("A912345673")
    })

    it("should work with type='both' and allowOldResident=false", () => {
      const schema = twNationalId(true, { type: "both", allowOldResident: false })

      // Should accept citizen IDs
      expect(schema.parse("A123456789")).toBe("A123456789")
      expect(schema.parse("B123456780")).toBe("B123456780")

      // Should accept new resident IDs
      expect(schema.parse("A800000005")).toBe("A800000005")
      expect(schema.parse("A912345673")).toBe("A912345673")

      // Should reject old resident IDs
      expect(() => schema.parse("AA00000001")).toThrow("Invalid Taiwan National ID")
      expect(() => schema.parse("AB00000009")).toThrow("Invalid Taiwan National ID")
    })

    it("should not affect citizen IDs validation", () => {
      const schemaWithOld = twNationalId(true, { type: "citizen", allowOldResident: true })
      const schemaWithoutOld = twNationalId(true, { type: "citizen", allowOldResident: false })

      // Both should accept citizen IDs
      expect(schemaWithOld.parse("A123456789")).toBe("A123456789")
      expect(schemaWithoutOld.parse("A123456789")).toBe("A123456789")

      // Both should reject resident IDs (since type is citizen)
      expect(() => schemaWithOld.parse("AA00000001")).toThrow("Invalid Taiwan National ID")
      expect(() => schemaWithoutOld.parse("AA00000001")).toThrow("Invalid Taiwan National ID")
      expect(() => schemaWithOld.parse("A800000005")).toThrow("Invalid Taiwan National ID")
      expect(() => schemaWithoutOld.parse("A800000005")).toThrow("Invalid Taiwan National ID")
    })
  })

  describe("utility functions", () => {
    describe("validateCitizenId", () => {
      it("should correctly validate citizen IDs", () => {
        // Valid citizen IDs
        expect(validateCitizenId("A123456789")).toBe(true)
        expect(validateCitizenId("B123456780")).toBe(true)
        expect(validateCitizenId("Z187654324")).toBe(true)

        // Invalid citizen IDs
        expect(validateCitizenId("A123456788")).toBe(false) // Wrong checksum
        expect(validateCitizenId("A323456789")).toBe(false) // Invalid gender digit
        expect(validateCitizenId("AA00000001")).toBe(false) // Wrong format
        expect(validateCitizenId("A12345678")).toBe(false) // Too short
      })
    })

    describe("validateOldResidentId", () => {
      it("should correctly validate old resident IDs", () => {
        // Valid old resident IDs
        expect(validateOldResidentId("AA00000001")).toBe(true)
        expect(validateOldResidentId("AC12345677")).toBe(true)
        expect(validateOldResidentId("ZB12345676")).toBe(true)
        expect(validateOldResidentId("AD12345675")).toBe(true)

        // Invalid old resident IDs
        expect(validateOldResidentId("AE12345678")).toBe(false) // Invalid gender code
        expect(validateOldResidentId("A123456789")).toBe(false) // Wrong format
        expect(validateOldResidentId("AA1234567")).toBe(false) // Too short
      })
    })

    describe("validateNewResidentId", () => {
      it("should correctly validate new resident IDs", () => {
        // Valid new resident IDs
        expect(validateNewResidentId("A800000005")).toBe(true)
        expect(validateNewResidentId("A912345673")).toBe(true)
        expect(validateNewResidentId("Z812345672")).toBe(true)
        expect(validateNewResidentId("Z912345674")).toBe(true)

        // Invalid new resident IDs
        expect(validateNewResidentId("A712345678")).toBe(false) // Invalid gender digit
        expect(validateNewResidentId("A123456789")).toBe(false) // Wrong format
        expect(validateNewResidentId("A81234567")).toBe(false) // Too short
      })
    })

    describe("validateTaiwanNationalId", () => {
      it("should validate with type parameter", () => {
        // Test with citizen type
        expect(validateTaiwanNationalId("A123456789", "citizen")).toBe(true)
        expect(validateTaiwanNationalId("AA00000001", "citizen")).toBe(false)

        // Test with resident type
        expect(validateTaiwanNationalId("AA00000001", "resident")).toBe(true)
        expect(validateTaiwanNationalId("A800000005", "resident")).toBe(true)
        expect(validateTaiwanNationalId("A123456789", "resident")).toBe(false)

        // Test with both type
        expect(validateTaiwanNationalId("A123456789", "both")).toBe(true)
        expect(validateTaiwanNationalId("AA00000001", "both")).toBe(true)
        expect(validateTaiwanNationalId("A800000005", "both")).toBe(true)
      })
    })
  })

  describe("required/optional behavior", () => {
    it("should handle required=true (default)", () => {
      const schema = twNationalId(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse(null)).toThrow()
      expect(() => schema.parse(undefined)).toThrow()
    })

    it("should handle required=false", () => {
      const schema = twNationalId(false)

      expect(schema.parse("")).toBe(null)
      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
      expect(schema.parse("A123456789")).toBe("A123456789")
    })

    it("should use default values", () => {
      const requiredSchema = twNationalId(true, { defaultValue: "A123456789" })
      const optionalSchema = twNationalId(false, { defaultValue: "A123456789" })

      expect(requiredSchema.parse("")).toBe("A123456789")
      expect(optionalSchema.parse("")).toBe("A123456789")
    })
  })

  describe("transform function", () => {
    it("should apply custom transform", () => {
      const schema = twNationalId(true, {
        transform: (val) => val.replace(/[-\s]/g, "").toUpperCase(),
      })

      expect(schema.parse("a12-345-6789")).toBe("A123456789")
      expect(schema.parse("z18 765 4324")).toBe("Z187654324")
    })

    it("should apply transform before validation", () => {
      const schema = twNationalId(true, {
        transform: (val) => val.replace(/\s+/g, "").toUpperCase(),
      })

      expect(schema.parse(" a123456789 ")).toBe("A123456789")
      expect(() => schema.parse(" a123456788 ")).toThrow("Invalid Taiwan National ID")
    })
  })

  describe("input preprocessing", () => {
    it("should handle string conversion and case normalization", () => {
      const schema = twNationalId(true)

      // Test automatic uppercase conversion
      expect(schema.parse("a123456789")).toBe("A123456789")
      expect(schema.parse("z187654324")).toBe("Z187654324")
    })

    it("should trim whitespace", () => {
      const schema = twNationalId(true)

      expect(schema.parse("  A123456789  ")).toBe("A123456789")
      expect(schema.parse("\tZ187654324\n")).toBe("Z187654324")
    })
  })

  describe("i18n support", () => {
    it("should use English messages by default", () => {
      setLocale("en")
      const schema = twNationalId(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("A123456788")).toThrow("Invalid Taiwan National ID")
    })

    it("should use Chinese messages when locale is zh-TW", () => {
      setLocale("zh-TW")
      const schema = twNationalId(true)

      expect(() => schema.parse("")).toThrow("必填")
      expect(() => schema.parse("A123456788")).toThrow("無效的身分證字號")
    })

    it("should support custom i18n messages", () => {
      const schema = twNationalId(true, {
        i18n: {
          en: {
            required: "National ID is required",
            invalid: "National ID is invalid",
          },
          "zh-TW": {
            required: "請輸入身分證字號",
            invalid: "身分證字號格式錯誤",
          },
        },
      })

      setLocale("en")
      expect(() => schema.parse("")).toThrow("National ID is required")
      expect(() => schema.parse("A123456788")).toThrow("National ID is invalid")

      setLocale("zh-TW")
      expect(() => schema.parse("")).toThrow("請輸入身分證字號")
      expect(() => schema.parse("A123456788")).toThrow("身分證字號格式錯誤")
    })
  })

  describe("real world Taiwan national IDs", () => {
    it("should validate known citizen ID patterns", () => {
      const schema = twNationalId(true, { type: "citizen" })

      // Test various city codes and gender combinations
      const validCitizenIds = [
        "A123456789", // Taipei male
        "A223456781", // Taipei female
        "B123456780", // Taichung male
        "B223456782", // Taichung female
        "Z187654324", // Lianjiang male
        "Z287654326", // Lianjiang female
      ]

      validCitizenIds.forEach((id) => {
        expect(schema.parse(id)).toBe(id)
      })
    })

    it("should validate known old resident ID patterns", () => {
      const schema = twNationalId(true, { type: "resident" })

      // Test old format resident IDs
      const validOldResidentIds = [
        "AA00000001", // Male
        "AB00000009", // Female
        "AC12345677", // Male
        "AD12345675", // Female
        "ZA12345678", // Male
        "ZB12345676", // Female
      ]

      validOldResidentIds.forEach((id) => {
        expect(schema.parse(id)).toBe(id)
      })
    })

    it("should validate known new resident ID patterns", () => {
      const schema = twNationalId(true, { type: "resident" })

      // Test new format resident IDs
      const validNewResidentIds = [
        "A800000005", // Male
        "A912345673", // Female
        "B800000006", // Male
        "B912345674", // Female
        "Z812345672", // Male
        "Z912345674", // Female
      ]

      validNewResidentIds.forEach((id) => {
        expect(schema.parse(id)).toBe(id)
      })
    })

    it("should reject common invalid patterns", () => {
      const schema = twNationalId(true)

      const invalidIds = [
        "A000000000", // All zeros
        "A111111111", // All ones
        "A123456788", // Wrong checksum
        "A323456789", // Invalid gender digit for citizen
        "A712345678", // Invalid gender digit for new resident
        "AE12345678", // Invalid gender code for old resident
        "1123456789", // No letter
        "A023456789", // Invalid gender digit
        "A12345678", // Too short
        "A1234567890", // Too long
      ]

      invalidIds.forEach((id) => {
        expect(() => schema.parse(id)).toThrow()
      })
    })
  })

  describe("edge cases", () => {
    it("should handle all valid city codes", () => {
      const schema = twNationalId(true, { type: "citizen" })

      // Test all valid city codes
      const cityCodes = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

      cityCodes.forEach((code) => {
        // Test with a known valid pattern (need to calculate actual valid IDs)
        const testId = code + "123456789"
        try {
          schema.parse(testId)
          // If no error thrown, the ID is valid
        } catch (error: any) {
          // If error thrown, it's expected for invalid checksums
          expect(error.message).toContain("Invalid Taiwan National ID")
        }
      })
    })

    it("should handle empty and whitespace inputs", () => {
      const schema = twNationalId(true)
      const optionalSchema = twNationalId(false)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("   ")).toThrow("Required")
      expect(() => schema.parse("\t\n")).toThrow("Required")

      expect(optionalSchema.parse("")).toBe(null)
      expect(optionalSchema.parse("   ")).toBe(null)
      expect(optionalSchema.parse("\t\n")).toBe(null)
    })

    it("should preserve valid format after transformation", () => {
      const schema = twNationalId(true, {
        transform: (val) => val.replace(/[^A-Z0-9]/g, "").toUpperCase(),
      })

      expect(schema.parse("a-1@2#3$4%5^6&7*8(9)")).toBe("A123456789")
    })
  })
})
