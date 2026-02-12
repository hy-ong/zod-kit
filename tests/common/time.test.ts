import { describe, it, expect, beforeEach } from "vitest"
import { time, setLocale, validateTimeFormat, parseTimeToMinutes, normalizeTime } from "../../src"

describe("Taiwan time(true) validator", () => {
  beforeEach(() => setLocale("en-US"))

  describe("basic functionality", () => {
    it("should validate correct time formats", () => {
      const schema24 = time(true, { format: "HH:mm" })
      const schema12 = time(true, { format: "hh:mm A" })
      const schemaWithSeconds = time(true, { format: "HH:mm:ss" })

      // 24-hour format
      expect(schema24.parse("09:30")).toBe("09:30")
      expect(schema24.parse("14:45")).toBe("14:45")
      expect(schema24.parse("00:00")).toBe("00:00")
      expect(schema24.parse("23:59")).toBe("23:59")

      // 12-hour format
      expect(schema12.parse("09:30 AM")).toBe("09:30 AM")
      expect(schema12.parse("02:45 PM")).toBe("02:45 PM")
      expect(schema12.parse("12:00 AM")).toBe("12:00 AM")
      expect(schema12.parse("12:00 PM")).toBe("12:00 PM")

      // With seconds
      expect(schemaWithSeconds.parse("14:30:45")).toBe("14:30:45")
      expect(schemaWithSeconds.parse("00:00:00")).toBe("00:00:00")
      expect(schemaWithSeconds.parse("23:59:59")).toBe("23:59:59")
    })

    it("should validate single digit hour format", () => {
      const schemaH = time(true, { format: "H:mm" })
      const schemah = time(true, { format: "h:mm A" })

      // Single digit 24-hour
      expect(schemaH.parse("9:30")).toBe("9:30")
      expect(schemaH.parse("14:45")).toBe("14:45")

      // Single digit 12-hour
      expect(schemah.parse("9:30 AM")).toBe("9:30 AM")
      expect(schemah.parse("2:45 PM")).toBe("2:45 PM")
    })

    it("should reject invalid time formats", () => {
      const schema = time(true, { format: "HH:mm" })

      // Invalid formats
      expect(() => schema.parse("25:30")).toThrow("Must be in HH:mm format")
      expect(() => schema.parse("14:70")).toThrow("Must be in HH:mm format")
      expect(() => schema.parse("abc")).toThrow("Must be in HH:mm format")
      expect(() => schema.parse("14")).toThrow("Must be in HH:mm format")
      expect(() => schema.parse("14:30:45")).toThrow("Must be in HH:mm format") // seconds not allowed
      expect(() => schema.parse("2:30 PM")).toThrow("Must be in HH:mm format") // 12-hour in 24-hour format
    })

    it("should handle whitespace trimming", () => {
      const schema = time(true, { format: "HH:mm" })

      expect(schema.parse("  14:30  ")).toBe("14:30")
      expect(schema.parse("\t09:15\n")).toBe("09:15")
    })
  })

  describe("whitelist functionality", () => {
    it("should accept any string in whitelist regardless of format", () => {
      const schema = time(true, {
        format: "HH:mm",
        whitelist: ["anytime", "flexible", "TBD"],
      })

      expect(schema.parse("anytime")).toBe("anytime")
      expect(schema.parse("flexible")).toBe("flexible")
      expect(schema.parse("TBD")).toBe("TBD")
      expect(schema.parse("14:30")).toBe("14:30") // Valid time still works
    })

    it("should reject values not in whitelist when whitelistOnly is true", () => {
      const schema = time(true, {
        format: "HH:mm",
        whitelist: ["morning", "14:30"],
        whitelistOnly: true,
      })

      expect(schema.parse("morning")).toBe("morning")
      expect(schema.parse("14:30")).toBe("14:30")

      // Invalid times not in whitelist should be rejected
      expect(() => schema.parse("15:30")).toThrow("Time is not in the allowed list")
      expect(() => schema.parse("evening")).toThrow("Time is not in the allowed list")
    })

    it("should work with empty whitelist", () => {
      const schema = time(true, {
        format: "HH:mm",
        whitelist: [],
      })

      // With empty whitelist, should still validate time format
      expect(schema.parse("14:30")).toBe("14:30")
      expect(() => schema.parse("invalid")).toThrow("Must be in HH:mm format")
    })

    it("should prioritize whitelist over format validation", () => {
      const schema = time(false, { format: "HH:mm", whitelist: ["not-a-time", "123", ""] })

      expect(schema.parse("not-a-time")).toBe("not-a-time")
      expect(schema.parse("123")).toBe("123")
      expect(schema.parse("")).toBe("")
    })
  })

  describe("required/optional behavior", () => {
    it("should handle required=true (default)", () => {
      const schema = time(true, { format: "HH:mm" })

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse(null)).toThrow("Required")
      expect(() => schema.parse(undefined)).toThrow("Required")
    })

    it("should handle required=false", () => {
      const schema = time(false, { format: "HH:mm" })

      expect(schema.parse("")).toBe(null)
      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
      expect(schema.parse("14:30")).toBe("14:30")
    })

    it("should use default values", () => {
      const requiredSchema = time(true, { format: "HH:mm", defaultValue: "09:00" })
      const optionalSchema = time(false, { format: "HH:mm", defaultValue: "12:00" })

      expect(requiredSchema.parse("")).toBe("09:00")
      expect(requiredSchema.parse(null)).toBe("09:00")
      expect(optionalSchema.parse("")).toBe("12:00")
      expect(optionalSchema.parse(null)).toBe("12:00")
    })

    it("should handle whitelist with optional fields", () => {
      const schema = time(false, { format: "HH:mm", whitelist: ["flexible", "14:30"], whitelistOnly: true })

      expect(schema.parse("")).toBe(null)
      expect(schema.parse("flexible")).toBe("flexible")
      expect(schema.parse("14:30")).toBe("14:30")
      expect(() => schema.parse("15:30")).toThrow("Time is not in the allowed list")
    })
  })

  describe("time range validation", () => {
    it("should validate minimum and maximum times", () => {
      const schema = time(true, {
        format: "HH:mm",
        min: "09:00",
        max: "17:00",
      })

      // Valid times within range
      expect(schema.parse("09:00")).toBe("09:00")
      expect(schema.parse("12:30")).toBe("12:30")
      expect(schema.parse("17:00")).toBe("17:00")

      // Invalid times outside range
      expect(() => schema.parse("08:59")).toThrow("Time must be after")
      expect(() => schema.parse("17:01")).toThrow("Time must be before")
    })

    it("should validate hour ranges", () => {
      const schema = time(true, {
        format: "HH:mm",
        minHour: 9,
        maxHour: 17,
      })

      // Valid hours
      expect(schema.parse("09:30")).toBe("09:30")
      expect(schema.parse("17:45")).toBe("17:45")

      // Invalid hours
      expect(() => schema.parse("08:30")).toThrow("Hour must be between")
      expect(() => schema.parse("18:30")).toThrow("Hour must be between")
    })

    it("should validate allowed hours", () => {
      const schema = time(true, {
        format: "HH:mm",
        allowedHours: [9, 12, 15, 18],
      })

      // Valid hours
      expect(schema.parse("09:30")).toBe("09:30")
      expect(schema.parse("12:00")).toBe("12:00")
      expect(schema.parse("15:45")).toBe("15:45")
      expect(schema.parse("18:00")).toBe("18:00")

      // Invalid hours
      expect(() => schema.parse("10:30")).toThrow("Hour must be between")
      expect(() => schema.parse("16:30")).toThrow("Hour must be between")
    })

    it("should validate minute steps", () => {
      const schema = time(true, {
        format: "HH:mm",
        minuteStep: 15,
      })

      // Valid minute steps (0, 15, 30, 45)
      expect(schema.parse("14:00")).toBe("14:00")
      expect(schema.parse("14:15")).toBe("14:15")
      expect(schema.parse("14:30")).toBe("14:30")
      expect(schema.parse("14:45")).toBe("14:45")

      // Invalid minute steps
      expect(() => schema.parse("14:05")).toThrow("minute")
      expect(() => schema.parse("14:37")).toThrow("minute")
    })
  })

  describe("transform function", () => {
    it("should apply custom transform", () => {
      const schema = time(true, {
        format: "HH:mm",
        transform: (val) => val.toUpperCase(),
      })

      expect(schema.parse("14:30")).toBe("14:30")
    })

    it("should apply transform before validation", () => {
      const schema = time(true, {
        format: "HH:mm",
        transform: (val) => val.replace(/\s+/g, ""),
      })

      expect(schema.parse("1 4 : 3 0")).toBe("14:30")
    })

    it("should work with whitelist after transform", () => {
      const schema = time(true, {
        format: "HH:mm",
        transform: (val) => val.toLowerCase(),
        whitelist: ["morning", "14:30"],
      })

      expect(schema.parse("MORNING")).toBe("morning")
      expect(schema.parse("14:30")).toBe("14:30")
    })
  })

  describe("input preprocessing", () => {
    it("should handle string conversion", () => {
      const schema = time(true, { format: "HH:mm" })

      // Test string conversion of numbers
      expect(() => schema.parse(1430)).toThrow("Must be in HH:mm format") // Invalid because not in HH:mm format
    })

    it("should trim whitespace", () => {
      const schema = time(true, { format: "HH:mm" })

      expect(schema.parse("  14:30  ")).toBe("14:30")
      expect(schema.parse("\t09:15\n")).toBe("09:15")
    })
  })

  describe("utility function", () => {
    describe("validateTimeFormat", () => {
      it("should correctly validate time formats", () => {
        // 24-hour format
        expect(validateTimeFormat("14:30", "HH:mm")).toBe(true)
        expect(validateTimeFormat("09:00", "HH:mm")).toBe(true)
        expect(validateTimeFormat("25:30", "HH:mm")).toBe(false)
        expect(validateTimeFormat("14:70", "HH:mm")).toBe(false)

        // 12-hour format
        expect(validateTimeFormat("02:30 PM", "hh:mm A")).toBe(true)
        expect(validateTimeFormat("12:00 AM", "hh:mm A")).toBe(true)
        expect(validateTimeFormat("13:30 PM", "hh:mm A")).toBe(false)
        expect(validateTimeFormat("02:30", "hh:mm A")).toBe(false)

        // With seconds
        expect(validateTimeFormat("14:30:45", "HH:mm:ss")).toBe(true)
        expect(validateTimeFormat("14:30:70", "HH:mm:ss")).toBe(false)

        // Single digit hours
        expect(validateTimeFormat("9:30", "H:mm")).toBe(true)
        expect(validateTimeFormat("9:30 AM", "h:mm A")).toBe(true)
      })
    })

    describe("parseTimeToMinutes", () => {
      it("should parse 24-hour format correctly", () => {
        expect(parseTimeToMinutes("00:00", "HH:mm")).toBe(0)
        expect(parseTimeToMinutes("12:30", "HH:mm")).toBe(750) // 12*60 + 30
        expect(parseTimeToMinutes("23:59", "HH:mm")).toBe(1439) // 23*60 + 59
      })

      it("should parse 12-hour format correctly", () => {
        expect(parseTimeToMinutes("12:00 AM", "hh:mm A")).toBe(0)
        expect(parseTimeToMinutes("12:30 PM", "hh:mm A")).toBe(750)
        expect(parseTimeToMinutes("11:59 PM", "hh:mm A")).toBe(1439)
        expect(parseTimeToMinutes("01:30 PM", "hh:mm A")).toBe(810) // 13*60 + 30
      })

      it("should handle invalid times", () => {
        expect(parseTimeToMinutes("25:30", "HH:mm")).toBe(null)
        expect(parseTimeToMinutes("14:70", "HH:mm")).toBe(null)
        expect(parseTimeToMinutes("invalid", "HH:mm")).toBe(null)
      })
    })

    describe("normalizeTime", () => {
      it("should normalize 12-hour to 24-hour format", () => {
        expect(normalizeTime("12:00 AM", "hh:mm A")).toBe("00:00")
        expect(normalizeTime("12:30 PM", "hh:mm A")).toBe("12:30")
        expect(normalizeTime("01:30 PM", "hh:mm A")).toBe("13:30")
        expect(normalizeTime("11:59 PM", "hh:mm A")).toBe("23:59")
      })

      it("should normalize single digit hours", () => {
        expect(normalizeTime("9:30", "H:mm")).toBe("09:30")
        expect(normalizeTime("14:30", "H:mm")).toBe("14:30")
      })

      it("should handle seconds format", () => {
        expect(normalizeTime("01:30:45 PM", "hh:mm:ss A")).toBe("13:30:45")
      })
    })
  })

  describe("i18n support", () => {
    it("should use English messages by default", () => {
      setLocale("en-US")
      const schema = time(true, { format: "HH:mm" })

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("invalid")).toThrow("Must be in HH:mm format")
    })

    it("should use Chinese messages when locale is zh-TW", () => {
      setLocale("zh-TW")
      const schema = time(true, { format: "HH:mm" })

      expect(() => schema.parse("")).toThrow("必填")
      expect(() => schema.parse("invalid")).toThrow("必須為 HH:mm 格式")
    })

    it("should support whitelist error messages", () => {
      setLocale("en-US")
      const schema = time(true, {
        format: "HH:mm",
        whitelist: ["morning"],
        whitelistOnly: true,
      })

      expect(() => schema.parse("14:30")).toThrow("Time is not in the allowed list")
    })

    it("should support custom i18n messages", () => {
      const schema = time(true, {
        format: "HH:mm",
        i18n: {
          "en-US": {
            required: "Time is required",
            invalid: "Please enter a valid time",
          },
          "zh-TW": {
            required: "請輸入時間",
            invalid: "請輸入有效的時間格式",
          },
        },
      })

      setLocale("en-US")
      expect(() => schema.parse("")).toThrow("Time is required")

      setLocale("zh-TW")
      expect(() => schema.parse("")).toThrow("請輸入時間")
    })

    it("should support custom whitelist messages", () => {
      const schema = time(true, {
        format: "HH:mm",
        whitelist: ["morning"],
        whitelistOnly: true,
        i18n: {
          "en-US": {
            notInWhitelist: "This time is not allowed",
          },
          "zh-TW": {
            notInWhitelist: "此時間不被允許",
          },
        },
      })

      setLocale("en-US")
      expect(() => schema.parse("14:30")).toThrow("This time is not allowed")

      setLocale("zh-TW")
      expect(() => schema.parse("14:30")).toThrow("此時間不被允許")
    })
  })

  describe("real world time scenarios", () => {
    it("should validate business hours", () => {
      const businessHours = time(true, {
        format: "HH:mm",
        min: "09:00",
        max: "17:00",
        minuteStep: 30,
      })

      expect(businessHours.parse("09:00")).toBe("09:00")
      expect(businessHours.parse("12:30")).toBe("12:30")
      expect(businessHours.parse("17:00")).toBe("17:00")

      expect(() => businessHours.parse("08:30")).toThrow("Time must be after")
      expect(() => businessHours.parse("17:30")).toThrow("Time must be before")
      expect(() => businessHours.parse("12:15")).toThrow("minute")
    })

    it("should validate appointment slots", () => {
      const appointmentSlots = time(true, {
        format: "hh:mm A",
        allowedHours: [9, 10, 11, 14, 15, 16],
        minuteStep: 15,
      })

      expect(appointmentSlots.parse("09:00 AM")).toBe("09:00 AM")
      expect(appointmentSlots.parse("02:15 PM")).toBe("02:15 PM")
      expect(appointmentSlots.parse("04:45 PM")).toBe("04:45 PM")

      expect(() => appointmentSlots.parse("12:00 PM")).toThrow("Hour must be between")
      expect(() => appointmentSlots.parse("09:05 AM")).toThrow("minute")
    })

    it("should handle flexible time input", () => {
      const flexibleTime = time(false, { format: "HH:mm", whitelist: ["morning", "afternoon", "evening", "anytime"] })

      expect(flexibleTime.parse("morning")).toBe("morning")
      expect(flexibleTime.parse("14:30")).toBe("14:30")
      expect(flexibleTime.parse("")).toBe(null)
      expect(() => flexibleTime.parse("invalid")).toThrow("Must be in HH:mm format")
    })
  })

  describe("edge cases", () => {
    it("should handle various input types", () => {
      const schema = time(true, { format: "HH:mm" })

      // Test different input types that should be converted to string
      expect(schema.parse("14:30")).toBe("14:30")
    })

    it("should handle empty and whitespace inputs", () => {
      const requiredSchema = time(true, { format: "HH:mm" })
      const optionalSchema = time(false, { format: "HH:mm" })

      expect(() => requiredSchema.parse("")).toThrow("Required")
      expect(() => requiredSchema.parse("   ")).toThrow("Required")

      expect(optionalSchema.parse("")).toBe(null)
      expect(optionalSchema.parse("   ")).toBe(null)
    })

    it("should preserve valid format after transformation", () => {
      const schema = time(true, {
        format: "HH:mm",
        transform: (val) => val.replace(/[^0-9:]/g, "").replace(/^(\d{2})(\d{2})$/, "$1:$2"),
      })

      expect(schema.parse("14abc:30def")).toBe("14:30")
      expect(schema.parse("0915")).toBe("09:15")
    })

    it("should work with complex whitelist scenarios", () => {
      const schema = time(false, { format: "HH:mm", whitelist: ["14:30", "TBD", "flexible", ""], whitelistOnly: true })

      // Whitelist scenarios
      expect(schema.parse("14:30")).toBe("14:30")
      expect(schema.parse("TBD")).toBe("TBD")
      expect(schema.parse("flexible")).toBe("flexible")
      expect(schema.parse("")).toBe("")

      // Not in the whitelist
      expect(() => schema.parse("15:30")).toThrow("Time is not in the allowed list")
      expect(() => schema.parse("other-value")).toThrow("Time is not in the allowed list")
    })

    it("should handle boundary cases for different formats", () => {
      const schema24 = time(true, { format: "HH:mm" })
      const schema12 = time(true, { format: "hh:mm A" })

      // 24-hour boundary cases
      expect(schema24.parse("00:00")).toBe("00:00")
      expect(schema24.parse("23:59")).toBe("23:59")

      // 12-hour boundary cases
      expect(schema12.parse("12:00 AM")).toBe("12:00 AM") // Midnight
      expect(schema12.parse("12:00 PM")).toBe("12:00 PM") // Noon
      expect(schema12.parse("01:00 AM")).toBe("01:00 AM")
      expect(schema12.parse("11:59 PM")).toBe("11:59 PM")

      // Invalid boundary cases
      expect(() => schema24.parse("24:00")).toThrow("Must be in")
      expect(() => schema12.parse("00:00 AM")).toThrow("Must be in")
      expect(() => schema12.parse("13:00 PM")).toThrow("Must be in")
    })
  })
})
