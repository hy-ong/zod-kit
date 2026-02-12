import { describe, it, expect, beforeEach } from "vitest"
import { coordinate, setLocale, validateLatitude, validateLongitude } from "../../src"

describe("coordinate(true) validator", () => {
  beforeEach(() => setLocale("en-US"))

  describe("pair mode", () => {
    it("should validate correct coordinate pairs", () => {
      const schema = coordinate(true)

      expect(schema.parse("25.0330,121.5654")).toBe("25.0330,121.5654")
      expect(schema.parse("0,0")).toBe("0,0")
      expect(schema.parse("-90,180")).toBe("-90,180")
      expect(schema.parse("90,-180")).toBe("90,-180")
    })

    it("should validate pairs with spaces around comma", () => {
      const schema = coordinate(true)

      expect(schema.parse("25.0330, 121.5654")).toBe("25.0330, 121.5654")
      expect(schema.parse(" 25.0330 , 121.5654 ")).toBe("25.0330 , 121.5654")
    })

    it("should reject pairs with latitude out of range", () => {
      const schema = coordinate(true)

      expect(() => schema.parse("91,0")).toThrow("Latitude must be between -90 and 90")
      expect(() => schema.parse("-91,0")).toThrow("Latitude must be between -90 and 90")
      expect(() => schema.parse("100,200")).toThrow("Latitude must be between -90 and 90")
    })

    it("should reject pairs with longitude out of range", () => {
      const schema = coordinate(true)

      expect(() => schema.parse("0,181")).toThrow("Longitude must be between -180 and 180")
      expect(() => schema.parse("0,-181")).toThrow("Longitude must be between -180 and 180")
    })

    it("should reject non-numeric coordinate pairs", () => {
      const schema = coordinate(true)

      expect(() => schema.parse("abc,def")).toThrow("Invalid coordinate")
    })

    it("should reject pairs with wrong number of parts", () => {
      const schema = coordinate(true)

      expect(() => schema.parse("25.0330")).toThrow("Invalid coordinate")
      expect(() => schema.parse("25.0330,121.5654,0")).toThrow("Invalid coordinate")
    })
  })

  describe("latitude mode", () => {
    it("should validate correct latitudes", () => {
      const schema = coordinate(true, { type: "latitude" })

      expect(schema.parse("0")).toBe("0")
      expect(schema.parse("90")).toBe("90")
      expect(schema.parse("-90")).toBe("-90")
      expect(schema.parse("45.5")).toBe("45.5")
      expect(schema.parse("-45.123456")).toBe("-45.123456")
    })

    it("should reject latitudes out of range", () => {
      const schema = coordinate(true, { type: "latitude" })

      expect(() => schema.parse("91")).toThrow("Latitude must be between -90 and 90")
      expect(() => schema.parse("-91")).toThrow("Latitude must be between -90 and 90")
      expect(() => schema.parse("180")).toThrow("Latitude must be between -90 and 90")
    })

    it("should reject non-numeric latitude values", () => {
      const schema = coordinate(true, { type: "latitude" })

      expect(() => schema.parse("abc")).toThrow("Latitude must be between -90 and 90")
    })
  })

  describe("longitude mode", () => {
    it("should validate correct longitudes", () => {
      const schema = coordinate(true, { type: "longitude" })

      expect(schema.parse("0")).toBe("0")
      expect(schema.parse("180")).toBe("180")
      expect(schema.parse("-180")).toBe("-180")
      expect(schema.parse("121.5654")).toBe("121.5654")
      expect(schema.parse("-73.9857")).toBe("-73.9857")
    })

    it("should reject longitudes out of range", () => {
      const schema = coordinate(true, { type: "longitude" })

      expect(() => schema.parse("181")).toThrow("Longitude must be between -180 and 180")
      expect(() => schema.parse("-181")).toThrow("Longitude must be between -180 and 180")
      expect(() => schema.parse("360")).toThrow("Longitude must be between -180 and 180")
    })

    it("should reject non-numeric longitude values", () => {
      const schema = coordinate(true, { type: "longitude" })

      expect(() => schema.parse("abc")).toThrow("Longitude must be between -180 and 180")
    })
  })

  describe("precision", () => {
    it("should accept values within precision limit for pair mode", () => {
      const schema = coordinate(true, { precision: 4 })

      expect(schema.parse("25.0330,121.5654")).toBe("25.0330,121.5654")
      expect(schema.parse("25.03,121.56")).toBe("25.03,121.56")
      expect(schema.parse("25,121")).toBe("25,121")
    })

    it("should reject values exceeding precision limit for pair mode", () => {
      const schema = coordinate(true, { precision: 2 })

      expect(() => schema.parse("25.033,121.565")).toThrow("Invalid coordinate")
    })

    it("should enforce precision in latitude mode", () => {
      const schema = coordinate(true, { type: "latitude", precision: 2 })

      expect(schema.parse("45.12")).toBe("45.12")
      expect(schema.parse("45")).toBe("45")
      expect(() => schema.parse("45.123")).toThrow("Invalid coordinate")
    })

    it("should enforce precision in longitude mode", () => {
      const schema = coordinate(true, { type: "longitude", precision: 3 })

      expect(schema.parse("121.565")).toBe("121.565")
      expect(schema.parse("121")).toBe("121")
      expect(() => schema.parse("121.5654")).toThrow("Invalid coordinate")
    })
  })

  describe("required/optional behavior", () => {
    it("should require a value when required=true", () => {
      const schema = coordinate(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse(null)).toThrow()
      expect(() => schema.parse(undefined)).toThrow()
    })

    it("should allow empty values when required=false", () => {
      const schema = coordinate(false)

      expect(schema.parse("")).toBe(null)
      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
    })

    it("should still validate when optional and a value is provided", () => {
      const schema = coordinate(false)

      expect(schema.parse("25.0330,121.5654")).toBe("25.0330,121.5654")
      expect(() => schema.parse("100,200")).toThrow("Latitude must be between -90 and 90")
    })

    it("should use default values for required schema", () => {
      const schema = coordinate(true, { defaultValue: "0,0" })

      expect(schema.parse("")).toBe("0,0")
    })

    it("should use default values for optional schema", () => {
      const schema = coordinate(false, { defaultValue: "0,0" })

      expect(schema.parse("")).toBe("0,0")
      expect(schema.parse(null)).toBe("0,0")
    })
  })

  describe("transform function", () => {
    it("should apply custom transform before validation", () => {
      const schema = coordinate(true, {
        transform: (val) => val.replace(/\s+/g, ""),
      })

      expect(schema.parse("25.0330 , 121.5654")).toBe("25.0330,121.5654")
    })

    it("should apply transform that normalizes separators", () => {
      const schema = coordinate(true, {
        transform: (val) => val.replace(";", ","),
      })

      expect(schema.parse("25.0330;121.5654")).toBe("25.0330,121.5654")
    })
  })

  describe("i18n support", () => {
    it("should use English messages by default", () => {
      setLocale("en-US")
      const schema = coordinate(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("abc,def")).toThrow("Invalid coordinate")
      expect(() => schema.parse("91,0")).toThrow("Latitude must be between -90 and 90")
      expect(() => schema.parse("0,181")).toThrow("Longitude must be between -180 and 180")
    })

    it("should use Chinese messages when locale is zh-TW", () => {
      setLocale("zh-TW")
      const schema = coordinate(true)

      expect(() => schema.parse("")).toThrow("必填")
      expect(() => schema.parse("abc,def")).toThrow("無效的座標")
      expect(() => schema.parse("91,0")).toThrow("緯度必須介於 -90 與 90 之間")
      expect(() => schema.parse("0,181")).toThrow("經度必須介於 -180 與 180 之間")
    })

    it("should support custom i18n messages", () => {
      const schema = coordinate(true, {
        i18n: {
          "en-US": {
            required: "Coordinate is required",
            invalid: "Coordinate is invalid",
            invalidLatitude: "Bad latitude",
            invalidLongitude: "Bad longitude",
          },
          "zh-TW": {
            required: "請輸入座標",
            invalid: "座標格式錯誤",
            invalidLatitude: "緯度錯誤",
            invalidLongitude: "經度錯誤",
          },
        },
      })

      setLocale("en-US")
      expect(() => schema.parse("")).toThrow("Coordinate is required")
      expect(() => schema.parse("abc,def")).toThrow("Coordinate is invalid")
      expect(() => schema.parse("91,0")).toThrow("Bad latitude")
      expect(() => schema.parse("0,181")).toThrow("Bad longitude")

      setLocale("zh-TW")
      expect(() => schema.parse("")).toThrow("請輸入座標")
      expect(() => schema.parse("abc,def")).toThrow("座標格式錯誤")
      expect(() => schema.parse("91,0")).toThrow("緯度錯誤")
      expect(() => schema.parse("0,181")).toThrow("經度錯誤")
    })
  })

  describe("utility functions", () => {
    it("validateLatitude should accept valid latitudes", () => {
      expect(validateLatitude(0)).toBe(true)
      expect(validateLatitude(90)).toBe(true)
      expect(validateLatitude(-90)).toBe(true)
      expect(validateLatitude(45.5)).toBe(true)
      expect(validateLatitude(-45.123456)).toBe(true)
    })

    it("validateLatitude should reject invalid latitudes", () => {
      expect(validateLatitude(91)).toBe(false)
      expect(validateLatitude(-91)).toBe(false)
      expect(validateLatitude(180)).toBe(false)
      expect(validateLatitude(NaN)).toBe(false)
      expect(validateLatitude(Infinity)).toBe(false)
      expect(validateLatitude(-Infinity)).toBe(false)
    })

    it("validateLongitude should accept valid longitudes", () => {
      expect(validateLongitude(0)).toBe(true)
      expect(validateLongitude(180)).toBe(true)
      expect(validateLongitude(-180)).toBe(true)
      expect(validateLongitude(121.5654)).toBe(true)
      expect(validateLongitude(-73.9857)).toBe(true)
    })

    it("validateLongitude should reject invalid longitudes", () => {
      expect(validateLongitude(181)).toBe(false)
      expect(validateLongitude(-181)).toBe(false)
      expect(validateLongitude(360)).toBe(false)
      expect(validateLongitude(NaN)).toBe(false)
      expect(validateLongitude(Infinity)).toBe(false)
      expect(validateLongitude(-Infinity)).toBe(false)
    })
  })

  describe("edge cases", () => {
    it("should handle NaN inputs", () => {
      const schema = coordinate(true)

      expect(() => schema.parse("NaN,NaN")).toThrow("Invalid coordinate")
      expect(() => schema.parse(NaN)).toThrow()
    })

    it("should handle empty and whitespace-only inputs", () => {
      const schema = coordinate(true)
      const optionalSchema = coordinate(false)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("   ")).toThrow("Required")
      expect(() => schema.parse("\t\n")).toThrow("Required")

      expect(optionalSchema.parse("")).toBe(null)
      expect(optionalSchema.parse("   ")).toBe(null)
      expect(optionalSchema.parse("\t\n")).toBe(null)
    })

    it("should handle boundary values for latitude", () => {
      const latSchema = coordinate(true, { type: "latitude" })

      expect(latSchema.parse("90")).toBe("90")
      expect(latSchema.parse("-90")).toBe("-90")
      expect(latSchema.parse("0")).toBe("0")
      expect(() => latSchema.parse("90.0001")).toThrow("Latitude must be between -90 and 90")
      expect(() => latSchema.parse("-90.0001")).toThrow("Latitude must be between -90 and 90")
    })

    it("should handle boundary values for longitude", () => {
      const lngSchema = coordinate(true, { type: "longitude" })

      expect(lngSchema.parse("180")).toBe("180")
      expect(lngSchema.parse("-180")).toBe("-180")
      expect(lngSchema.parse("0")).toBe("0")
      expect(() => lngSchema.parse("180.0001")).toThrow("Longitude must be between -180 and 180")
      expect(() => lngSchema.parse("-180.0001")).toThrow("Longitude must be between -180 and 180")
    })

    it("should handle boundary values for coordinate pairs", () => {
      const schema = coordinate(true)

      expect(schema.parse("90,180")).toBe("90,180")
      expect(schema.parse("-90,-180")).toBe("-90,-180")
      expect(schema.parse("90,-180")).toBe("90,-180")
      expect(schema.parse("-90,180")).toBe("-90,180")
    })

    it("should handle numeric input via string coercion", () => {
      const schema = coordinate(true, { type: "latitude" })

      expect(schema.parse(45)).toBe("45")
    })

    it("should handle 'null' and 'undefined' string values when required", () => {
      const schema = coordinate(true)

      expect(() => schema.parse("null")).toThrow("Required")
      expect(() => schema.parse("undefined")).toThrow("Required")
    })
  })
})
