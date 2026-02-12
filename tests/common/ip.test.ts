import { describe, it, expect, beforeEach } from "vitest"
import { ip, setLocale, validateIPv4, validateIPv6 } from "../../src"

describe("ip(true) validator", () => {
  beforeEach(() => setLocale("en-US"))

  describe("IPv4 validation", () => {
    it("should accept valid IPv4 addresses", () => {
      const schema = ip(true)

      expect(schema.parse("192.168.1.1")).toBe("192.168.1.1")
      expect(schema.parse("0.0.0.0")).toBe("0.0.0.0")
      expect(schema.parse("255.255.255.255")).toBe("255.255.255.255")
      expect(schema.parse("10.0.0.1")).toBe("10.0.0.1")
      expect(schema.parse("127.0.0.1")).toBe("127.0.0.1")
      expect(schema.parse("172.16.0.1")).toBe("172.16.0.1")
    })

    it("should reject invalid IPv4 addresses", () => {
      const schema = ip(true)

      expect(() => schema.parse("256.1.1.1")).toThrow("Invalid IP address")
      expect(() => schema.parse("1.1.1")).toThrow("Invalid IP address")
      expect(() => schema.parse("1.2.3.4.5")).toThrow("Invalid IP address")
      expect(() => schema.parse("999.999.999.999")).toThrow("Invalid IP address")
      expect(() => schema.parse("-1.0.0.0")).toThrow("Invalid IP address")
      expect(() => schema.parse("abc.def.ghi.jkl")).toThrow("Invalid IP address")
    })

    it("should reject IPv4 addresses with leading zeros", () => {
      const schema = ip(true)

      expect(() => schema.parse("01.01.01.01")).toThrow("Invalid IP address")
      expect(() => schema.parse("192.168.01.1")).toThrow("Invalid IP address")
      expect(() => schema.parse("00.0.0.0")).toThrow("Invalid IP address")
    })
  })

  describe("IPv6 validation", () => {
    it("should accept valid full-form IPv6 addresses", () => {
      const schema = ip(true)

      expect(schema.parse("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe("2001:0db8:85a3:0000:0000:8a2e:0370:7334")
      expect(schema.parse("fe80:0000:0000:0000:0000:0000:0000:0001")).toBe("fe80:0000:0000:0000:0000:0000:0000:0001")
    })

    it("should accept valid compressed IPv6 addresses", () => {
      const schema = ip(true)

      expect(schema.parse("::1")).toBe("::1")
      expect(schema.parse("fe80::")).toBe("fe80::")
      expect(schema.parse("2001:db8::1")).toBe("2001:db8::1")
      expect(schema.parse("::")).toBe("::")
    })

    it("should accept valid mixed IPv6/IPv4 addresses", () => {
      const schema = ip(true)

      expect(schema.parse("::ffff:192.0.2.1")).toBe("::ffff:192.0.2.1")
      expect(schema.parse("::ffff:10.0.0.1")).toBe("::ffff:10.0.0.1")
    })

    it("should reject invalid IPv6 addresses", () => {
      const schema = ip(true)

      expect(() => schema.parse("gggg::1")).toThrow("Invalid IP address")
      expect(() => schema.parse("2001:db8::85a3::7334")).toThrow("Invalid IP address")
      expect(() => schema.parse("12345::1")).toThrow("Invalid IP address")
      expect(() => schema.parse("2001:db8:85a3:0000:0000:8a2e:0370")).toThrow("Invalid IP address")
    })
  })

  describe("version filtering", () => {
    it("should only accept IPv4 when version is 'v4'", () => {
      const schema = ip(true, { version: "v4" })

      expect(schema.parse("192.168.1.1")).toBe("192.168.1.1")
      expect(schema.parse("10.0.0.1")).toBe("10.0.0.1")

      expect(() => schema.parse("::1")).toThrow("Must be a valid IPv4 address")
      expect(() => schema.parse("2001:db8::1")).toThrow("Must be a valid IPv4 address")
    })

    it("should only accept IPv6 when version is 'v6'", () => {
      const schema = ip(true, { version: "v6" })

      expect(schema.parse("::1")).toBe("::1")
      expect(schema.parse("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe("2001:0db8:85a3:0000:0000:8a2e:0370:7334")

      expect(() => schema.parse("192.168.1.1")).toThrow("Must be a valid IPv6 address")
      expect(() => schema.parse("10.0.0.1")).toThrow("Must be a valid IPv6 address")
    })

    it("should accept both IPv4 and IPv6 when version is 'any'", () => {
      const schema = ip(true, { version: "any" })

      expect(schema.parse("192.168.1.1")).toBe("192.168.1.1")
      expect(schema.parse("::1")).toBe("::1")
      expect(schema.parse("2001:db8::1")).toBe("2001:db8::1")
    })

    it("should default to 'any' when version is not specified", () => {
      const schema = ip(true)

      expect(schema.parse("192.168.1.1")).toBe("192.168.1.1")
      expect(schema.parse("::1")).toBe("::1")
    })
  })

  describe("CIDR support", () => {
    it("should reject CIDR notation when allowCIDR is false (default)", () => {
      const schema = ip(true)

      expect(() => schema.parse("192.168.1.0/24")).toThrow("Invalid IP address")
      expect(() => schema.parse("10.0.0.0/8")).toThrow("Invalid IP address")
      expect(() => schema.parse("2001:db8::/32")).toThrow("Invalid IP address")
    })

    it("should accept valid IPv4 CIDR when allowCIDR is true", () => {
      const schema = ip(true, { allowCIDR: true })

      expect(schema.parse("192.168.1.0/24")).toBe("192.168.1.0/24")
      expect(schema.parse("10.0.0.0/8")).toBe("10.0.0.0/8")
      expect(schema.parse("0.0.0.0/0")).toBe("0.0.0.0/0")
      expect(schema.parse("255.255.255.255/32")).toBe("255.255.255.255/32")
    })

    it("should accept valid IPv6 CIDR when allowCIDR is true", () => {
      const schema = ip(true, { allowCIDR: true })

      expect(schema.parse("2001:db8::/32")).toBe("2001:db8::/32")
      expect(schema.parse("::1/128")).toBe("::1/128")
      expect(schema.parse("::/0")).toBe("::/0")
    })

    it("should reject invalid CIDR prefix lengths", () => {
      const schema = ip(true, { allowCIDR: true })

      expect(() => schema.parse("192.168.1.0/33")).toThrow("Invalid IP address")
      expect(() => schema.parse("192.168.1.0/-1")).toThrow("Invalid IP address")
      expect(() => schema.parse("2001:db8::/129")).toThrow("Invalid IP address")
      expect(() => schema.parse("192.168.1.0/abc")).toThrow("Invalid IP address")
    })

    it("should still accept plain IPs when allowCIDR is true", () => {
      const schema = ip(true, { allowCIDR: true })

      expect(schema.parse("192.168.1.1")).toBe("192.168.1.1")
      expect(schema.parse("::1")).toBe("::1")
    })
  })

  describe("whitelist", () => {
    it("should accept IPs in the whitelist", () => {
      const schema = ip(true, { whitelist: ["192.168.1.1", "10.0.0.1", "::1"] })

      expect(schema.parse("192.168.1.1")).toBe("192.168.1.1")
      expect(schema.parse("10.0.0.1")).toBe("10.0.0.1")
      expect(schema.parse("::1")).toBe("::1")
    })

    it("should reject IPs not in the whitelist", () => {
      const schema = ip(true, { whitelist: ["192.168.1.1", "10.0.0.1"] })

      expect(() => schema.parse("192.168.1.2")).toThrow("IP address is not in the allowed list")
      expect(() => schema.parse("172.16.0.1")).toThrow("IP address is not in the allowed list")
      expect(() => schema.parse("::1")).toThrow("IP address is not in the allowed list")
    })

    it("should not apply whitelist when the array is empty", () => {
      const schema = ip(true, { whitelist: [] })

      expect(schema.parse("192.168.1.1")).toBe("192.168.1.1")
      expect(schema.parse("::1")).toBe("::1")
    })
  })

  describe("required/optional behavior", () => {
    it("should reject empty values when required=true", () => {
      const schema = ip(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse(null)).toThrow()
      expect(() => schema.parse(undefined)).toThrow()
    })

    it("should accept empty values when required=false", () => {
      const schema = ip(false)

      expect(schema.parse("")).toBe(null)
      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
    })

    it("should still validate non-empty values when required=false", () => {
      const schema = ip(false)

      expect(schema.parse("192.168.1.1")).toBe("192.168.1.1")
      expect(() => schema.parse("invalid-ip")).toThrow("Invalid IP address")
    })

    it("should use default values", () => {
      const requiredSchema = ip(true, { defaultValue: "127.0.0.1" })
      const optionalSchema = ip(false, { defaultValue: "127.0.0.1" })

      expect(requiredSchema.parse("")).toBe("127.0.0.1")
      expect(optionalSchema.parse("")).toBe("127.0.0.1")
    })
  })

  describe("transform function", () => {
    it("should apply custom transform before validation", () => {
      const schema = ip(true, {
        transform: (val) => val.toLowerCase(),
      })

      expect(schema.parse("192.168.1.1")).toBe("192.168.1.1")
    })

    it("should apply transform to the trimmed value", () => {
      const schema = ip(true, {
        transform: (val) => val.replace(/\s+/g, ""),
      })

      expect(schema.parse("192. 168.1.1")).toBe("192.168.1.1")
    })
  })

  describe("i18n support", () => {
    it("should use English messages by default", () => {
      setLocale("en-US")
      const schema = ip(true)

      expect(() => schema.parse("")).toThrow("Required")
      expect(() => schema.parse("invalid")).toThrow("Invalid IP address")
    })

    it("should use Chinese messages when locale is zh-TW", () => {
      setLocale("zh-TW")
      const schema = ip(true)

      expect(() => schema.parse("")).toThrow("必填")
      expect(() => schema.parse("invalid")).toThrow("無效的 IP 位址")
    })

    it("should use version-specific messages", () => {
      setLocale("en-US")
      const v4Schema = ip(true, { version: "v4" })
      const v6Schema = ip(true, { version: "v6" })

      expect(() => v4Schema.parse("::1")).toThrow("Must be a valid IPv4 address")
      expect(() => v6Schema.parse("192.168.1.1")).toThrow("Must be a valid IPv6 address")

      setLocale("zh-TW")
      expect(() => v4Schema.parse("::1")).toThrow("必須為有效的 IPv4 位址")
      expect(() => v6Schema.parse("192.168.1.1")).toThrow("必須為有效的 IPv6 位址")
    })

    it("should support custom i18n messages", () => {
      const schema = ip(true, {
        i18n: {
          "en-US": {
            required: "IP is required",
            invalid: "Bad IP",
            notIPv4: "Need IPv4",
            notIPv6: "Need IPv6",
            notInWhitelist: "Not allowed",
          },
          "zh-TW": {
            required: "請輸入 IP",
            invalid: "IP 錯誤",
          },
        },
      })

      setLocale("en-US")
      expect(() => schema.parse("")).toThrow("IP is required")
      expect(() => schema.parse("invalid")).toThrow("Bad IP")

      setLocale("zh-TW")
      expect(() => schema.parse("")).toThrow("請輸入 IP")
      expect(() => schema.parse("invalid")).toThrow("IP 錯誤")
    })

    it("should support partial custom i18n messages with fallback to defaults", () => {
      const schema = ip(true, {
        version: "v4",
        i18n: {
          "en-US": {
            required: "Custom required",
          },
        },
      })

      setLocale("en-US")
      expect(() => schema.parse("")).toThrow("Custom required")
      expect(() => schema.parse("::1")).toThrow("Must be a valid IPv4 address")
    })

    it("should support whitelist error messages in custom i18n", () => {
      const schema = ip(true, {
        whitelist: ["192.168.1.1"],
        i18n: {
          "en-US": {
            notInWhitelist: "Not allowed",
          },
        },
      })

      setLocale("en-US")
      expect(() => schema.parse("10.0.0.1")).toThrow("Not allowed")
    })
  })

  describe("utility functions", () => {
    describe("validateIPv4", () => {
      it("should return true for valid IPv4 addresses", () => {
        expect(validateIPv4("192.168.1.1")).toBe(true)
        expect(validateIPv4("0.0.0.0")).toBe(true)
        expect(validateIPv4("255.255.255.255")).toBe(true)
        expect(validateIPv4("10.0.0.1")).toBe(true)
        expect(validateIPv4("127.0.0.1")).toBe(true)
      })

      it("should return false for invalid IPv4 addresses", () => {
        expect(validateIPv4("256.1.1.1")).toBe(false)
        expect(validateIPv4("1.1.1")).toBe(false)
        expect(validateIPv4("1.2.3.4.5")).toBe(false)
        expect(validateIPv4("01.01.01.01")).toBe(false)
        expect(validateIPv4("abc.def.ghi.jkl")).toBe(false)
        expect(validateIPv4("")).toBe(false)
        expect(validateIPv4("...")).toBe(false)
        expect(validateIPv4("1.2.3.")).toBe(false)
        expect(validateIPv4(".1.2.3")).toBe(false)
      })
    })

    describe("validateIPv6", () => {
      it("should return true for valid IPv6 addresses", () => {
        expect(validateIPv6("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(true)
        expect(validateIPv6("::1")).toBe(true)
        expect(validateIPv6("fe80::")).toBe(true)
        expect(validateIPv6("::")).toBe(true)
        expect(validateIPv6("2001:db8::1")).toBe(true)
      })

      it("should return true for mixed IPv6/IPv4 addresses", () => {
        expect(validateIPv6("::ffff:192.0.2.1")).toBe(true)
        expect(validateIPv6("::ffff:10.0.0.1")).toBe(true)
      })

      it("should return false for invalid IPv6 addresses", () => {
        expect(validateIPv6("gggg::1")).toBe(false)
        expect(validateIPv6("2001:db8::85a3::7334")).toBe(false)
        expect(validateIPv6("12345::1")).toBe(false)
        expect(validateIPv6("")).toBe(false)
      })

      it("should return false for mixed IPv6 with invalid IPv4 portion", () => {
        expect(validateIPv6("::ffff:256.0.0.1")).toBe(false)
        expect(validateIPv6("::ffff:01.02.03.04")).toBe(false)
      })
    })
  })

  describe("edge cases", () => {
    it("should handle leading zeros in IPv4 as invalid", () => {
      const schema = ip(true)

      expect(() => schema.parse("01.01.01.01")).toThrow("Invalid IP address")
      expect(() => schema.parse("001.001.001.001")).toThrow("Invalid IP address")
      expect(() => schema.parse("192.168.01.1")).toThrow("Invalid IP address")
    })

    it("should handle empty octets in IPv4 as invalid", () => {
      const schema = ip(true)

      expect(() => schema.parse("1..1.1")).toThrow("Invalid IP address")
      expect(() => schema.parse("...")).toThrow("Invalid IP address")
      expect(() => schema.parse("1.2.3.")).toThrow("Invalid IP address")
      expect(() => schema.parse(".1.2.3")).toThrow("Invalid IP address")
    })

    it("should handle whitespace trimming", () => {
      const schema = ip(true)

      expect(schema.parse("  192.168.1.1  ")).toBe("192.168.1.1")
      expect(schema.parse("\t::1\n")).toBe("::1")
    })

    it("should handle string conversion from other types", () => {
      const schema = ip(true)

      expect(() => schema.parse(12345)).toThrow("Invalid IP address")
      expect(() => schema.parse(true)).toThrow("Invalid IP address")
    })

    it("should reject 'null' and 'undefined' string values when required", () => {
      const schema = ip(true)

      expect(() => schema.parse("null")).toThrow("Required")
      expect(() => schema.parse("undefined")).toThrow("Required")
    })

    it("should handle double :: in IPv6 as invalid", () => {
      expect(validateIPv6("2001:db8::85a3::7334")).toBe(false)
      expect(validateIPv6("::1::2")).toBe(false)
    })

    it("should handle too many groups in IPv6 as invalid", () => {
      expect(validateIPv6("2001:0db8:85a3:0000:0000:8a2e:0370:7334:extra")).toBe(false)
    })

    it("should handle groups exceeding 4 hex characters as invalid", () => {
      expect(validateIPv6("12345::1")).toBe(false)
      expect(validateIPv6("2001:0db8:85a3:00000:0000:8a2e:0370:7334")).toBe(false)
    })
  })
})
