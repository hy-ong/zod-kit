import { describe, it, expect, beforeEach } from "vitest"
import { color, setLocale } from "../../src"

describe("color(true) validator", () => {
  beforeEach(() => setLocale("en-US"))

  describe("hex validation", () => {
    it("should accept valid 3-digit hex (#RGB)", () => {
      const schema = color(true)

      expect(schema.parse("#fff")).toBe("#fff")
      expect(schema.parse("#FFF")).toBe("#FFF")
      expect(schema.parse("#000")).toBe("#000")
      expect(schema.parse("#abc")).toBe("#abc")
      expect(schema.parse("#ABC")).toBe("#ABC")
      expect(schema.parse("#f0f")).toBe("#f0f")
    })

    it("should accept valid 6-digit hex (#RRGGBB)", () => {
      const schema = color(true)

      expect(schema.parse("#ff0000")).toBe("#ff0000")
      expect(schema.parse("#FF0000")).toBe("#FF0000")
      expect(schema.parse("#00ff00")).toBe("#00ff00")
      expect(schema.parse("#0000ff")).toBe("#0000ff")
      expect(schema.parse("#ffffff")).toBe("#ffffff")
      expect(schema.parse("#000000")).toBe("#000000")
      expect(schema.parse("#abcdef")).toBe("#abcdef")
      expect(schema.parse("#ABCDEF")).toBe("#ABCDEF")
    })

    it("should accept valid 8-digit hex with alpha (#RRGGBBAA) when allowAlpha is true", () => {
      const schema = color(true, { allowAlpha: true })

      expect(schema.parse("#FF0000AA")).toBe("#FF0000AA")
      expect(schema.parse("#ff000080")).toBe("#ff000080")
      expect(schema.parse("#00000000")).toBe("#00000000")
      expect(schema.parse("#ffffffff")).toBe("#ffffffff")
    })

    it("should reject 8-digit hex when allowAlpha is false", () => {
      const schema = color(true, { allowAlpha: false })

      expect(() => schema.parse("#FF0000AA")).toThrow("Invalid color format")
      expect(() => schema.parse("#ff000080")).toThrow("Invalid color format")
    })

    it("should reject invalid hex values", () => {
      const schema = color(true)

      expect(() => schema.parse("#gg0000")).toThrow("Invalid color format")
      expect(() => schema.parse("#12345")).toThrow("Invalid color format")
      expect(() => schema.parse("#1")).toThrow("Invalid color format")
      expect(() => schema.parse("#")).toThrow("Invalid color format")
      expect(() => schema.parse("#12")).toThrow("Invalid color format")
      expect(() => schema.parse("#1234")).toThrow("Invalid color format")
      expect(() => schema.parse("#1234567")).toThrow("Invalid color format")
      expect(() => schema.parse("#123456789")).toThrow("Invalid color format")
      expect(() => schema.parse("fff")).toThrow("Invalid color format")
      expect(() => schema.parse("ff0000")).toThrow("Invalid color format")
    })
  })

  describe("rgb validation", () => {
    it("should accept valid rgb() values", () => {
      const schema = color(true)

      expect(schema.parse("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)")
      expect(schema.parse("rgb(0, 255, 0)")).toBe("rgb(0, 255, 0)")
      expect(schema.parse("rgb(0, 0, 255)")).toBe("rgb(0, 0, 255)")
      expect(schema.parse("rgb(0, 0, 0)")).toBe("rgb(0, 0, 0)")
      expect(schema.parse("rgb(255, 255, 255)")).toBe("rgb(255, 255, 255)")
      expect(schema.parse("rgb(128, 128, 128)")).toBe("rgb(128, 128, 128)")
    })

    it("should accept valid rgba() values when allowAlpha is true", () => {
      const schema = color(true, { allowAlpha: true })

      expect(schema.parse("rgba(255, 0, 0, 0.5)")).toBe("rgba(255, 0, 0, 0.5)")
      expect(schema.parse("rgba(0, 0, 0, 0)")).toBe("rgba(0, 0, 0, 0)")
      expect(schema.parse("rgba(255, 255, 255, 1)")).toBe("rgba(255, 255, 255, 1)")
      expect(schema.parse("rgba(128, 128, 128, 0.75)")).toBe("rgba(128, 128, 128, 0.75)")
    })

    it("should reject rgba() values when allowAlpha is false", () => {
      const schema = color(true, { allowAlpha: false })

      expect(() => schema.parse("rgba(255, 0, 0, 0.5)")).toThrow("Invalid color format")
      expect(() => schema.parse("rgba(0, 0, 0, 0)")).toThrow("Invalid color format")
    })

    it("should reject out-of-range rgb values", () => {
      const schema = color(true)

      expect(() => schema.parse("rgb(256, 0, 0)")).toThrow("Invalid color format")
      expect(() => schema.parse("rgb(-1, 0, 0)")).toThrow("Invalid color format")
      expect(() => schema.parse("rgb(0, 256, 0)")).toThrow("Invalid color format")
      expect(() => schema.parse("rgb(0, 0, 256)")).toThrow("Invalid color format")
      expect(() => schema.parse("rgb(0, -1, 0)")).toThrow("Invalid color format")
      expect(() => schema.parse("rgb(0, 0, -1)")).toThrow("Invalid color format")
    })

    it("should reject rgba with out-of-range alpha", () => {
      const schema = color(true, { allowAlpha: true })

      expect(() => schema.parse("rgba(255, 0, 0, 1.1)")).toThrow("Invalid color format")
      expect(() => schema.parse("rgba(255, 0, 0, -0.1)")).toThrow("Invalid color format")
      expect(() => schema.parse("rgba(255, 0, 0, 2)")).toThrow("Invalid color format")
    })

    it("should reject rgb with decimal channel values", () => {
      const schema = color(true)

      expect(() => schema.parse("rgb(255.5, 0, 0)")).toThrow("Invalid color format")
      expect(() => schema.parse("rgb(0, 128.3, 0)")).toThrow("Invalid color format")
    })

    it("should reject rgb with alpha and rgba without alpha", () => {
      const schema = color(true, { allowAlpha: true })

      // rgb() should not have alpha
      expect(() => schema.parse("rgb(255, 0, 0, 0.5)")).toThrow("Invalid color format")
      // rgba() must have alpha
      expect(() => schema.parse("rgba(255, 0, 0)")).toThrow("Invalid color format")
    })

    it("should reject malformed rgb strings", () => {
      const schema = color(true)

      expect(() => schema.parse("rgb(255, 0)")).toThrow("Invalid color format")
      expect(() => schema.parse("rgb(255)")).toThrow("Invalid color format")
      expect(() => schema.parse("rgb()")).toThrow("Invalid color format")
      expect(() => schema.parse("rgb(a, b, c)")).toThrow("Invalid color format")
    })
  })

  describe("hsl validation", () => {
    it("should accept valid hsl() values", () => {
      const schema = color(true)

      expect(schema.parse("hsl(360, 100%, 50%)")).toBe("hsl(360, 100%, 50%)")
      expect(schema.parse("hsl(0, 0%, 0%)")).toBe("hsl(0, 0%, 0%)")
      expect(schema.parse("hsl(180, 50%, 50%)")).toBe("hsl(180, 50%, 50%)")
      expect(schema.parse("hsl(120, 100%, 25%)")).toBe("hsl(120, 100%, 25%)")
      expect(schema.parse("hsl(240, 75%, 60%)")).toBe("hsl(240, 75%, 60%)")
    })

    it("should accept valid hsla() values when allowAlpha is true", () => {
      const schema = color(true, { allowAlpha: true })

      expect(schema.parse("hsla(180, 50%, 50%, 0.5)")).toBe("hsla(180, 50%, 50%, 0.5)")
      expect(schema.parse("hsla(0, 0%, 0%, 0)")).toBe("hsla(0, 0%, 0%, 0)")
      expect(schema.parse("hsla(360, 100%, 100%, 1)")).toBe("hsla(360, 100%, 100%, 1)")
      expect(schema.parse("hsla(90, 25%, 75%, 0.3)")).toBe("hsla(90, 25%, 75%, 0.3)")
    })

    it("should reject hsla() values when allowAlpha is false", () => {
      const schema = color(true, { allowAlpha: false })

      expect(() => schema.parse("hsla(180, 50%, 50%, 0.5)")).toThrow("Invalid color format")
      expect(() => schema.parse("hsla(0, 0%, 0%, 0)")).toThrow("Invalid color format")
    })

    it("should reject out-of-range hsl values", () => {
      const schema = color(true)

      expect(() => schema.parse("hsl(361, 100%, 50%)")).toThrow("Invalid color format")
      expect(() => schema.parse("hsl(-1, 100%, 50%)")).toThrow("Invalid color format")
      expect(() => schema.parse("hsl(0, 101%, 50%)")).toThrow("Invalid color format")
      expect(() => schema.parse("hsl(0, -1%, 50%)")).toThrow("Invalid color format")
      expect(() => schema.parse("hsl(0, 100%, 101%)")).toThrow("Invalid color format")
      expect(() => schema.parse("hsl(0, 100%, -1%)")).toThrow("Invalid color format")
    })

    it("should reject hsla with out-of-range alpha", () => {
      const schema = color(true, { allowAlpha: true })

      expect(() => schema.parse("hsla(180, 50%, 50%, 1.1)")).toThrow("Invalid color format")
      expect(() => schema.parse("hsla(180, 50%, 50%, -0.1)")).toThrow("Invalid color format")
      expect(() => schema.parse("hsla(180, 50%, 50%, 2)")).toThrow("Invalid color format")
    })

    it("should reject hsl with alpha and hsla without alpha", () => {
      const schema = color(true, { allowAlpha: true })

      // hsl() should not have alpha
      expect(() => schema.parse("hsl(180, 50%, 50%, 0.5)")).toThrow("Invalid color format")
      // hsla() must have alpha
      expect(() => schema.parse("hsla(180, 50%, 50%)")).toThrow("Invalid color format")
    })

    it("should reject malformed hsl strings", () => {
      const schema = color(true)

      expect(() => schema.parse("hsl(360, 100%)")).toThrow("Invalid color format")
      expect(() => schema.parse("hsl(360)")).toThrow("Invalid color format")
      expect(() => schema.parse("hsl()")).toThrow("Invalid color format")
      expect(() => schema.parse("hsl(a, b%, c%)")).toThrow("Invalid color format")
    })
  })

  describe("format filtering", () => {
    it("should only accept hex when format is 'hex'", () => {
      const schema = color(true, { format: "hex" })

      expect(schema.parse("#ff0000")).toBe("#ff0000")
      expect(schema.parse("#fff")).toBe("#fff")
      expect(() => schema.parse("rgb(255, 0, 0)")).toThrow("Must be a valid hex color")
      expect(() => schema.parse("hsl(0, 100%, 50%)")).toThrow("Must be a valid hex color")
    })

    it("should only accept rgb when format is 'rgb'", () => {
      const schema = color(true, { format: "rgb" })

      expect(schema.parse("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)")
      expect(() => schema.parse("#ff0000")).toThrow("Must be a valid RGB color")
      expect(() => schema.parse("hsl(0, 100%, 50%)")).toThrow("Must be a valid RGB color")
    })

    it("should only accept hsl when format is 'hsl'", () => {
      const schema = color(true, { format: "hsl" })

      expect(schema.parse("hsl(0, 100%, 50%)")).toBe("hsl(0, 100%, 50%)")
      expect(() => schema.parse("#ff0000")).toThrow("Must be a valid HSL color")
      expect(() => schema.parse("rgb(255, 0, 0)")).toThrow("Must be a valid HSL color")
    })

    it("should accept multiple formats when format is an array", () => {
      const schema = color(true, { format: ["hex", "rgb"] })

      expect(schema.parse("#ff0000")).toBe("#ff0000")
      expect(schema.parse("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)")
      expect(() => schema.parse("hsl(0, 100%, 50%)")).toThrow("Invalid color format")
    })

    it("should accept all formats when format is 'any' (default)", () => {
      const schema = color(true)

      expect(schema.parse("#ff0000")).toBe("#ff0000")
      expect(schema.parse("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)")
      expect(schema.parse("hsl(0, 100%, 50%)")).toBe("hsl(0, 100%, 50%)")
    })

    it("should accept hex and hsl when format is ['hex', 'hsl']", () => {
      const schema = color(true, { format: ["hex", "hsl"] })

      expect(schema.parse("#ff0000")).toBe("#ff0000")
      expect(schema.parse("hsl(0, 100%, 50%)")).toBe("hsl(0, 100%, 50%)")
      expect(() => schema.parse("rgb(255, 0, 0)")).toThrow("Invalid color format")
    })

    it("should accept rgb and hsl when format is ['rgb', 'hsl']", () => {
      const schema = color(true, { format: ["rgb", "hsl"] })

      expect(schema.parse("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)")
      expect(schema.parse("hsl(0, 100%, 50%)")).toBe("hsl(0, 100%, 50%)")
      expect(() => schema.parse("#ff0000")).toThrow("Invalid color format")
    })
  })

  describe("alpha channel", () => {
    it("should allow alpha by default (allowAlpha defaults to true)", () => {
      const schema = color(true)

      expect(schema.parse("#FF0000AA")).toBe("#FF0000AA")
      expect(schema.parse("rgba(255, 0, 0, 0.5)")).toBe("rgba(255, 0, 0, 0.5)")
      expect(schema.parse("hsla(180, 50%, 50%, 0.5)")).toBe("hsla(180, 50%, 50%, 0.5)")
    })

    it("should reject alpha when allowAlpha is false", () => {
      const schema = color(true, { allowAlpha: false })

      expect(() => schema.parse("#FF0000AA")).toThrow("Invalid color format")
      expect(() => schema.parse("rgba(255, 0, 0, 0.5)")).toThrow("Invalid color format")
      expect(() => schema.parse("hsla(180, 50%, 50%, 0.5)")).toThrow("Invalid color format")
    })

    it("should still accept non-alpha colors when allowAlpha is false", () => {
      const schema = color(true, { allowAlpha: false })

      expect(schema.parse("#ff0000")).toBe("#ff0000")
      expect(schema.parse("#fff")).toBe("#fff")
      expect(schema.parse("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)")
      expect(schema.parse("hsl(180, 50%, 50%)")).toBe("hsl(180, 50%, 50%)")
    })

    it("should still accept non-alpha colors when allowAlpha is true", () => {
      const schema = color(true, { allowAlpha: true })

      expect(schema.parse("#ff0000")).toBe("#ff0000")
      expect(schema.parse("#fff")).toBe("#fff")
      expect(schema.parse("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)")
      expect(schema.parse("hsl(180, 50%, 50%)")).toBe("hsl(180, 50%, 50%)")
    })

    it("should combine format and allowAlpha options", () => {
      const schema = color(true, { format: "hex", allowAlpha: false })

      expect(schema.parse("#ff0000")).toBe("#ff0000")
      expect(() => schema.parse("#FF0000AA")).toThrow("Must be a valid hex color")
      expect(() => schema.parse("rgb(255, 0, 0)")).toThrow("Must be a valid hex color")
    })
  })

  describe("required/optional behavior", () => {
    it("should require a value when required is true", () => {
      const schema = color(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse(null)).toThrow()
      expect(() => schema.parse(undefined)).toThrow()
    })

    it("should allow null/empty when required is false", () => {
      const schema = color(false)

      expect(schema.parse("")).toBe(null)
      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
    })

    it("should still validate when value is provided with required=false", () => {
      const schema = color(false)

      expect(schema.parse("#ff0000")).toBe("#ff0000")
      expect(schema.parse("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)")
      expect(() => schema.parse("not-a-color")).toThrow("Invalid color format")
    })

    it("should use default values for required schema", () => {
      const schema = color(true, { defaultValue: "#000000" })

      expect(schema.parse("")).toBe("#000000")
      expect(schema.parse(null)).toBe("#000000")
      expect(schema.parse(undefined)).toBe("#000000")
    })

    it("should use default values for optional schema", () => {
      const schema = color(false, { defaultValue: "#ffffff" })

      expect(schema.parse("")).toBe("#ffffff")
      expect(schema.parse(null)).toBe("#ffffff")
      expect(schema.parse(undefined)).toBe("#ffffff")
    })

    it("should handle 'null' and 'undefined' string inputs when required", () => {
      const schema = color(true)

      expect(() => schema.parse("null")).toThrow("Required")
      expect(() => schema.parse("undefined")).toThrow("Required")
    })
  })

  describe("transform function", () => {
    it("should apply custom transform before validation", () => {
      const schema = color(true, {
        transform: (val) => val.toLowerCase(),
      })

      expect(schema.parse("#FF0000")).toBe("#ff0000")
      expect(schema.parse("#ABCDEF")).toBe("#abcdef")
    })

    it("should apply transform that converts shorthand to full hex", () => {
      const schema = color(true, {
        transform: (val) => {
          const shortHex = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i
          const match = val.match(shortHex)
          if (match) {
            return `#${match[1]}${match[1]}${match[2]}${match[2]}${match[3]}${match[3]}`
          }
          return val
        },
      })

      expect(schema.parse("#fff")).toBe("#ffffff")
      expect(schema.parse("#abc")).toBe("#aabbcc")
      expect(schema.parse("#ff0000")).toBe("#ff0000")
    })

    it("should apply transform before validation, not after", () => {
      const schema = color(true, {
        format: "hex",
        transform: (val) => val.trim(),
      })

      expect(schema.parse("  #ff0000  ")).toBe("#ff0000")
    })
  })

  describe("i18n support", () => {
    it("should use English messages by default", () => {
      setLocale("en-US")
      const schema = color(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("not-a-color")).toThrow("Invalid color format")
    })

    it("should use Chinese messages when locale is zh-TW", () => {
      setLocale("zh-TW")
      const schema = color(true)

      expect(() => schema.parse("")).toThrow("必填")
      expect(() => schema.parse("not-a-color")).toThrow("無效的顏色格式")
    })

    it("should use format-specific Chinese messages", () => {
      setLocale("zh-TW")
      const hexSchema = color(true, { format: "hex" })
      const rgbSchema = color(true, { format: "rgb" })
      const hslSchema = color(true, { format: "hsl" })

      expect(() => hexSchema.parse("not-a-color")).toThrow("必須為有效的十六進位顏色")
      expect(() => rgbSchema.parse("not-a-color")).toThrow("必須為有效的 RGB 顏色")
      expect(() => hslSchema.parse("not-a-color")).toThrow("必須為有效的 HSL 顏色")
    })

    it("should use format-specific English messages", () => {
      setLocale("en-US")
      const hexSchema = color(true, { format: "hex" })
      const rgbSchema = color(true, { format: "rgb" })
      const hslSchema = color(true, { format: "hsl" })

      expect(() => hexSchema.parse("not-a-color")).toThrow("Must be a valid hex color")
      expect(() => rgbSchema.parse("not-a-color")).toThrow("Must be a valid RGB color")
      expect(() => hslSchema.parse("not-a-color")).toThrow("Must be a valid HSL color")
    })

    it("should support custom i18n messages", () => {
      const schema = color(true, {
        i18n: {
          "en-US": {
            required: "Color is required",
            invalid: "Please enter a valid color",
            notHex: "Only hex colors allowed",
            notRgb: "Only RGB colors allowed",
            notHsl: "Only HSL colors allowed",
          },
          "zh-TW": {
            required: "請輸入顏色",
            invalid: "請輸入有效的顏色",
          },
        },
      })

      setLocale("en-US")
      expect(() => schema.parse("")).toThrow("Color is required")
      expect(() => schema.parse("not-a-color")).toThrow("Please enter a valid color")

      setLocale("zh-TW")
      expect(() => schema.parse("")).toThrow("請輸入顏色")
      expect(() => schema.parse("not-a-color")).toThrow("請輸入有效的顏色")
    })

    it("should use custom format-specific i18n messages", () => {
      const schema = color(true, {
        format: "hex",
        i18n: {
          "en-US": {
            notHex: "Only hex format is supported",
          },
        },
      })

      setLocale("en-US")
      expect(() => schema.parse("rgb(255, 0, 0)")).toThrow("Only hex format is supported")
    })

    it("should fall back to default messages when custom i18n does not cover the key", () => {
      const schema = color(true, {
        i18n: {
          "en-US": {
            required: "Custom required message",
          },
        },
      })

      setLocale("en-US")
      expect(() => schema.parse("")).toThrow("Custom required message")
      expect(() => schema.parse("not-a-color")).toThrow("Invalid color format")
    })
  })

  describe("edge cases", () => {
    it("should reject completely invalid color strings", () => {
      const schema = color(true)

      expect(() => schema.parse("red")).toThrow("Invalid color format")
      expect(() => schema.parse("blue")).toThrow("Invalid color format")
      expect(() => schema.parse("not-a-color")).toThrow("Invalid color format")
      expect(() => schema.parse("123")).toThrow("Invalid color format")
      expect(() => schema.parse("true")).toThrow("Invalid color format")
    })

    it("should handle whitespace trimming", () => {
      const schema = color(true)

      expect(schema.parse("  #ff0000  ")).toBe("#ff0000")
      expect(schema.parse("\t#fff\n")).toBe("#fff")
      expect(schema.parse("  rgb(255, 0, 0)  ")).toBe("rgb(255, 0, 0)")
    })

    it("should handle empty and whitespace inputs for required schema", () => {
      const schema = color(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("   ")).toThrow("Required")
      expect(() => schema.parse("\t\n")).toThrow("Required")
    })

    it("should handle empty and whitespace inputs for optional schema", () => {
      const schema = color(false)

      expect(schema.parse("")).toBe(null)
      expect(schema.parse("   ")).toBe(null)
      expect(schema.parse("\t\n")).toBe(null)
    })

    it("should handle string coercion from non-string types", () => {
      const schema = color(true)

      expect(() => schema.parse(123)).toThrow("Invalid color format")
      expect(() => schema.parse(true)).toThrow()
      expect(() => schema.parse(false)).toThrow()
    })

    it("should reject hex with invalid characters", () => {
      const schema = color(true, { format: "hex" })

      expect(() => schema.parse("#gg0000")).toThrow("Must be a valid hex color")
      expect(() => schema.parse("#xyz")).toThrow("Must be a valid hex color")
      expect(() => schema.parse("#GHIJKL")).toThrow("Must be a valid hex color")
    })

    it("should reject hex with wrong digit counts", () => {
      const schema = color(true, { format: "hex" })

      expect(() => schema.parse("#12345")).toThrow("Must be a valid hex color")
      expect(() => schema.parse("#1")).toThrow("Must be a valid hex color")
      expect(() => schema.parse("#12")).toThrow("Must be a valid hex color")
      expect(() => schema.parse("#1234")).toThrow("Must be a valid hex color")
      expect(() => schema.parse("#1234567")).toThrow("Must be a valid hex color")
    })

    it("should reject rgb with out-of-range channel values", () => {
      const schema = color(true, { format: "rgb" })

      expect(() => schema.parse("rgb(256, 0, 0)")).toThrow("Must be a valid RGB color")
      expect(() => schema.parse("rgb(-1, 0, 0)")).toThrow("Must be a valid RGB color")
      expect(() => schema.parse("rgb(0, 300, 0)")).toThrow("Must be a valid RGB color")
      expect(() => schema.parse("rgb(0, 0, 999)")).toThrow("Must be a valid RGB color")
    })

    it("should reject hsl with out-of-range values", () => {
      const schema = color(true, { format: "hsl" })

      expect(() => schema.parse("hsl(361, 100%, 50%)")).toThrow("Must be a valid HSL color")
      expect(() => schema.parse("hsl(0, 101%, 50%)")).toThrow("Must be a valid HSL color")
      expect(() => schema.parse("hsl(0, 100%, 101%)")).toThrow("Must be a valid HSL color")
      expect(() => schema.parse("hsl(-1, 50%, 50%)")).toThrow("Must be a valid HSL color")
    })

    it("should handle boundary values for rgb", () => {
      const schema = color(true, { format: "rgb" })

      expect(schema.parse("rgb(0, 0, 0)")).toBe("rgb(0, 0, 0)")
      expect(schema.parse("rgb(255, 255, 255)")).toBe("rgb(255, 255, 255)")
    })

    it("should handle boundary values for hsl", () => {
      const schema = color(true, { format: "hsl" })

      expect(schema.parse("hsl(0, 0%, 0%)")).toBe("hsl(0, 0%, 0%)")
      expect(schema.parse("hsl(360, 100%, 100%)")).toBe("hsl(360, 100%, 100%)")
    })

    it("should handle boundary values for alpha", () => {
      const schema = color(true, { allowAlpha: true })

      expect(schema.parse("rgba(255, 0, 0, 0)")).toBe("rgba(255, 0, 0, 0)")
      expect(schema.parse("rgba(255, 0, 0, 1)")).toBe("rgba(255, 0, 0, 1)")
      expect(schema.parse("hsla(180, 50%, 50%, 0)")).toBe("hsla(180, 50%, 50%, 0)")
      expect(schema.parse("hsla(180, 50%, 50%, 1)")).toBe("hsla(180, 50%, 50%, 1)")
    })
  })
})
