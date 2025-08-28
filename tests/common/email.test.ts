import { describe, it, expect, beforeEach } from "vitest"
import { email, setLocale } from "../../src"

describe("email() features", () => {
  beforeEach(() => setLocale("en"))

  describe("multiple domain support", () => {
    it("should accept multiple allowed domains", () => {
      const schema = email({ domain: ["example.com", "company.org"] })
      expect(schema.parse("test@example.com")).toBe("test@example.com")
      expect(schema.parse("user@company.org")).toBe("user@company.org")
    })

    it("should reject domains not in whitelist", () => {
      const schema = email({ domain: ["example.com", "company.org"] })
      expect(() => schema.parse("test@notallowed.com")).toThrow("Must be from domain: example.com, company.org")
    })
  })

  describe("subdomain support", () => {
    it("should allow subdomains by default", () => {
      const schema = email({ domain: "example.com" })
      expect(schema.parse("test@mail.example.com")).toBe("test@mail.example.com")
      expect(schema.parse("user@api.example.com")).toBe("user@api.example.com")
    })

    it("should reject subdomains when allowSubdomains=false", () => {
      const schema = email({ domain: "example.com", allowSubdomains: false })
      expect(schema.parse("test@example.com")).toBe("test@example.com")
      expect(() => schema.parse("test@mail.example.com")).toThrow("Must be from domain: example.com")
    })
  })

  describe("domain blacklist", () => {
    it("should reject blacklisted domains", () => {
      const schema = email({ domainBlacklist: ["spam.com", "fake.org"] })
      expect(schema.parse("test@example.com")).toBe("test@example.com")
      expect(() => schema.parse("test@spam.com")).toThrow("Domain spam.com is not allowed")
      expect(() => schema.parse("user@fake.org")).toThrow("Domain fake.org is not allowed")
    })

    it("should reject blacklisted subdomains when allowSubdomains=true", () => {
      const schema = email({ domainBlacklist: ["spam.com"], allowSubdomains: true })
      expect(() => schema.parse("test@mail.spam.com")).toThrow("Domain mail.spam.com is not allowed")
    })
  })

  describe("business email validation", () => {
    it("should reject free email providers when businessOnly=true", () => {
      const schema = email({ businessOnly: true })
      expect(schema.parse("john@company.com")).toBe("john@company.com")
      expect(() => schema.parse("john@gmail.com")).toThrow("Only business email addresses are allowed")
      expect(() => schema.parse("jane@yahoo.com")).toThrow("Only business email addresses are allowed")
      expect(() => schema.parse("test@hotmail.com")).toThrow("Only business email addresses are allowed")
    })
  })

  describe("disposable email detection", () => {
    it("should reject disposable email addresses when noDisposable=true", () => {
      const schema = email({ noDisposable: true })
      expect(schema.parse("john@company.com")).toBe("john@company.com")
      expect(() => schema.parse("test@10minutemail.com")).toThrow("Disposable email addresses are not allowed")
      expect(() => schema.parse("user@tempmail.org")).toThrow("Disposable email addresses are not allowed")
      expect(() => schema.parse("temp@mailinator.com")).toThrow("Disposable email addresses are not allowed")
    })
  })

  describe("case handling", () => {
    it("should convert to lowercase by default", () => {
      const schema = email()
      expect(schema.parse("Test@EXAMPLE.COM")).toBe("test@example.com")
      expect(schema.parse("USER@Company.Org")).toBe("user@company.org")
    })

    it("should preserve case when lowercase=false", () => {
      const schema = email({ lowercase: false })
      expect(schema.parse("Test@EXAMPLE.COM")).toBe("Test@EXAMPLE.COM")
      expect(schema.parse("USER@Company.Org")).toBe("USER@Company.Org")
    })
  })

  describe("excludes functionality", () => {
    it("should reject emails containing excluded strings", () => {
      const schema = email({ excludes: ["test", "demo"] })
      expect(schema.parse("john@example.com")).toBe("john@example.com")
      expect(() => schema.parse("test@example.com")).toThrow("Must include test")
      expect(() => schema.parse("demo.user@example.com")).toThrow("Must include demo")
    })

    it("should handle excludes as array", () => {
      const schema = email({ excludes: ["spam", "fake", "test"] })
      expect(() => schema.parse("spam@example.com")).toThrow("Must include spam")
      expect(() => schema.parse("fake.user@example.com")).toThrow("Must include fake")
      expect(() => schema.parse("user@test.com")).toThrow("Must include test")
    })
  })

  describe("transform functionality", () => {
    it("should apply transform function", () => {
      const schema = email({
        transform: (val) => val.replace(/test/g, "user"), // Replace test with user
      })
      expect(schema.parse("test@example.com")).toBe("user@example.com")
      expect(schema.parse("test.email@company.org")).toBe("user.email@company.org")
    })

    it("should apply transform after lowercase", () => {
      const schema = email({
        lowercase: true,
        transform: (val) => val.replace(/\+[^@]*/, ""), // Remove + aliases
      })
      expect(schema.parse("USER+tag@EXAMPLE.COM")).toBe("user@example.com")
    })
  })

  describe("default value functionality", () => {
    it("should use defaultValue for empty input when required", () => {
      const schema = email({ defaultValue: "default@example.com" })
      expect(schema.parse("")).toBe("default@example.com")
      expect(schema.parse(null)).toBe("default@example.com")
      expect(schema.parse(undefined)).toBe("default@example.com")
    })

    it("should use defaultValue for empty input when not required", () => {
      const schema = email({ required: false, defaultValue: "default@example.com" })
      expect(schema.parse("")).toBe("default@example.com")
      expect(schema.parse(null)).toBe("default@example.com")
      expect(schema.parse(undefined)).toBe("default@example.com")
    })
  })

  describe("custom i18n messages", () => {
    it("should use custom messages when provided", () => {
      const schema = email({
        domain: "company.com",
        businessOnly: true,
        i18n: {
          en: {
            required: "Custom required message",
            domain: "Custom domain message: ${domain}",
            businessOnly: "Custom business only message",
          },
          "zh-TW": {
            required: "客製化必填訊息",
            domain: "客製化網域訊息: ${domain}",
            businessOnly: "客製化僅限企業郵箱訊息",
          },
        },
      })

      expect(() => schema.parse("")).toThrow("Custom required message")
      expect(() => schema.parse("test@example.com")).toThrow("Custom domain message: company.com")
      expect(() => schema.parse("test@gmail.com")).toThrow("Custom business only message")
    })

    it("should fallback to default messages when custom not provided", () => {
      const schema = email({
        noDisposable: true,
        i18n: {
          en: {
            required: "Custom required message",
          },
          "zh-TW": {
            required: "客製化必填訊息",
          },
        },
      })

      expect(() => schema.parse("")).toThrow("Custom required message")
      expect(() => schema.parse("test@tempmail.org")).toThrow("Disposable email addresses are not allowed")
    })

    it("should use correct locale for custom messages", () => {
      setLocale("en")
      const schemaEn = email({
        businessOnly: true,
        i18n: {
          en: {
            businessOnly: "English business message",
          },
          "zh-TW": {
            businessOnly: "繁體中文企業訊息",
          },
        },
      })
      expect(() => schemaEn.parse("test@gmail.com")).toThrow("English business message")

      setLocale("zh-TW")
      const schemaZh = email({
        businessOnly: true,
        i18n: {
          en: {
            businessOnly: "English business message",
          },
          "zh-TW": {
            businessOnly: "繁體中文企業訊息",
          },
        },
      })
      expect(() => schemaZh.parse("test@gmail.com")).toThrow("繁體中文企業訊息")
    })
  })

  describe("complex scenarios", () => {
    it("should work with multiple validations", () => {
      const schema = email({
        domain: ["company.com", "business.org"],
        minLength: 10,
        maxLength: 30,
        businessOnly: true,
        noDisposable: true,
        allowSubdomains: false,
      })

      expect(schema.parse("john@company.com")).toBe("john@company.com")
      expect(schema.parse("jane@business.org")).toBe("jane@business.org")

      expect(() => schema.parse("a@co.me")).toThrow("Must be at least 10 characters")
      expect(() => schema.parse("verylongusernamethatexceedslimit@company.com")).toThrow("Must be at most 30 characters")
      expect(() => schema.parse("test@mail.company.com")).toThrow("Must be from domain: company.com, business.org")
      expect(() => schema.parse("user@gmail.com")).toThrow("Only business email addresses are allowed")
    })

    it("should handle null values correctly when not required", () => {
      const schema = email({
        required: false,
        domain: "example.com",
        minLength: 10,
      })

      expect(schema.parse(null)).toBe(null)
      expect(schema.parse("")).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
      expect(schema.parse("longuser@example.com")).toBe("longuser@example.com")
    })

    it("should work with transform, lowercase, and domain validation together", () => {
      const schema = email({
        domain: "company.com",
        lowercase: true,
        transform: (val) => val.replace(/\+[^@]*/, ""), // Remove + aliases
        allowSubdomains: true,
      })

      expect(schema.parse("USER+tag@MAIL.COMPANY.COM")).toBe("user@mail.company.com")
      expect(schema.parse("TEST+alias@COMPANY.COM")).toBe("test@company.com")
    })
  })
})
