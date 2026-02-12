import { describe, it, expect, beforeEach, vi } from "vitest"
import { twPostalCode, setLocale } from "../../src"

describe("twPostalCode() features", () => {
  beforeEach(() => setLocale("en-US"))

  describe("3-digit postal code validation", () => {
    it("should accept valid 3-digit postal codes", () => {
      const schema = twPostalCode(true, { format: "3" })
      expect(schema.parse("100")).toBe("100") // Taipei
      expect(schema.parse("200")).toBe("200") // Keelung
      expect(schema.parse("300")).toBe("300") // Taoyuan/Hsinchu
      expect(schema.parse("400")).toBe("400") // Taichung
      expect(schema.parse("500")).toBe("500") // Changhua
      expect(schema.parse("600")).toBe("600") // Chiayi
      expect(schema.parse("700")).toBe("700") // Tainan
      expect(schema.parse("800")).toBe("800") // Kaohsiung
      expect(schema.parse("900")).toBe("900") // Pingtung
    })

    it("should reject invalid 3-digit postal codes", () => {
      const schema = twPostalCode(true, { format: "3" })
      expect(() => schema.parse("000")).toThrow("Invalid Taiwan postal code")
      expect(() => schema.parse("099")).toThrow("Invalid Taiwan postal code")
      expect(() => schema.parse("999")).toThrow("Invalid Taiwan postal code")
    })

    it("should reject non-3-digit formats when format is '3'", () => {
      const schema = twPostalCode(true, { format: "3" })
      expect(() => schema.parse("10001")).toThrow("Only 3-digit postal codes are allowed")
      expect(() => schema.parse("100001")).toThrow("Only 3-digit postal codes are allowed")
    })

    it("should validate specific Taipei area postal codes", () => {
      const schema = twPostalCode(true, { format: "3" })
      expect(schema.parse("100")).toBe("100") // Zhongzheng
      expect(schema.parse("103")).toBe("103") // Datong
      expect(schema.parse("104")).toBe("104") // Zhongshan
      expect(schema.parse("105")).toBe("105") // Songshan
      expect(schema.parse("106")).toBe("106") // Da'an
      expect(schema.parse("108")).toBe("108") // Wanhua
      expect(schema.parse("110")).toBe("110") // Xinyi
      expect(schema.parse("111")).toBe("111") // Shilin
      expect(schema.parse("112")).toBe("112") // Beitou
      expect(schema.parse("114")).toBe("114") // Neihu
      expect(schema.parse("115")).toBe("115") // Nangang
      expect(schema.parse("116")).toBe("116") // Wenshan
    })
  })

  describe("5-digit postal code validation", () => {
    it("should accept valid 5-digit postal codes", () => {
      const schema = twPostalCode(true, { format: "5" })
      expect(schema.parse("10001")).toBe("10001")
      expect(schema.parse("20001")).toBe("20001")
      expect(schema.parse("30001")).toBe("30001")
      expect(schema.parse("40001")).toBe("40001")
      expect(schema.parse("50001")).toBe("50001")
    })

    it("should reject invalid 5-digit postal codes", () => {
      const schema = twPostalCode(true, { format: "5" })
      expect(() => schema.parse("00001")).toThrow("Invalid Taiwan postal code")
      expect(() => schema.parse("09901")).toThrow("Invalid Taiwan postal code")
      expect(() => schema.parse("99901")).toThrow("Invalid Taiwan postal code")
    })

    it("should reject non-5-digit formats when format is '5'", () => {
      const schema = twPostalCode(true, { format: "5" })
      expect(() => schema.parse("100")).toThrow("Only 5-digit postal codes are allowed")
      expect(() => schema.parse("100001")).toThrow("Only 5-digit postal codes are allowed")
    })

    it("should validate 5-digit postal codes with valid prefixes", () => {
      const schema = twPostalCode(true, { format: "5" })
      expect(schema.parse("10099")).toBe("10099") // Valid Taipei prefix
      expect(schema.parse("20099")).toBe("20099") // Valid Keelung prefix
      expect(schema.parse("88099")).toBe("88099") // Valid Penghu prefix
    })
  })

  describe("6-digit postal code validation", () => {
    it("should accept valid 6-digit postal codes", () => {
      const schema = twPostalCode(true, { format: "6" })
      expect(schema.parse("100001")).toBe("100001")
      expect(schema.parse("200001")).toBe("200001")
      expect(schema.parse("300001")).toBe("300001")
      expect(schema.parse("400001")).toBe("400001")
      expect(schema.parse("500001")).toBe("500001")
    })

    it("should reject invalid 6-digit postal codes", () => {
      const schema = twPostalCode(true, { format: "6" })
      expect(() => schema.parse("000001")).toThrow("Invalid Taiwan postal code")
      expect(() => schema.parse("099001")).toThrow("Invalid Taiwan postal code")
      expect(() => schema.parse("999001")).toThrow("Invalid Taiwan postal code")
    })

    it("should reject non-6-digit formats when format is '6'", () => {
      const schema = twPostalCode(true, { format: "6" })
      expect(() => schema.parse("100")).toThrow("Only 6-digit postal codes are allowed")
      expect(() => schema.parse("10001")).toThrow("Only 6-digit postal codes are allowed")
    })

    it("should validate 6-digit postal codes with all valid prefixes", () => {
      const schema = twPostalCode(true, { format: "6" })
      expect(schema.parse("100999")).toBe("100999") // Taipei
      expect(schema.parse("880999")).toBe("880999") // Penghu
      expect(schema.parse("890999")).toBe("890999") // Kinmen
      expect(schema.parse("209999")).toBe("209999") // Lienchiang (Matsu)
    })
  })

  describe("combined format validation", () => {
    it("should accept both 3 and 5 digit formats with '3+5'", () => {
      const schema = twPostalCode(true, { format: "3+5" })
      expect(schema.parse("100")).toBe("100")
      expect(schema.parse("10001")).toBe("10001")
      expect(() => schema.parse("100001")).toThrow("Invalid Taiwan postal code")
    })

    it("should accept both 3 and 6 digit formats with '3+6' (default)", () => {
      const schema = twPostalCode() // Default format is "3+6"
      expect(schema.parse("100")).toBe("100")
      expect(schema.parse("100001")).toBe("100001")
      expect(() => schema.parse("10001")).toThrow("Invalid Taiwan postal code")
    })

    it("should accept both 5 and 6 digit formats with '5+6'", () => {
      const schema = twPostalCode(true, { format: "5+6" })
      expect(schema.parse("10001")).toBe("10001")
      expect(schema.parse("100001")).toBe("100001")
      expect(() => schema.parse("100")).toThrow("Invalid Taiwan postal code")
    })

    it("should accept all formats with 'all'", () => {
      const schema = twPostalCode(true, { format: "all" })
      expect(schema.parse("100")).toBe("100")
      expect(schema.parse("10001")).toBe("10001")
      expect(schema.parse("100001")).toBe("100001")
    })
  })

  describe("dash and space handling", () => {
    it("should handle dashes in postal codes when allowDashes is true", () => {
      const schema = twPostalCode(true, { format: "all", allowDashes: true })
      expect(schema.parse("100")).toBe("100")
      expect(schema.parse("100-01")).toBe("10001")
      expect(schema.parse("100-001")).toBe("100001")
      expect(schema.parse("100 001")).toBe("100001")
    })

    it("should reject dashes when allowDashes is false", () => {
      const schema = twPostalCode(true, { format: "all", allowDashes: false })
      expect(schema.parse("100")).toBe("100")
      expect(() => schema.parse("100-01")).toThrow("Invalid Taiwan postal code")
      expect(() => schema.parse("100-001")).toThrow("Invalid Taiwan postal code")
    })

    it("should normalize various dash and space formats", () => {
      const schema = twPostalCode(true, { format: "6", allowDashes: true })
      expect(schema.parse("100-001")).toBe("100001")
      expect(schema.parse("100 001")).toBe("100001")
      expect(schema.parse("100   001")).toBe("100001")
      expect(schema.parse("100---001")).toBe("100001")
    })
  })

  describe("prefix filtering", () => {
    it("should only allow specified prefixes", () => {
      const schema = twPostalCode(true, {
        format: "all",
        allowedPrefixes: ["100", "200", "300"],
      })
      expect(schema.parse("100")).toBe("100")
      expect(schema.parse("10001")).toBe("10001")
      expect(schema.parse("100001")).toBe("100001")
      expect(schema.parse("200")).toBe("200")
      expect(() => schema.parse("400")).toThrow("Invalid Taiwan postal code")
      expect(() => schema.parse("40001")).toThrow("Invalid Taiwan postal code")
    })

    it("should block specified prefixes", () => {
      const schema = twPostalCode(true, {
        format: "all",
        blockedPrefixes: ["999", "000"],
      })
      expect(schema.parse("100")).toBe("100")
      expect(() => schema.parse("999")).toThrow("Invalid Taiwan postal code")
      expect(() => schema.parse("99901")).toThrow("Invalid Taiwan postal code")
      expect(() => schema.parse("000")).toThrow("Invalid Taiwan postal code")
    })

    it("should prioritize allowedPrefixes over strict validation", () => {
      const schema = twPostalCode(true, {
        format: "3",
        allowedPrefixes: ["999"], // Not in official list
        strictValidation: true,
      })
      expect(schema.parse("999")).toBe("999")
    })

    it("should respect blockedPrefixes even with allowedPrefixes", () => {
      const schema = twPostalCode(true, {
        format: "3",
        allowedPrefixes: ["100", "200", "999"],
        blockedPrefixes: ["999"],
      })
      expect(schema.parse("100")).toBe("100")
      expect(schema.parse("200")).toBe("200")
      expect(() => schema.parse("999")).toThrow("Invalid Taiwan postal code")
    })
  })

  describe("strict validation", () => {
    it("should validate against official postal code list when strict", () => {
      const schema = twPostalCode(true, { format: "3", strictValidation: true })
      expect(schema.parse("100")).toBe("100") // Valid official code
      expect(() => schema.parse("199")).toThrow("Invalid Taiwan postal code") // Not in official list
    })

    it("should allow broader range when not strict", () => {
      const schema = twPostalCode(true, { format: "3", strictValidation: false })
      expect(schema.parse("100")).toBe("100") // Valid official code
      expect(schema.parse("199")).toBe("199") // Not in official list but in range 100-999
      expect(() => schema.parse("099")).toThrow("Invalid Taiwan postal code") // Still below 100
    })

    it("should validate all Taiwan regions with strict validation", () => {
      const schema = twPostalCode(true, { format: "3", strictValidation: true })

      // Major cities
      expect(schema.parse("100")).toBe("100") // Taipei City
      expect(schema.parse("200")).toBe("200") // Keelung City
      expect(schema.parse("300")).toBe("300") // Taoyuan City
      expect(schema.parse("400")).toBe("400") // Taichung City
      expect(schema.parse("500")).toBe("500") // Changhua County
      expect(schema.parse("600")).toBe("600") // Chiayi City
      expect(schema.parse("700")).toBe("700") // Tainan City
      expect(schema.parse("800")).toBe("800") // Kaohsiung City
      expect(schema.parse("900")).toBe("900") // Pingtung County

      // Eastern Taiwan
      expect(schema.parse("260")).toBe("260") // Yilan County
      expect(schema.parse("970")).toBe("970") // Hualien County
      expect(schema.parse("950")).toBe("950") // Taitung County

      // Offshore islands
      expect(schema.parse("880")).toBe("880") // Penghu County
      expect(schema.parse("890")).toBe("890") // Kinmen County
      expect(schema.parse("209")).toBe("209") // Lienchiang County (Matsu)
    })
  })

  describe("required and optional validation", () => {
    it("should handle required validation", () => {
      const schema = twPostalCode(true)
      expect(() => schema.parse(null)).toThrow("Required")
      expect(() => schema.parse(undefined)).toThrow("Required")
      expect(() => schema.parse("")).toThrow("Required")
    })

    it("should allow null when not required", () => {
      const schema = twPostalCode(false)
      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
      expect(schema.parse("")).toBe(null)
    })

    it("should use default value when provided", () => {
      const schema = twPostalCode(true, { defaultValue: "100001" })
      expect(schema.parse("")).toBe("100001")
      expect(schema.parse(null)).toBe("100001")
      expect(schema.parse(undefined)).toBe("100001")
    })

    it("should use default value for optional fields", () => {
      const schema = twPostalCode(false, { defaultValue: "100001" })
      expect(schema.parse("")).toBe("100001")
      expect(schema.parse(null)).toBe("100001")
      expect(schema.parse(undefined)).toBe("100001")
    })
  })

  describe("transform functionality", () => {
    it("should apply transform function", () => {
      const schema = twPostalCode(true, {
        format: "6",
        transform: (val) => val.replace(/\D/g, ""), // Remove non-digits
      })
      expect(schema.parse("100-001")).toBe("100001")
      expect(schema.parse("100.001")).toBe("100001")
      expect(schema.parse("100abc001")).toBe("100001")
    })

    it("should apply transform after dash removal", () => {
      const schema = twPostalCode(true, {
        format: "3",
        allowDashes: true,
        transform: (val) => val.padEnd(3, "0"), // Pad to 3 digits
      })
      expect(schema.parse("10")).toBe("100")
      expect(schema.parse("1")).toBe("100")
    })
  })

  describe("legacy 5-digit warning", () => {
    it("should emit warning for 5-digit codes when warn5Digit is true", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
      const schema = twPostalCode(true, { format: "all", warn5Digit: true })

      schema.parse("10001") // Should emit warning
      expect(consoleSpy).toHaveBeenCalledWith("5-digit postal codes are legacy format, consider using 6-digit format")

      schema.parse("100") // Should not emit warning
      schema.parse("100001") // Should not emit warning

      consoleSpy.mockRestore()
    })

    it("should not emit warning when warn5Digit is false", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
      const schema = twPostalCode(true, { format: "all", warn5Digit: false })

      schema.parse("10001") // Should not emit warning
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it("should not emit warning for 5-digit only format", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
      const schema = twPostalCode(true, { format: "5", warn5Digit: true })

      schema.parse("10001") // Should not emit warning for 5-digit only format
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe("custom i18n messages", () => {
    it("should use custom messages when provided", () => {
      const schema = twPostalCode(true, {
        format: "3",
        i18n: {
          "en-US": {
            required: "Custom required message",
            invalid: "Custom invalid message",
            format3Only: "Custom 3-digit only message",
          },
          "zh-TW": {
            required: "客製化必填訊息",
            invalid: "客製化無效訊息",
            format3Only: "客製化僅限3碼訊息",
          },
        },
      })

      expect(() => schema.parse("")).toThrow("Custom required message")
      expect(() => schema.parse("999")).toThrow("Custom invalid message")
      expect(() => schema.parse("10001")).toThrow("Custom 3-digit only message")
    })

    it("should fallback to default messages when custom not provided", () => {
      const schema = twPostalCode(true, {
        format: "6",
        i18n: {
          "en-US": {
            required: "Custom required message",
          },
          "zh-TW": {
            required: "客製化必填訊息",
          },
        },
      })

      expect(() => schema.parse("")).toThrow("Custom required message")
      expect(() => schema.parse("100")).toThrow("Only 6-digit postal codes are allowed") // Default message
    })

    it("should use correct locale for custom messages", () => {
      setLocale("en-US")
      const schemaEn = twPostalCode(true, {
        format: "3",
        i18n: {
          "en-US": {
            invalid: "English invalid message",
          },
          "zh-TW": {
            invalid: "繁體中文無效訊息",
          },
        },
      })
      expect(() => schemaEn.parse("999")).toThrow("English invalid message")

      setLocale("zh-TW")
      const schemaZh = twPostalCode(true, {
        format: "3",
        i18n: {
          "en-US": {
            invalid: "English invalid message",
          },
          "zh-TW": {
            invalid: "繁體中文無效訊息",
          },
        },
      })
      expect(() => schemaZh.parse("999")).toThrow("繁體中文無效訊息")
    })
  })

  describe("complex scenarios", () => {
    it("should work with multiple validations", () => {
      const schema = twPostalCode(true, {
        format: "6",
        allowDashes: true,
        strictValidation: true,
        allowedPrefixes: ["100", "200", "300"],
        transform: (val) => val.replace(/\D/g, "").padEnd(6, "0"),
      })

      expect(schema.parse("100-001")).toBe("100001")
      expect(schema.parse("200")).toBe("200000")
      expect(schema.parse("300001")).toBe("300001")

      expect(() => schema.parse("400-001")).toThrow("Invalid Taiwan postal code") // Not in allowedPrefixes
      expect(schema.parse("100")).toBe("100000") // After transform and padding, becomes "100000" which is valid
    })

    it("should handle edge cases with transforms and dashes", () => {
      const schema = twPostalCode(true, {
        format: "all",
        allowDashes: true,
        transform: (val) => val.toUpperCase().replace(/[^0-9-]/g, ""),
      })

      expect(schema.parse("100ABC-001DEF")).toBe("100001")
      expect(schema.parse("200XYZ")).toBe("200")
      expect(schema.parse("300-01#$%")).toBe("30001")
    })

    it("should validate comprehensive Taiwan postal code coverage", () => {
      const schema = twPostalCode(true, { format: "all", strictValidation: true })

      // Test various regions
      const validCodes = [
        // Taipei area
        "100",
        "103",
        "104",
        "105",
        "106",
        "108",
        "110",
        "111",
        "112",
        "114",
        "115",
        "116",
        "10001",
        "10301",
        "100001",
        "103001",

        // New Taipei area
        "220",
        "221",
        "222",
        "223",
        "224",
        "226",
        "227",
        "228",
        "22001",
        "221001",

        // Taoyuan area
        "320",
        "324",
        "325",
        "326",
        "327",
        "328",
        "330",
        "333",
        "32001",
        "320001",

        // Offshore islands
        "880",
        "881",
        "882",
        "883",
        "884",
        "885", // Penghu
        "890",
        "891",
        "892",
        "893",
        "894",
        "895",
        "896", // Kinmen
        "209",
        "210",
        "211",
        "212", // Lienchiang (Matsu)
        "88001",
        "890001",
        "209001",
      ]

      validCodes.forEach((code) => {
        expect(schema.parse(code)).toBe(code)
      })
    })

    it("should work with real-world postal codes", () => {
      const schema = twPostalCode(true, { format: "all", allowDashes: true })

      // Real Taiwan postal codes
      expect(schema.parse("100")).toBe("100") // Taipei Main Post Office
      expect(schema.parse("110")).toBe("110") // Xinyi District, Taipei
      expect(schema.parse("220")).toBe("220") // Banqiao District, New Taipei
      expect(schema.parse("300")).toBe("300") // East District, Hsinchu City
      expect(schema.parse("400")).toBe("400") // Central District, Taichung
      expect(schema.parse("700")).toBe("700") // Central District, Tainan
      expect(schema.parse("800")).toBe("800") // Xinxing District, Kaohsiung
      expect(schema.parse("880")).toBe("880") // Magong City, Penghu
      expect(schema.parse("890")).toBe("890") // Jincheng Township, Kinmen

      // With dashes
      expect(schema.parse("100-01")).toBe("10001") // 5-digit format
      expect(schema.parse("100-001")).toBe("100001") // 6-digit format
    })
  })

  describe("strict suffix validation with regional ranges", () => {
    it("should validate 5-digit suffix ranges for major cities", () => {
      const schema = twPostalCode(true, { format: "5", strictSuffixValidation: true })
      // Taipei areas (full range 01-99)
      expect(schema.parse("10001")).toBe("10001") // Valid suffix 01
      expect(schema.parse("10099")).toBe("10099") // Valid suffix 99
      expect(schema.parse("11050")).toBe("11050") // Xinyi District mid-range
      expect(() => schema.parse("10000")).toThrow("Invalid postal code suffix") // Invalid suffix 00
    })

    it("should validate 6-digit suffix ranges for major cities", () => {
      const schema = twPostalCode(true, { format: "6", strictSuffixValidation: true })
      // Taipei areas (full range 001-999)
      expect(schema.parse("100001")).toBe("100001") // Valid suffix 001
      expect(schema.parse("100999")).toBe("100999") // Valid suffix 999
      expect(schema.parse("110500")).toBe("110500") // Xinyi District mid-range
      expect(() => schema.parse("100000")).toThrow("Invalid postal code suffix") // Invalid suffix 000
    })

    it("should validate restricted ranges for smaller areas", () => {
      const schema = twPostalCode(true, { format: "all", strictSuffixValidation: true })

      // Penghu (limited range)
      expect(schema.parse("88001")).toBe("88001") // Valid for Penghu
      expect(schema.parse("88050")).toBe("88050") // Within Penghu 5-digit range
      expect(schema.parse("880001")).toBe("880001") // Valid for Penghu 6-digit
      expect(schema.parse("880500")).toBe("880500") // Within Penghu 6-digit range
      expect(() => schema.parse("88099")).toThrow("Invalid postal code suffix") // Beyond Penghu 5-digit range
      expect(() => schema.parse("880999")).toThrow("Invalid postal code suffix") // Beyond Penghu 6-digit range

      // Kinmen (more limited range)
      expect(schema.parse("89001")).toBe("89001") // Valid for Kinmen
      expect(schema.parse("89030")).toBe("89030") // Within Kinmen range
      expect(() => schema.parse("89050")).toThrow("Invalid postal code suffix") // Beyond Kinmen range

      // Matsu (most limited range)
      expect(schema.parse("20901")).toBe("20901") // Valid for Matsu
      expect(schema.parse("20920")).toBe("20920") // Within Matsu range
      expect(() => schema.parse("20930")).toThrow("Invalid postal code suffix") // Beyond Matsu range
    })

    it("should allow any suffix when strictSuffixValidation is disabled", () => {
      const schema = twPostalCode(true, { format: "all", strictSuffixValidation: false })
      expect(schema.parse("10000")).toBe("10000") // Suffix 00 allowed
      expect(schema.parse("100000")).toBe("100000") // Suffix 000 allowed
      expect(schema.parse("10099")).toBe("10099") // Normal suffix
    })
  })

  describe("5-digit deprecation", () => {
    it("should reject 5-digit codes when deprecate5Digit is enabled", () => {
      const schema = twPostalCode(true, { format: "all", deprecate5Digit: true })
      expect(schema.parse("100")).toBe("100") // 3-digit still allowed
      expect(schema.parse("100001")).toBe("100001") // 6-digit still allowed
      expect(() => schema.parse("10001")).toThrow("5-digit postal codes are deprecated") // 5-digit rejected
    })

    it("should allow 5-digit codes when deprecate5Digit is disabled", () => {
      const schema = twPostalCode(true, { format: "all", deprecate5Digit: false })
      expect(schema.parse("10001")).toBe("10001") // 5-digit allowed
    })
  })

  describe("combined strict validation scenarios", () => {
    it("should work with both strictSuffixValidation and deprecate5Digit", () => {
      const schema = twPostalCode(true, {
        format: "6",
        strictSuffixValidation: true,
        deprecate5Digit: true,
      })
      expect(schema.parse("100001")).toBe("100001") // Valid 6-digit
      expect(() => schema.parse("100000")).toThrow("Invalid postal code suffix") // Invalid suffix
      expect(() => schema.parse("10001")).toThrow("Only 6-digit postal codes are allowed") // Wrong format
    })

    it("should provide specific error for real-world validation scenarios", () => {
      const realWorldSchema = twPostalCode(true, {
        format: "6",
        strictSuffixValidation: true,
        strictValidation: true,
      })

      // Valid real postal codes from major cities
      expect(realWorldSchema.parse("100001")).toBe("100001") // Taipei Zhongzheng
      expect(realWorldSchema.parse("110015")).toBe("110015") // Taipei Xinyi
      expect(realWorldSchema.parse("800001")).toBe("800001") // Kaohsiung Xinxing
      expect(realWorldSchema.parse("400500")).toBe("400500") // Taichung Central
      expect(realWorldSchema.parse("700300")).toBe("700300") // Tainan Central

      // Valid postal codes from smaller areas with restricted ranges
      expect(realWorldSchema.parse("880025")).toBe("880025") // Penghu (within range)
      expect(realWorldSchema.parse("890015")).toBe("890015") // Kinmen (within range)
      expect(realWorldSchema.parse("209010")).toBe("209010") // Matsu (within range)

      // Invalid due to suffix being 000
      expect(() => realWorldSchema.parse("100000")).toThrow("Invalid postal code suffix")

      // Invalid due to suffix exceeding area-specific ranges
      expect(() => realWorldSchema.parse("880600")).toThrow("Invalid postal code suffix") // Penghu beyond range
      expect(() => realWorldSchema.parse("890350")).toThrow("Invalid postal code suffix") // Kinmen beyond range
      expect(() => realWorldSchema.parse("209250")).toThrow("Invalid postal code suffix") // Matsu beyond range

      // Invalid due to prefix not in official list
      expect(() => realWorldSchema.parse("999001")).toThrow("Invalid Taiwan postal code")
    })
  })

  describe("regional-specific validation", () => {
    it("should validate major cities with full ranges", () => {
      const schema = twPostalCode(true, { format: "all", strictSuffixValidation: true })

      // Taipei City areas - should have full 01-99 and 001-999 ranges
      const taipeiAreas = ["100", "103", "104", "105", "106", "108", "110", "111", "112", "114", "115", "116"]
      taipeiAreas.forEach((area) => {
        expect(schema.parse(`${area}01`)).toBe(`${area}01`) // Min 5-digit
        expect(schema.parse(`${area}99`)).toBe(`${area}99`) // Max 5-digit
        expect(schema.parse(`${area}001`)).toBe(`${area}001`) // Min 6-digit
        expect(schema.parse(`${area}999`)).toBe(`${area}999`) // Max 6-digit
      })

      // Test major cities
      expect(schema.parse("32050")).toBe("32050") // Taoyuan
      expect(schema.parse("40050")).toBe("40050") // Taichung
      expect(schema.parse("70050")).toBe("70050") // Tainan
      expect(schema.parse("80050")).toBe("80050") // Kaohsiung
    })

    it("should enforce restricted ranges for offshore islands", () => {
      const schema = twPostalCode(true, { format: "all", strictSuffixValidation: true })

      // Penghu County (880) - limited to 01-50 and 001-500
      expect(schema.parse("88001")).toBe("88001")
      expect(schema.parse("88050")).toBe("88050")
      expect(schema.parse("880001")).toBe("880001")
      expect(schema.parse("880500")).toBe("880500")
      expect(() => schema.parse("88051")).toThrow() // Beyond range
      expect(() => schema.parse("880501")).toThrow() // Beyond range

      // Kinmen County (890) - limited to 01-30 and 001-300
      expect(schema.parse("89001")).toBe("89001")
      expect(schema.parse("89030")).toBe("89030")
      expect(schema.parse("890001")).toBe("890001")
      expect(schema.parse("890300")).toBe("890300")
      expect(() => schema.parse("89031")).toThrow() // Beyond range
      expect(() => schema.parse("890301")).toThrow() // Beyond range

      // Lienchiang County/Matsu (209) - limited to 01-20 and 001-200
      expect(schema.parse("20901")).toBe("20901")
      expect(schema.parse("20920")).toBe("20920")
      expect(schema.parse("209001")).toBe("209001")
      expect(schema.parse("209200")).toBe("209200")
      expect(() => schema.parse("20921")).toThrow() // Beyond range
      expect(() => schema.parse("209201")).toThrow() // Beyond range
    })

    it("should use default ranges for areas not in specific mapping", () => {
      const schema = twPostalCode(true, { format: "all", strictSuffixValidation: true })

      // Areas not specifically mapped should use default ranges (01-99, 001-999)
      expect(schema.parse("26001")).toBe("26001") // Yilan - uses default
      expect(schema.parse("26099")).toBe("26099")
      expect(schema.parse("260001")).toBe("260001")
      expect(schema.parse("260999")).toBe("260999")
      expect(() => schema.parse("26000")).toThrow() // Invalid suffix 00
      expect(() => schema.parse("260000")).toThrow() // Invalid suffix 000
    })
  })

  describe("edge cases", () => {
    it("should handle empty and whitespace inputs", () => {
      const schema = twPostalCode(false)
      expect(schema.parse("")).toBe(null)
      expect(schema.parse("   ")).toBe(null)
      expect(schema.parse("\t")).toBe(null)
      expect(schema.parse("\n")).toBe(null)
    })

    it("should handle numeric inputs", () => {
      const schema = twPostalCode(true, { format: "3" })
      expect(schema.parse(100)).toBe("100")
      expect(schema.parse(200)).toBe("200")
    })

    it("should reject codes with letters when not using transform", () => {
      const schema = twPostalCode(true, { format: "3", allowDashes: false })
      expect(() => schema.parse("10A")).toThrow("Invalid Taiwan postal code")
      expect(() => schema.parse("ABC")).toThrow("Invalid Taiwan postal code")
    })

    it("should handle very specific area restrictions", () => {
      // Only allow Taipei city areas
      const taipeiOnlySchema = twPostalCode(true, {
        format: "all",
        allowedPrefixes: ["100", "103", "104", "105", "106", "108", "110", "111", "112", "114", "115", "116"],
      })

      expect(taipeiOnlySchema.parse("100")).toBe("100")
      expect(taipeiOnlySchema.parse("110001")).toBe("110001")
      expect(() => taipeiOnlySchema.parse("220")).toThrow("Invalid Taiwan postal code") // New Taipei, not Taipei
    })

    it("should handle format combinations correctly", () => {
      const schema35 = twPostalCode(true, { format: "3+5" })
      expect(schema35.parse("100")).toBe("100")
      expect(schema35.parse("10001")).toBe("10001")
      expect(() => schema35.parse("100001")).toThrow("Invalid Taiwan postal code")

      const schema56 = twPostalCode(true, { format: "5+6" })
      expect(schema56.parse("10001")).toBe("10001")
      expect(schema56.parse("100001")).toBe("100001")
      expect(() => schema56.parse("100")).toThrow("Invalid Taiwan postal code")
    })
  })
})
