import { describe, it, expect } from "vitest"
import { setLocale, url } from "../../src"

describe("url", () => {
  describe("basic validation", () => {
    it("should validate valid URL", () => {
      const schema = url()
      expect(schema.parse("https://example.com")).toBe("https://example.com")
    })

    it("should validate http URL", () => {
      const schema = url()
      expect(schema.parse("http://example.com")).toBe("http://example.com")
    })

    it("should validate URL with path", () => {
      const schema = url()
      expect(schema.parse("https://example.com/path")).toBe("https://example.com/path")
    })

    it("should validate URL with query parameters", () => {
      const schema = url()
      expect(schema.parse("https://example.com?param=value")).toBe("https://example.com?param=value")
    })

    it("should validate URL with fragment", () => {
      const schema = url()
      expect(schema.parse("https://example.com#section")).toBe("https://example.com#section")
    })

    it("should reject invalid URL format", () => {
      const schema = url()
      expect(() => schema.parse("invalid-url")).toThrow()
    })

    it("should reject empty string", () => {
      const schema = url()
      expect(() => schema.parse("")).toThrow()
    })

    it("should reject null", () => {
      const schema = url()
      expect(() => schema.parse(null)).toThrow()
    })

    it("should reject undefined", () => {
      const schema = url()
      expect(() => schema.parse(undefined)).toThrow()
    })
  })

  describe("optional", () => {
    it("should allow null when not required", () => {
      const schema = url({ required: false })
      expect(schema.parse(null)).toBe(null)
    })

    it("should allow empty string when not required", () => {
      const schema = url({ required: false })
      expect(schema.parse("")).toBe(null)
    })

    it("should allow undefined when not required", () => {
      const schema = url({ required: false })
      expect(schema.parse(undefined)).toBe(null)
    })

    it("should validate valid URL when not required", () => {
      const schema = url({ required: false })
      expect(schema.parse("https://example.com")).toBe("https://example.com")
    })
  })

  describe("length validation", () => {
    it("should accept URL with valid min length", () => {
      const schema = url({ min: 10 })
      expect(schema.parse("https://example.com")).toBe("https://example.com")
    })

    it("should reject URL below min length", () => {
      const schema = url({ min: 30 })
      expect(() => schema.parse("https://short.co")).toThrow()
    })

    it("should accept URL with valid max length", () => {
      const schema = url({ max: 30 })
      expect(schema.parse("https://example.com")).toBe("https://example.com")
    })

    it("should reject URL above max length", () => {
      const schema = url({ max: 10 })
      expect(() => schema.parse("https://verylongurl.com")).toThrow()
    })

    it("should accept URL within range", () => {
      const schema = url({ min: 10, max: 30 })
      expect(schema.parse("https://example.com")).toBe("https://example.com")
    })
  })

  describe("includes/excludes validation", () => {
    it("should accept URL containing required substring", () => {
      const schema = url({ includes: "company" })
      expect(schema.parse("https://company.example.com")).toBe("https://company.example.com")
    })

    it("should reject URL not containing required substring", () => {
      const schema = url({ includes: "company" })
      expect(() => schema.parse("https://other.com")).toThrow()
    })

    it("should accept URL not containing excluded substring", () => {
      const schema = url({ excludes: "banned" })
      expect(schema.parse("https://example.com")).toBe("https://example.com")
    })

    it("should reject URL containing excluded substring", () => {
      const schema = url({ excludes: "banned" })
      expect(() => schema.parse("https://banned.com")).toThrow()
    })

    it("should handle multiple excluded substrings as array", () => {
      const schema = url({ excludes: ["banned", "blocked"] })
      expect(schema.parse("https://example.com")).toBe("https://example.com")
      expect(() => schema.parse("https://banned.com")).toThrow()
      expect(() => schema.parse("https://blocked.com")).toThrow()
    })
  })

  describe("protocol validation", () => {
    it("should accept allowed protocols", () => {
      const schema = url({ protocols: ["https", "http"] })
      expect(schema.parse("https://example.com")).toBe("https://example.com")
      expect(schema.parse("http://example.com")).toBe("http://example.com")
    })

    it("should reject disallowed protocols", () => {
      const schema = url({ protocols: ["https"] })
      expect(() => schema.parse("http://example.com")).toThrow()
    })

    it("should accept ftp protocol when allowed", () => {
      const schema = url({ protocols: ["ftp"] })
      expect(schema.parse("ftp://files.example.com")).toBe("ftp://files.example.com")
    })
  })

  describe("domain validation", () => {
    it("should accept allowed domains", () => {
      const schema = url({ allowedDomains: ["example.com", "test.org"] })
      expect(schema.parse("https://example.com")).toBe("https://example.com")
      expect(schema.parse("https://sub.example.com")).toBe("https://sub.example.com")
    })

    it("should reject disallowed domains", () => {
      const schema = url({ allowedDomains: ["example.com"] })
      expect(() => schema.parse("https://other.com")).toThrow()
    })

    it("should reject blocked domains", () => {
      const schema = url({ blockedDomains: ["blocked.com", "spam.org"] })
      expect(schema.parse("https://example.com")).toBe("https://example.com")
      expect(() => schema.parse("https://blocked.com")).toThrow()
      expect(() => schema.parse("https://sub.blocked.com")).toThrow()
    })
  })

  describe("port validation", () => {
    it("should accept allowed ports", () => {
      const schema = url({ allowedPorts: [80, 443, 8080] })
      expect(schema.parse("https://example.com")).toBe("https://example.com") // 443
      expect(schema.parse("http://example.com")).toBe("http://example.com") // 80
      expect(schema.parse("https://example.com:8080")).toBe("https://example.com:8080")
    })

    it("should reject disallowed ports", () => {
      const schema = url({ allowedPorts: [443] })
      expect(() => schema.parse("http://example.com")).toThrow() // Port 80
    })

    it("should reject blocked ports", () => {
      const schema = url({ blockedPorts: [80] })
      expect(schema.parse("https://example.com")).toBe("https://example.com") // 443
      expect(() => schema.parse("http://example.com")).toThrow() // Port 80
    })
  })

  describe("path validation", () => {
    it("should accept path starting with required prefix", () => {
      const schema = url({ pathStartsWith: "/api" })
      expect(schema.parse("https://example.com/api/users")).toBe("https://example.com/api/users")
    })

    it("should reject path not starting with required prefix", () => {
      const schema = url({ pathStartsWith: "/api" })
      expect(() => schema.parse("https://example.com/web/users")).toThrow()
    })

    it("should accept path ending with required suffix", () => {
      const schema = url({ pathEndsWith: ".json" })
      expect(schema.parse("https://example.com/api/data.json")).toBe("https://example.com/api/data.json")
    })

    it("should reject path not ending with required suffix", () => {
      const schema = url({ pathEndsWith: ".json" })
      expect(() => schema.parse("https://example.com/api/data.xml")).toThrow()
    })
  })

  describe("query validation", () => {
    it("should accept URL with query when required", () => {
      const schema = url({ mustHaveQuery: true })
      expect(schema.parse("https://example.com?param=value")).toBe("https://example.com?param=value")
    })

    it("should reject URL without query when required", () => {
      const schema = url({ mustHaveQuery: true })
      expect(() => schema.parse("https://example.com")).toThrow()
    })

    it("should accept URL without query when forbidden", () => {
      const schema = url({ mustNotHaveQuery: true })
      expect(schema.parse("https://example.com")).toBe("https://example.com")
    })

    it("should reject URL with query when forbidden", () => {
      const schema = url({ mustNotHaveQuery: true })
      expect(() => schema.parse("https://example.com?param=value")).toThrow()
    })
  })

  describe("fragment validation", () => {
    it("should accept URL with fragment when required", () => {
      const schema = url({ mustHaveFragment: true })
      expect(schema.parse("https://example.com#section")).toBe("https://example.com#section")
    })

    it("should reject URL without fragment when required", () => {
      const schema = url({ mustHaveFragment: true })
      expect(() => schema.parse("https://example.com")).toThrow()
    })

    it("should accept URL without fragment when forbidden", () => {
      const schema = url({ mustNotHaveFragment: true })
      expect(schema.parse("https://example.com")).toBe("https://example.com")
    })

    it("should reject URL with fragment when forbidden", () => {
      const schema = url({ mustNotHaveFragment: true })
      expect(() => schema.parse("https://example.com#section")).toThrow()
    })
  })

  describe("localhost validation", () => {
    it("should allow localhost by default", () => {
      const schema = url()
      expect(schema.parse("http://localhost:3000")).toBe("http://localhost:3000")
      expect(schema.parse("http://127.0.0.1")).toBe("http://127.0.0.1")
      expect(schema.parse("http://192.168.1.1")).toBe("http://192.168.1.1")
    })

    it("should block localhost when blockLocalhost is true", () => {
      const schema = url({ blockLocalhost: true })
      expect(schema.parse("https://example.com")).toBe("https://example.com")
      expect(() => schema.parse("http://localhost:3000")).toThrow()
      expect(() => schema.parse("http://127.0.0.1")).toThrow()
      expect(() => schema.parse("http://192.168.1.1")).toThrow()
    })

    it("should block localhost when allowLocalhost is false", () => {
      const schema = url({ allowLocalhost: false })
      expect(() => schema.parse("http://localhost:3000")).toThrow()
    })
  })

  describe("transform function", () => {
    it("should apply custom transform function", () => {
      const schema = url({ transform: (val) => val.replace("http://", "https://") })
      expect(schema.parse("http://example.com")).toBe("https://example.com")
    })

    it("should apply transform before validation", () => {
      const schema = url({
        protocols: ["https"],
        transform: (val) => val.replace("http://", "https://"),
      })
      expect(schema.parse("http://example.com")).toBe("https://example.com")
    })

    it("should work with other validations after transform", () => {
      const schema = url({
        includes: "https",
        transform: (val) => val.replace("http://", "https://"),
      })
      expect(schema.parse("http://example.com")).toBe("https://example.com")
    })
  })

  describe("default value", () => {
    it("should use default value when input is empty", () => {
      const schema = url({ defaultValue: "https://example.com" })
      expect(schema.parse("")).toBe("https://example.com")
      expect(schema.parse(null)).toBe("https://example.com")
      expect(schema.parse(undefined)).toBe("https://example.com")
    })

    it("should use default value when optional and input is empty", () => {
      const schema = url({ required: false, defaultValue: "https://example.com" })
      expect(schema.parse("")).toBe("https://example.com")
      expect(schema.parse(null)).toBe("https://example.com")
      expect(schema.parse(undefined)).toBe("https://example.com")
    })
  })

  describe("i18n custom messages", () => {
    it("should use custom English messages", () => {
      const schema = url({
        i18n: {
          en: { invalid: "Custom URL format error" },
          "zh-TW": { invalid: "自定義 URL 格式錯誤" },
        },
      })

      setLocale("en")
      try {
        schema.parse("invalid-url")
      } catch (error: any) {
        expect(error.issues[0].message).toBe("Custom URL format error")
      }
    })

    it("should use custom Chinese messages", () => {
      const schema = url({
        i18n: {
          en: { invalid: "Custom URL format error" },
          "zh-TW": { invalid: "自定義 URL 格式錯誤" },
        },
      })

      setLocale("zh-TW")
      try {
        schema.parse("invalid-url")
      } catch (error: any) {
        expect(error.issues[0].message).toBe("自定義 URL 格式錯誤")
      }
    })

    it("should fallback to default messages when custom not provided", () => {
      const schema = url({
        i18n: {
          en: { invalid: "Custom invalid error" },
          "zh-TW": { invalid: "自定義無效錯誤" },
        },
      })

      setLocale("en")
      try {
        schema.parse("")
      } catch (error: any) {
        expect(error.issues[0].message).toBe("Required") // Default message
      }
    })

    it("should handle protocol validation with custom message", () => {
      const schema = url({
        protocols: ["https"],
        i18n: {
          en: { protocol: "Only HTTPS allowed!" },
          "zh-TW": { protocol: "僅允許 HTTPS！" },
        },
      })

      setLocale("en")
      try {
        schema.parse("http://example.com")
      } catch (error: any) {
        expect(error.issues[0].message).toBe("Only HTTPS allowed!")
      }
    })

    it("should handle domain validation with custom message", () => {
      const schema = url({
        allowedDomains: ["example.com"],
        i18n: {
          en: { domain: "Only example.com allowed!" },
          "zh-TW": { domain: "僅允許 example.com！" },
        },
      })

      setLocale("en")
      try {
        schema.parse("https://other.com")
      } catch (error: any) {
        expect(error.issues[0].message).toBe("Only example.com allowed!")
      }
    })
  })

  describe("localization", () => {
    it("should use English error messages", () => {
      setLocale("en")
      const schema = url()

      try {
        schema.parse("invalid")
      } catch (error: any) {
        expect(error.issues[0].message).toContain("Invalid URL format")
      }
    })

    it("should use Chinese error messages", () => {
      setLocale("zh-TW")
      const schema = url()

      try {
        schema.parse("invalid")
      } catch (error: any) {
        expect(error.issues[0].message).toContain("無效的 URL 格式")
      }
    })

    it("should use Chinese domain validation messages", () => {
      setLocale("zh-TW")
      const schema = url({ allowedDomains: ["example.com"] })

      try {
        schema.parse("https://other.com")
      } catch (error: any) {
        expect(error.issues[0].message).toContain("網域必須為")
      }
    })
  })

  describe("complex scenarios", () => {
    it("should handle multiple validations combined", () => {
      const schema = url({
        protocols: ["https"],
        allowedDomains: ["example.com"],
        min: 20,
        max: 50,
        pathStartsWith: "/api",
        mustHaveQuery: true,
      })

      expect(schema.parse("https://example.com/api/users?id=1")).toBe("https://example.com/api/users?id=1")

      expect(() => schema.parse("http://example.com/api/users?id=1")).toThrow() // Wrong protocol
      expect(() => schema.parse("https://other.com/api/users?id=1")).toThrow() // Wrong domain
      expect(() => schema.parse("https://example.com/web/users?id=1")).toThrow() // Wrong path
      expect(() => schema.parse("https://example.com/api/users")).toThrow() // No query
    })

    it("should handle localhost detection in private networks", () => {
      const schema = url({ blockLocalhost: true })

      expect(() => schema.parse("http://10.0.0.1")).toThrow()
      expect(() => schema.parse("http://172.16.0.1")).toThrow()
      expect(() => schema.parse("http://192.168.0.1")).toThrow()
      expect(schema.parse("https://8.8.8.8")).toBe("https://8.8.8.8") // Public IP
    })

    it("should handle edge cases with ports", () => {
      const schema = url({ allowedPorts: [443, 8080] })

      expect(schema.parse("https://example.com")).toBe("https://example.com") // Default 443
      expect(schema.parse("https://example.com:8080")).toBe("https://example.com:8080")
      expect(() => schema.parse("https://example.com:3000")).toThrow()
    })
  })

  describe("edge cases", () => {
    it("should handle URLs with special characters", () => {
      const schema = url()
      expect(schema.parse("https://example.com/path%20with%20spaces")).toBe("https://example.com/path%20with%20spaces")
    })

    it("should handle international domain names", () => {
      const schema = url()
      expect(schema.parse("https://xn--fsq.com")).toBe("https://xn--fsq.com") // Internationalized domain
    })

    it("should handle URLs with authentication", () => {
      const schema = url()
      expect(schema.parse("https://user:pass@example.com")).toBe("https://user:pass@example.com")
    })

    it("should handle very long URLs", () => {
      const longPath = "/very/long/path/" + "segment/".repeat(100)
      const longUrl = `https://example.com${longPath}`
      const schema = url()
      expect(schema.parse(longUrl)).toBe(longUrl)
    })
  })
})
