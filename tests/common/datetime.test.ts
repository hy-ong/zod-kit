import { describe, it, expect, beforeEach } from "vitest"
import { datetime, setLocale, validateDateTimeFormat, parseDateTimeValue, normalizeDateTimeValue } from "../../src"
import dayjs from "dayjs"

describe("Taiwan datetime(true) validator", () => {
  beforeEach(() => setLocale("en-US"))

  describe("basic functionality", () => {
    it("should validate correct datetime formats", () => {
      const schemaISO = datetime(true, { format: "YYYY-MM-DD HH:mm" })
      const schemaUS = datetime(true, { format: "MM/DD/YYYY HH:mm" })
      const schemaEU = datetime(true, { format: "DD/MM/YYYY HH:mm" })
      const schemaWithSeconds = datetime(true, { format: "YYYY-MM-DD HH:mm:ss" })
      const schema12Hour = datetime(true, { format: "YYYY-MM-DD hh:mm A" })

      // ISO format
      expect(schemaISO.parse("2024-03-15 14:30")).toBe("2024-03-15 14:30")
      expect(schemaISO.parse("2024-12-31 23:59")).toBe("2024-12-31 23:59")
      expect(schemaISO.parse("2024-01-01 00:00")).toBe("2024-01-01 00:00")

      // US format
      expect(schemaUS.parse("03/15/2024 14:30")).toBe("03/15/2024 14:30")
      expect(schemaUS.parse("12/31/2024 23:59")).toBe("12/31/2024 23:59")

      // EU format
      expect(schemaEU.parse("15/03/2024 14:30")).toBe("15/03/2024 14:30")
      expect(schemaEU.parse("31/12/2024 23:59")).toBe("31/12/2024 23:59")

      // With seconds
      expect(schemaWithSeconds.parse("2024-03-15 14:30:45")).toBe("2024-03-15 14:30:45")
      expect(schemaWithSeconds.parse("2024-01-01 00:00:00")).toBe("2024-01-01 00:00:00")

      // 12-hour format
      expect(schema12Hour.parse("2024-03-15 02:30 PM")).toBe("2024-03-15 02:30 PM")
      expect(schema12Hour.parse("2024-03-15 12:00 AM")).toBe("2024-03-15 12:00 AM")
      expect(schema12Hour.parse("2024-03-15 12:00 PM")).toBe("2024-03-15 12:00 PM")
    })

    it("should validate special formats", () => {
      const isoSchema = datetime(true, { format: "ISO" })
      const rfcSchema = datetime(true, { format: "RFC" })
      const unixSchema = datetime(true, { format: "UNIX" })

      // ISO 8601
      expect(isoSchema.parse("2024-03-15T14:30:45.000Z")).toBe("2024-03-15T14:30:45.000Z")
      expect(isoSchema.parse("2024-03-15T14:30:45Z")).toBe("2024-03-15T14:30:45Z")

      // RFC 2822
      expect(rfcSchema.parse("Fri, 15 Mar 2024 14:30:45 GMT")).toBe("Fri, 15 Mar 2024 14:30:45 GMT")

      // Unix timestamp
      expect(unixSchema.parse("1710508245")).toBe("1710508245")
    })

    it("should reject invalid datetime formats", () => {
      const schema = datetime(true, { format: "YYYY-MM-DD HH:mm" })

      // Invalid date formats
      expect(() => schema.parse("2024-13-15 14:30")).toThrow("Must be in YYYY-MM-DD HH:mm format")
      expect(() => schema.parse("2024-03-32 14:30")).toThrow("Must be in YYYY-MM-DD HH:mm format")
      expect(() => schema.parse("2024-03-15 25:30")).toThrow("Must be in YYYY-MM-DD HH:mm format")
      expect(() => schema.parse("2024-03-15 14:70")).toThrow("Must be in YYYY-MM-DD HH:mm format")
      expect(() => schema.parse("abc")).toThrow("Must be in YYYY-MM-DD HH:mm format")
      expect(() => schema.parse("2024/03/15 14:30")).toThrow("Must be in YYYY-MM-DD HH:mm format") // Wrong format
    })

    it("should handle whitespace trimming", () => {
      const schema = datetime(true, { format: "YYYY-MM-DD HH:mm" })

      expect(schema.parse("  2024-03-15 14:30  ")).toBe("2024-03-15 14:30")
      expect(schema.parse("\t2024-03-15 09:15\n")).toBe("2024-03-15 09:15")
    })
  })

  describe("whitelist functionality", () => {
    it("should accept any string in whitelist regardless of format", () => {
      const schema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        whitelist: ["now", "tomorrow", "TBD"],
      })

      expect(schema.parse("now")).toBe("now")
      expect(schema.parse("tomorrow")).toBe("tomorrow")
      expect(schema.parse("TBD")).toBe("TBD")
      expect(schema.parse("2024-03-15 14:30")).toBe("2024-03-15 14:30") // Valid datetime still works
    })

    it("should reject values not in whitelist when whitelistOnly is true", () => {
      const schema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        whitelist: ["now", "2024-03-15 14:30"],
        whitelistOnly: true,
      })

      expect(schema.parse("now")).toBe("now")
      expect(schema.parse("2024-03-15 14:30")).toBe("2024-03-15 14:30")

      // Invalid datetimes not in whitelist should be rejected
      expect(() => schema.parse("2024-03-15 15:30")).toThrow("DateTime is not in the allowed list")
      expect(() => schema.parse("later")).toThrow("DateTime is not in the allowed list")
    })

    it("should work with empty whitelist", () => {
      const schema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        whitelist: [],
      })

      // With empty whitelist, should still validate datetime format
      expect(schema.parse("2024-03-15 14:30")).toBe("2024-03-15 14:30")
      expect(() => schema.parse("invalid")).toThrow("Must be in YYYY-MM-DD HH:mm format")
    })

    it("should prioritize whitelist over format validation", () => {
      const schema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        whitelist: ["anytime", "flexible", "TBD"],
      })

      expect(schema.parse("anytime")).toBe("anytime")
      expect(schema.parse("flexible")).toBe("flexible")
      expect(schema.parse("TBD")).toBe("TBD")
      expect(schema.parse("2024-03-15 14:30")).toBe("2024-03-15 14:30") // Valid datetime still works
    })
  })

  describe("required/optional behavior", () => {
    it("should handle required=true (default)", () => {
      const schema = datetime(true, { format: "YYYY-MM-DD HH:mm" })

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse(null)).toThrow("Required")
      expect(() => schema.parse(undefined)).toThrow("Required")
    })

    it("should handle required=false", () => {
      const schema = datetime(false, { format: "YYYY-MM-DD HH:mm" })

      expect(schema.parse("")).toBe(null)
      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
      expect(schema.parse("2024-03-15 14:30")).toBe("2024-03-15 14:30")
    })

    it("should use default values", () => {
      const requiredSchema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        defaultValue: "2024-01-01 12:00",
      })
      const optionalSchema = datetime(false, { format: "YYYY-MM-DD HH:mm", defaultValue: "2024-01-01 12:00" })

      expect(requiredSchema.parse("")).toBe("2024-01-01 12:00")
      expect(requiredSchema.parse(null)).toBe("2024-01-01 12:00")

      expect(optionalSchema.parse("")).toBe("2024-01-01 12:00")
      expect(optionalSchema.parse(null)).toBe("2024-01-01 12:00")
    })

    it("should handle whitelist with optional fields", () => {
      const schema = datetime(false, { format: "YYYY-MM-DD HH:mm", whitelist: ["flexible", "2024-03-15 14:30"], whitelistOnly: true })

      expect(schema.parse("")).toBe(null)
      expect(schema.parse("flexible")).toBe("flexible")
      expect(schema.parse("2024-03-15 14:30")).toBe("2024-03-15 14:30")
      expect(() => schema.parse("2024-03-15 15:30")).toThrow("DateTime is not in the allowed list")
    })
  })

  describe("datetime range validation", () => {
    it("should validate minimum and maximum datetimes", () => {
      const schema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        min: "2024-03-15 09:00",
        max: "2024-03-15 17:00",
      })

      // Valid datetimes within range
      expect(schema.parse("2024-03-15 09:00")).toBe("2024-03-15 09:00")
      expect(schema.parse("2024-03-15 12:30")).toBe("2024-03-15 12:30")
      expect(schema.parse("2024-03-15 17:00")).toBe("2024-03-15 17:00")

      // Invalid datetimes outside range
      expect(() => schema.parse("2024-03-15 08:59")).toThrow("DateTime must be after")
      expect(() => schema.parse("2024-03-15 17:01")).toThrow("DateTime must be before")
    })

    it("should validate hour ranges", () => {
      const schema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        minHour: 9,
        maxHour: 17,
      })

      expect(schema.parse("2024-03-15 09:30")).toBe("2024-03-15 09:30")
      expect(schema.parse("2024-03-15 17:30")).toBe("2024-03-15 17:30")

      expect(() => schema.parse("2024-03-15 08:30")).toThrow("Hour must be between")
      expect(() => schema.parse("2024-03-15 18:30")).toThrow("Hour must be between")
    })

    it("should validate allowed hours", () => {
      const schema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        allowedHours: [9, 10, 14, 15, 16],
      })

      expect(schema.parse("2024-03-15 09:30")).toBe("2024-03-15 09:30")
      expect(schema.parse("2024-03-15 14:30")).toBe("2024-03-15 14:30")

      expect(() => schema.parse("2024-03-15 08:30")).toThrow("Hour must be between")
      expect(() => schema.parse("2024-03-15 11:30")).toThrow("Hour must be between")
      expect(() => schema.parse("2024-03-15 17:30")).toThrow("Hour must be between")
    })

    it("should validate minute steps", () => {
      const schema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        minuteStep: 15,
      })

      expect(schema.parse("2024-03-15 14:00")).toBe("2024-03-15 14:00")
      expect(schema.parse("2024-03-15 14:15")).toBe("2024-03-15 14:15")
      expect(schema.parse("2024-03-15 14:30")).toBe("2024-03-15 14:30")
      expect(schema.parse("2024-03-15 14:45")).toBe("2024-03-15 14:45")

      expect(() => schema.parse("2024-03-15 14:05")).toThrow("Minutes must be in 15-minute intervals")
      expect(() => schema.parse("2024-03-15 14:37")).toThrow("Minutes must be in 15-minute intervals")
    })
  })

  describe("temporal validation", () => {
    it("should validate past dates", () => {
      const schema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        mustBePast: true,
      })

      const pastDate = dayjs().subtract(1, "day").format("YYYY-MM-DD HH:mm")
      const futureDate = dayjs().add(1, "day").format("YYYY-MM-DD HH:mm")

      expect(schema.parse(pastDate)).toBe(pastDate)
      expect(() => schema.parse(futureDate)).toThrow("DateTime must be in the past")
    })

    it("should validate future dates", () => {
      const schema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        mustBeFuture: true,
      })

      const pastDate = dayjs().subtract(1, "day").format("YYYY-MM-DD HH:mm")
      const futureDate = dayjs().add(1, "day").format("YYYY-MM-DD HH:mm")

      expect(schema.parse(futureDate)).toBe(futureDate)
      expect(() => schema.parse(pastDate)).toThrow("DateTime must be in the future")
    })

    it("should validate today", () => {
      const schema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        mustBeToday: true,
      })

      const todayDate = dayjs().format("YYYY-MM-DD") + " 14:30"
      const yesterdayDate = dayjs().subtract(1, "day").format("YYYY-MM-DD") + " 14:30"

      expect(schema.parse(todayDate)).toBe(todayDate)
      expect(() => schema.parse(yesterdayDate)).toThrow("DateTime must be today")
    })

    it("should validate weekdays and weekends", () => {
      const weekdaySchema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        weekdaysOnly: true,
      })

      const weekendSchema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        weekendsOnly: true,
      })

      // Find a Monday and a Saturday
      const monday = "2024-03-18 14:30" // This is a Monday
      const saturday = "2024-03-16 14:30" // This is a Saturday

      expect(weekdaySchema.parse(monday)).toBe(monday)
      expect(() => weekdaySchema.parse(saturday)).toThrow("DateTime must be a weekday")

      expect(weekendSchema.parse(saturday)).toBe(saturday)
      expect(() => weekendSchema.parse(monday)).toThrow("DateTime must be a weekend")
    })
  })

  describe("timezone support", () => {
    it("should handle timezone parsing", () => {
      const schema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        timezone: "Asia/Taipei",
      })

      expect(schema.parse("2024-03-15 14:30")).toBe("2024-03-15 14:30")
    })

    it("should validate with timezone-aware ranges", () => {
      const schema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        timezone: "Asia/Taipei",
        min: "2024-03-15 09:00",
        max: "2024-03-15 17:00",
      })

      expect(schema.parse("2024-03-15 12:30")).toBe("2024-03-15 12:30")
      expect(() => schema.parse("2024-03-15 08:30")).toThrow("DateTime must be after")
    })
  })

  describe("transform function", () => {
    it("should apply custom transform", () => {
      const schema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        transform: (val) => val.replace(/\//g, "-"),
      })

      expect(schema.parse("2024/03/15 14:30")).toBe("2024-03-15 14:30")
    })

    it("should apply transform before validation", () => {
      const schema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        transform: (val) => val.replace(/T/g, " ").replace(/Z$/, ""),
      })

      expect(schema.parse("2024-03-15T14:30Z")).toBe("2024-03-15 14:30")
    })

    it("should work with whitelist after transform", () => {
      const schema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        whitelist: ["NOW", "2024-03-15 14:30"],
        transform: (val) => val.toUpperCase(),
      })

      expect(schema.parse("now")).toBe("NOW")
      expect(schema.parse("2024-03-15 14:30")).toBe("2024-03-15 14:30")
    })
  })

  describe("input preprocessing", () => {
    it("should handle string conversion", () => {
      const schema = datetime(true, { format: "UNIX" })

      // Test string conversion of numbers
      expect(schema.parse(1710508245)).toBe("1710508245")
    })

    it("should trim whitespace", () => {
      const schema = datetime(true, { format: "YYYY-MM-DD HH:mm" })

      expect(schema.parse("  2024-03-15 14:30  ")).toBe("2024-03-15 14:30")
      expect(schema.parse("\t2024-03-15 09:15\n")).toBe("2024-03-15 09:15")
    })

    it("should handle different trim modes", () => {
      const trimStartSchema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        trimMode: "trimStart",
      })
      const trimEndSchema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        trimMode: "trimEnd",
      })
      const noTrimSchema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        trimMode: "none",
      })

      expect(trimStartSchema.parse("  2024-03-15 14:30  ")).toBe("2024-03-15 14:30  ")
      expect(trimEndSchema.parse("  2024-03-15 14:30  ")).toBe("  2024-03-15 14:30")
      expect(noTrimSchema.parse("  2024-03-15 14:30  ")).toBe("  2024-03-15 14:30  ")
    })

    it("should handle case transformations", () => {
      const upperSchema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        whitelist: ["NOW", "TOMORROW"],
        casing: "upper",
      })

      expect(upperSchema.parse("now")).toBe("NOW")
      expect(upperSchema.parse("2024-03-15 14:30")).toBe("2024-03-15 14:30")
    })
  })

  describe("custom regex validation", () => {
    it("should use custom regex instead of format validation", () => {
      const schema = datetime(true, {
        regex: /^(morning|afternoon|evening|night)$/,
      })

      expect(schema.parse("morning")).toBe("morning")
      expect(schema.parse("evening")).toBe("evening")
      expect(() => schema.parse("invalid")).toThrow("Invalid datetime format")
    })

    it("should skip datetime parsing with custom regex", () => {
      const schema = datetime(true, {
        regex: /^(now|later|asap)$/,
        mustBePast: true, // This should be ignored when using regex
      })

      expect(schema.parse("now")).toBe("now")
      expect(schema.parse("later")).toBe("later")
      expect(() => schema.parse("invalid")).toThrow("Invalid datetime format")
    })
  })

  describe("includes/excludes validation", () => {
    it("should validate includes", () => {
      const schema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        includes: "2024",
      })

      expect(schema.parse("2024-03-15 14:30")).toBe("2024-03-15 14:30")
      expect(() => schema.parse("2023-03-15 14:30")).toThrow("Must include 2024")
    })

    it("should validate excludes", () => {
      const schema = datetime(true, {
        regex: /^[\d\-\s:test]+$/, // Custom regex to allow "test" in the string
        excludes: ["test", "invalid"],
      })

      expect(schema.parse("2024-03-15 14:30")).toBe("2024-03-15 14:30")
      expect(() => schema.parse("2024-test-15 14:30")).toThrow("Must not contain test")
    })
  })

  describe("utility functions", () => {
    describe("validateDateTimeFormat", () => {
      it("should correctly validate datetime formats", () => {
        expect(validateDateTimeFormat("2024-03-15 14:30", "YYYY-MM-DD HH:mm")).toBe(true)
        expect(validateDateTimeFormat("2024-03-15 14:30:45", "YYYY-MM-DD HH:mm:ss")).toBe(true)
        expect(validateDateTimeFormat("15/03/2024 14:30", "DD/MM/YYYY HH:mm")).toBe(true)
        expect(validateDateTimeFormat("2024-03-15T14:30:45.000Z", "ISO")).toBe(true)
        expect(validateDateTimeFormat("1710508245", "UNIX")).toBe(true)

        // Invalid formats
        expect(validateDateTimeFormat("2024/03/15 14:30", "YYYY-MM-DD HH:mm")).toBe(false)
        expect(validateDateTimeFormat("invalid", "YYYY-MM-DD HH:mm")).toBe(false)
        expect(validateDateTimeFormat("2024-13-15 14:30", "YYYY-MM-DD HH:mm")).toBe(false)
      })
    })

    describe("parseDateTimeValue", () => {
      it("should parse different datetime formats correctly", () => {
        const result1 = parseDateTimeValue("2024-03-15 14:30", "YYYY-MM-DD HH:mm")
        expect(result1?.isValid()).toBe(true)
        expect(result1?.year()).toBe(2024)
        expect(result1?.month()).toBe(2) // 0-indexed
        expect(result1?.date()).toBe(15)
        expect(result1?.hour()).toBe(14)
        expect(result1?.minute()).toBe(30)

        const result2 = parseDateTimeValue("1710508245", "UNIX")
        expect(result2?.isValid()).toBe(true)

        const result3 = parseDateTimeValue("2024-03-15T14:30:45.000Z", "ISO")
        expect(result3?.isValid()).toBe(true)
      })

      it("should handle invalid datetimes", () => {
        expect(parseDateTimeValue("invalid", "YYYY-MM-DD HH:mm")).toBe(null)
        expect(parseDateTimeValue("2024-13-15 14:30", "YYYY-MM-DD HH:mm")).toBe(null)
      })

      it("should handle timezone", () => {
        const result = parseDateTimeValue("2024-03-15 14:30", "YYYY-MM-DD HH:mm", "Asia/Taipei")
        expect(result?.isValid()).toBe(true)
      })
    })

    describe("normalizeDateTimeValue", () => {
      it("should normalize datetime to specified format", () => {
        const result1 = normalizeDateTimeValue("2024-03-15 14:30", "YYYY-MM-DD HH:mm")
        expect(result1).toBe("2024-03-15 14:30")

        const result2 = normalizeDateTimeValue("15/03/2024 14:30", "DD/MM/YYYY HH:mm")
        expect(result2).toBe("15/03/2024 14:30")
      })

      it("should handle different format conversions", () => {
        // Note: These would need actual datetime parsing logic to work correctly
        const result = normalizeDateTimeValue("1710508245", "UNIX")
        expect(result).toBe("1710508245")
      })

      it("should handle invalid dates", () => {
        expect(normalizeDateTimeValue("invalid", "YYYY-MM-DD HH:mm")).toBe(null)
      })
    })
  })

  describe("i18n support", () => {
    it("should use English messages by default", () => {
      setLocale("en-US")
      expect(() => datetime(true).parse("")).toThrow("Required")
      expect(() => datetime(true).parse("invalid")).toThrow("Must be in YYYY-MM-DD HH:mm format")
    })

    it("should use Chinese messages when locale is zh-TW", () => {
      setLocale("zh-TW")
      const schema = datetime(true, { format: "YYYY-MM-DD HH:mm" })

      expect(() => schema.parse("")).toThrow("必填")
      expect(() => schema.parse("invalid")).toThrow("必須為 YYYY-MM-DD HH:mm 格式")
    })

    it("should support whitelist error messages", () => {
      setLocale("en-US")
      const schema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        whitelist: ["now"],
        whitelistOnly: true,
      })

      expect(() => schema.parse("2024-03-15 14:30")).toThrow("DateTime is not in the allowed list")
    })

    it("should support custom i18n messages", () => {
      const schema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        i18n: {
          "en-US": {
            required: "DateTime is required",
            invalid: "Invalid datetime value",
          },
          "zh-TW": {
            required: "請輸入日期時間",
            invalid: "無效的日期時間值",
          },
        },
      })

      setLocale("en-US")
      expect(() => schema.parse("")).toThrow("DateTime is required")

      setLocale("zh-TW")
      expect(() => schema.parse("")).toThrow("請輸入日期時間")
    })

    it("should support custom whitelist messages", () => {
      const schema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        whitelist: ["now"],
        whitelistOnly: true,
        i18n: {
          "en-US": {
            notInWhitelist: "This datetime is not allowed",
          },
          "zh-TW": {
            notInWhitelist: "此日期時間不被允許",
          },
        },
      })

      setLocale("en-US")
      expect(() => schema.parse("2024-03-15 14:30")).toThrow("This datetime is not allowed")

      setLocale("zh-TW")
      expect(() => schema.parse("2024-03-15 14:30")).toThrow("此日期時間不被允許")
    })
  })

  describe("real world datetime scenarios", () => {
    it("should validate business hours", () => {
      const businessHours = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        minHour: 9,
        maxHour: 17,
        weekdaysOnly: true,
        minuteStep: 30,
      })

      expect(businessHours.parse("2024-03-18 09:00")).toBe("2024-03-18 09:00") // Monday
      expect(businessHours.parse("2024-03-18 12:30")).toBe("2024-03-18 12:30")
      expect(businessHours.parse("2024-03-18 17:00")).toBe("2024-03-18 17:00")

      expect(() => businessHours.parse("2024-03-16 14:30")).toThrow("DateTime must be a weekday") // Saturday
    })

    it("should validate appointment slots", () => {
      const appointmentSlots = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        allowedHours: [9, 10, 11, 14, 15, 16],
        minuteStep: 30,
        weekdaysOnly: true,
      })

      expect(appointmentSlots.parse("2024-03-18 09:00")).toBe("2024-03-18 09:00")
      expect(appointmentSlots.parse("2024-03-18 15:30")).toBe("2024-03-18 15:30")

      expect(() => appointmentSlots.parse("2024-03-18 12:00")).toThrow("Hour must be between")
      expect(() => appointmentSlots.parse("2024-03-18 09:15")).toThrow("Minutes must be in 30-minute intervals")
    })

    it("should handle flexible datetime input", () => {
      const flexibleDateTime = datetime(false, { format: "YYYY-MM-DD HH:mm", whitelist: ["now", "tomorrow", "next week", "asap"] })

      expect(flexibleDateTime.parse("now")).toBe("now")
      expect(flexibleDateTime.parse("2024-03-15 14:30")).toBe("2024-03-15 14:30")
      expect(flexibleDateTime.parse("")).toBe(null)
      expect(() => flexibleDateTime.parse("invalid")).toThrow("Must be in YYYY-MM-DD HH:mm format")
    })
  })

  describe("edge cases", () => {
    it("should handle various input types", () => {
      const schema = datetime(true, { format: "UNIX" })

      expect(schema.parse("1710508245")).toBe("1710508245")
      expect(schema.parse(1710508245)).toBe("1710508245")
    })

    it("should handle empty and whitespace inputs", () => {
      const requiredSchema = datetime(true, { format: "YYYY-MM-DD HH:mm" })
      const optionalSchema = datetime(false, { format: "YYYY-MM-DD HH:mm" })

      expect(() => requiredSchema.parse("")).toThrow("Required")
      expect(() => requiredSchema.parse("   ")).toThrow("Required")

      expect(optionalSchema.parse("")).toBe(null)
      expect(optionalSchema.parse("   ")).toBe(null)
    })

    it("should preserve valid format after transformation", () => {
      const schema = datetime(true, {
        format: "YYYY-MM-DD HH:mm",
        transform: (val) => val.replace(/[^0-9:\-\s]/g, ""),
      })

      expect(schema.parse("2024abc-03def-15 14:30")).toBe("2024-03-15 14:30")
    })

    it("should work with complex whitelist scenarios", () => {
      const schema = datetime(false, { format: "YYYY-MM-DD HH:mm", whitelist: ["2024-03-15 14:30", "TBD", "flexible", ""], whitelistOnly: true })

      // Whitelist scenarios
      expect(schema.parse("2024-03-15 14:30")).toBe("2024-03-15 14:30")
      expect(schema.parse("TBD")).toBe("TBD")
      expect(schema.parse("flexible")).toBe("flexible")
      expect(schema.parse("")).toBe("")
      // Not in the whitelist
      expect(() => schema.parse("2024-03-15 15:30")).toThrow("DateTime is not in the allowed list")
      expect(() => schema.parse("other-value")).toThrow("DateTime is not in the allowed list")
    })

    it("should handle boundary cases for different formats", () => {
      const schema24 = datetime(true, { format: "YYYY-MM-DD HH:mm" })
      const schema12 = datetime(true, { format: "YYYY-MM-DD hh:mm A" })

      // Valid boundary cases
      expect(schema24.parse("2024-01-01 00:00")).toBe("2024-01-01 00:00")
      expect(schema24.parse("2024-12-31 23:59")).toBe("2024-12-31 23:59")
      expect(schema12.parse("2024-01-01 12:00 AM")).toBe("2024-01-01 12:00 AM")
      expect(schema12.parse("2024-12-31 11:59 PM")).toBe("2024-12-31 11:59 PM")

      // Invalid boundary cases
      expect(() => schema24.parse("2024-01-01 24:00")).toThrow("Must be in YYYY-MM-DD HH:mm format")
      expect(() => schema24.parse("2024-01-01 14:60")).toThrow("Must be in YYYY-MM-DD HH:mm format")
      expect(() => schema12.parse("2024-01-01 00:00 AM")).toThrow("Must be in YYYY-MM-DD hh:mm A format")
      expect(() => schema12.parse("2024-01-01 13:00 PM")).toThrow("Must be in YYYY-MM-DD hh:mm A format")
    })
  })
})
