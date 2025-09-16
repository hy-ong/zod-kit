import { describe, it, expect } from "vitest"
import { setLocale, date } from "../../src"

describe("date", () => {
  describe("required (default)", () => {
    it("should validate valid date string", () => {
      const schema = date()
      expect(schema.parse("2023-12-25")).toBe("2023-12-25")
    })

    it("should reject empty string", () => {
      const schema = date()
      expect(() => schema.parse("")).toThrow()
    })

    it("should reject null", () => {
      const schema = date()
      expect(() => schema.parse(null)).toThrow()
    })

    it("should reject undefined", () => {
      const schema = date()
      expect(() => schema.parse(undefined)).toThrow()
    })

    it("should reject invalid date format", () => {
      const schema = date()
      expect(() => schema.parse("invalid-date")).toThrow()
    })

    it("should reject date with wrong format", () => {
      const schema = date()
      expect(() => schema.parse("25/12/2023")).toThrow()
    })
  })

  describe("optional", () => {
    it("should allow null when not required", () => {
      const schema = date({ required: false })
      expect(schema.parse(null)).toBe(null)
    })

    it("should allow empty string when not required", () => {
      const schema = date({ required: false })
      expect(schema.parse("")).toBe(null)
    })

    it("should allow undefined when not required", () => {
      const schema = date({ required: false })
      expect(schema.parse(undefined)).toBe(null)
    })

    it("should validate valid date when not required", () => {
      const schema = date({ required: false })
      expect(schema.parse("2023-12-25")).toBe("2023-12-25")
    })
  })

  describe("custom format", () => {
    it("should validate date with DD/MM/YYYY format", () => {
      const schema = date({ format: "DD/MM/YYYY" })
      expect(schema.parse("25/12/2023")).toBe("25/12/2023")
    })

    it("should reject wrong format for custom format", () => {
      const schema = date({ format: "DD/MM/YYYY" })
      expect(() => schema.parse("2023-12-25")).toThrow()
    })

    it("should validate date with MM-DD-YYYY format", () => {
      const schema = date({ format: "MM-DD-YYYY" })
      expect(schema.parse("12-25-2023")).toBe("12-25-2023")
    })

    it("should validate date with YYYY/MM/DD format", () => {
      const schema = date({ format: "YYYY/MM/DD" })
      expect(schema.parse("2023/12/25")).toBe("2023/12/25")
    })
  })

  describe("min validation", () => {
    it("should accept date equal to min", () => {
      const schema = date({ min: "2023-01-01" })
      expect(schema.parse("2023-01-01")).toBe("2023-01-01")
    })

    it("should accept date after min", () => {
      const schema = date({ min: "2023-01-01" })
      expect(schema.parse("2023-12-31")).toBe("2023-12-31")
    })

    it("should reject date before min", () => {
      const schema = date({ min: "2023-01-01" })
      expect(() => schema.parse("2022-12-31")).toThrow()
    })
  })

  describe("max validation", () => {
    it("should accept date equal to max", () => {
      const schema = date({ max: "2023-12-31" })
      expect(schema.parse("2023-12-31")).toBe("2023-12-31")
    })

    it("should accept date before max", () => {
      const schema = date({ max: "2023-12-31" })
      expect(schema.parse("2023-01-01")).toBe("2023-01-01")
    })

    it("should reject date after max", () => {
      const schema = date({ max: "2023-12-31" })
      expect(() => schema.parse("2024-01-01")).toThrow()
    })
  })

  describe("min and max validation", () => {
    it("should accept date within range", () => {
      const schema = date({ min: "2023-01-01", max: "2023-12-31" })
      expect(schema.parse("2023-06-15")).toBe("2023-06-15")
    })

    it("should reject date before min in range", () => {
      const schema = date({ min: "2023-01-01", max: "2023-12-31" })
      expect(() => schema.parse("2022-12-31")).toThrow()
    })

    it("should reject date after max in range", () => {
      const schema = date({ min: "2023-01-01", max: "2023-12-31" })
      expect(() => schema.parse("2024-01-01")).toThrow()
    })
  })

  describe("includes validation", () => {
    it("should accept date containing required substring", () => {
      const schema = date({ includes: "2023" })
      expect(schema.parse("2023-12-25")).toBe("2023-12-25")
    })

    it("should reject date not containing required substring", () => {
      const schema = date({ includes: "2023" })
      expect(() => schema.parse("2022-12-25")).toThrow()
    })
  })

  describe("default value", () => {
    it("should use default value when input is empty", () => {
      const schema = date({ defaultValue: "2023-01-01" })
      expect(schema.parse("")).toBe("2023-01-01")
      expect(schema.parse(null)).toBe("2023-01-01")
      expect(schema.parse(undefined)).toBe("2023-01-01")
    })

    it("should use default value when optional and input is empty", () => {
      const schema = date({ required: false, defaultValue: "2023-01-01" })
      expect(schema.parse("")).toBe("2023-01-01")
      expect(schema.parse(null)).toBe("2023-01-01")
      expect(schema.parse(undefined)).toBe("2023-01-01")
    })
  })

  describe("localization", () => {
    it("should use English error messages", () => {
      setLocale("en")
      const schema = date()

      try {
        schema.parse("invalid")
      } catch (error: any) {
        expect(error.issues[0].message).toContain("YYYY-MM-DD")
      }
    })

    it("should use Chinese error messages", () => {
      setLocale("zh-TW")
      const schema = date()

      try {
        schema.parse("invalid")
      } catch (error: any) {
        expect(error.issues[0].message).toContain("必須為 YYYY-MM-DD 格式")
      }
    })
  })

  describe("excludes validation", () => {
    it("should accept date not containing excluded substring", () => {
      const schema = date({ excludes: "2022" })
      expect(schema.parse("2023-12-25")).toBe("2023-12-25")
    })

    it("should reject date containing excluded substring", () => {
      const schema = date({ excludes: "2022" })
      expect(() => schema.parse("2022-12-25")).toThrow()
    })

    it("should handle multiple excluded substrings as array", () => {
      const schema = date({ excludes: ["2022", "01"] })
      expect(schema.parse("2023-12-25")).toBe("2023-12-25")
      expect(() => schema.parse("2022-12-25")).toThrow()
      expect(() => schema.parse("2023-01-25")).toThrow()
    })
  })

  describe("time-based validations", () => {
    // Use local dates to avoid timezone issues
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Format dates in local timezone
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const todayStr = formatLocalDate(today)
    const yesterdayStr = formatLocalDate(yesterday)
    const tomorrowStr = formatLocalDate(tomorrow)

    describe("mustBePast", () => {
      it("should accept past date", () => {
        const schema = date({ mustBePast: true })
        expect(schema.parse(yesterdayStr)).toBe(yesterdayStr)
      })

      it("should reject today when mustBePast", () => {
        const schema = date({ mustBePast: true })
        expect(() => schema.parse(todayStr)).toThrow()
      })

      it("should reject future date", () => {
        const schema = date({ mustBePast: true })
        expect(() => schema.parse(tomorrowStr)).toThrow()
      })
    })

    describe("mustBeFuture", () => {
      it("should accept future date", () => {
        const schema = date({ mustBeFuture: true })
        expect(schema.parse(tomorrowStr)).toBe(tomorrowStr)
      })

      it("should reject today when mustBeFuture", () => {
        const schema = date({ mustBeFuture: true })
        expect(() => schema.parse(todayStr)).toThrow()
      })

      it("should reject past date", () => {
        const schema = date({ mustBeFuture: true })
        expect(() => schema.parse(yesterdayStr)).toThrow()
      })
    })

    describe("mustBeToday", () => {
      it("should accept today", () => {
        const schema = date({ mustBeToday: true })
        expect(schema.parse(todayStr)).toBe(todayStr)
      })

      it("should reject past date", () => {
        const schema = date({ mustBeToday: true })
        expect(() => schema.parse(yesterdayStr)).toThrow()
      })

      it("should reject future date", () => {
        const schema = date({ mustBeToday: true })
        expect(() => schema.parse(tomorrowStr)).toThrow()
      })
    })

    describe("mustNotBeToday", () => {
      it("should accept past date", () => {
        const schema = date({ mustNotBeToday: true })
        expect(schema.parse(yesterdayStr)).toBe(yesterdayStr)
      })

      it("should accept future date", () => {
        const schema = date({ mustNotBeToday: true })
        expect(schema.parse(tomorrowStr)).toBe(tomorrowStr)
      })

      it("should reject today", () => {
        const schema = date({ mustNotBeToday: true })
        expect(() => schema.parse(todayStr)).toThrow()
      })
    })
  })

  describe("weekday/weekend validations", () => {
    describe("weekdaysOnly", () => {
      it("should accept Monday (weekday)", () => {
        const schema = date({ weekdaysOnly: true })
        expect(schema.parse("2023-12-25")).toBe("2023-12-25") // Monday
      })

      it("should accept Friday (weekday)", () => {
        const schema = date({ weekdaysOnly: true })
        expect(schema.parse("2023-12-29")).toBe("2023-12-29") // Friday
      })

      it("should reject Saturday (weekend)", () => {
        const schema = date({ weekdaysOnly: true })
        expect(() => schema.parse("2023-12-30")).toThrow() // Saturday
      })

      it("should reject Sunday (weekend)", () => {
        const schema = date({ weekdaysOnly: true })
        expect(() => schema.parse("2023-12-31")).toThrow() // Sunday
      })
    })

    describe("weekendsOnly", () => {
      it("should accept Saturday (weekend)", () => {
        const schema = date({ weekendsOnly: true })
        expect(schema.parse("2023-12-30")).toBe("2023-12-30") // Saturday
      })

      it("should accept Sunday (weekend)", () => {
        const schema = date({ weekendsOnly: true })
        expect(schema.parse("2023-12-31")).toBe("2023-12-31") // Sunday
      })

      it("should reject Monday (weekday)", () => {
        const schema = date({ weekendsOnly: true })
        expect(() => schema.parse("2023-12-25")).toThrow() // Monday
      })

      it("should reject Friday (weekday)", () => {
        const schema = date({ weekendsOnly: true })
        expect(() => schema.parse("2023-12-29")).toThrow() // Friday
      })
    })
  })

  describe("transform function", () => {
    it("should apply custom transform function", () => {
      const schema = date({
        format: "YYYY/MM/DD",
        transform: (val) => val.replace(/-/g, "/"),
      })
      expect(schema.parse("2023-12-25")).toBe("2023/12/25")
    })

    it("should apply transform before validation", () => {
      const schema = date({
        format: "YYYY/MM/DD",
        transform: (val) => val.replace(/-/g, "/"),
      })
      expect(schema.parse("2023-12-25")).toBe("2023/12/25")
    })

    it("should work with other validations after transform", () => {
      const schema = date({
        format: "YYYY/MM/DD",
        includes: "/",
        transform: (val) => val.replace(/-/g, "/"),
      })
      expect(schema.parse("2023-12-25")).toBe("2023/12/25")
    })
  })

  describe("i18n custom messages", () => {
    it("should use custom English messages", () => {
      const schema = date({
        i18n: {
          en: { format: "Custom date format error: ${format}" },
          "zh-TW": { format: "自定義日期格式錯誤: ${format}" },
        },
      })

      setLocale("en")
      try {
        schema.parse("invalid")
      } catch (error: any) {
        expect(error.issues[0].message).toBe("Custom date format error: YYYY-MM-DD")
      }
    })

    it("should use custom Chinese messages", () => {
      const schema = date({
        i18n: {
          en: { format: "Custom date format error: ${format}" },
          "zh-TW": { format: "自定義日期格式錯誤: ${format}" },
        },
      })

      setLocale("zh-TW")
      try {
        schema.parse("invalid")
      } catch (error: any) {
        expect(error.issues[0].message).toBe("自定義日期格式錯誤: YYYY-MM-DD")
      }
    })

    it("should fallback to default messages when custom not provided", () => {
      const schema = date({
        i18n: {
          en: { format: "Custom format error" },
          "zh-TW": { format: "自定義格式錯誤" },
        },
      })

      setLocale("en")
      try {
        schema.parse("")
      } catch (error: any) {
        expect(error.issues[0].message).toBe("Required") // Default message
      }
    })

    it("should handle past validation with custom message", () => {
      const schema = date({
        mustBePast: true,
        i18n: {
          en: { past: "Date must be in the past!" },
          "zh-TW": { past: "日期必須在過去！" },
        },
      })

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split("T")[0]

      setLocale("en")
      try {
        schema.parse(tomorrowStr)
      } catch (error: any) {
        expect(error.issues[0].message).toBe("Date must be in the past!")
      }
    })
  })

  describe("edge cases", () => {
    it("should handle leap year dates", () => {
      const schema = date()
      expect(schema.parse("2024-02-29")).toBe("2024-02-29")
    })

    it("should reject invalid leap year date", () => {
      const schema = date()
      expect(() => schema.parse("2023-02-29")).toThrow()
    })

    it("should handle end of month dates", () => {
      const schema = date()
      expect(schema.parse("2023-01-31")).toBe("2023-01-31")
      expect(schema.parse("2023-04-30")).toBe("2023-04-30")
    })

    it("should reject invalid end of month dates", () => {
      const schema = date()
      expect(() => schema.parse("2023-04-31")).toThrow()
    })
  })
})
