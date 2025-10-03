import { describe, expect, it, beforeEach } from "vitest"
import { Locale, setLocale, password } from "../../src"

const locales = [
  {
    locale: "en",
    messages: {
      required: "Required",
      min: "Must be at least 8 characters",
      max: "Must be at most 20 characters",
      uppercase: "Must include at least one uppercase letter",
      lowercase: "Must include at least one lowercase letter",
      digits: "Must include at least one digit",
      special: "Must include at least one special character",
      noRepeating: "Must not contain repeating characters",
      noSequential: "Must not contain sequential characters",
      noCommonWords: "Must not contain common words or patterns",
      minStrength: "Password strength must be at least strong",
      excludes: "Must not contain test",
      includes: "Must include @",
      invalid: "Invalid password format",
    },
  },
  {
    locale: "zh-TW",
    messages: {
      required: "必填",
      min: "長度至少 8 字元",
      max: "長度最多 20 字元",
      uppercase: "必須包含至少一個大寫字母",
      lowercase: "必須包含至少一個小寫字母",
      digits: "必須包含至少一個數字",
      special: "必須包含至少一個特殊符號",
      noRepeating: "不可包含重複字元",
      noSequential: "不可包含連續字元",
      noCommonWords: "不可包含常見密碼或模式",
      minStrength: "密碼強度必須至少為 strong",
      excludes: "不得包含「test」",
      includes: "必須包含「@」",
      invalid: "密碼格式錯誤",
    },
  },
] as const

describe.each(locales)("password(true) locale: $locale", ({ locale, messages }) => {
  beforeEach(() => setLocale(locale as Locale))

  describe("basic functionality", () => {
    it("should pass with valid string", () => {
      const schema = password(true)
      expect(schema.parse("hello")).toBe("hello")
    })

    it("should fail with empty string when required", () => {
      const schema = password(true)
      expect(() => schema.parse("")).toThrow(messages.required)
      expect(() => schema.parse(null)).toThrow(messages.required)
      expect(() => schema.parse(undefined)).toThrow(messages.required)
    })

    it("should pass with null when not required", () => {
      const schema = password(false)
      expect(schema.parse("")).toBe(null)
      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
    })

    it("should handle default values", () => {
      const schema = password(false, { defaultValue: "default123" })
      expect(schema.parse("")).toBe("default123")
      expect(schema.parse(null)).toBe("default123")
      expect(schema.parse(undefined)).toBe("default123")
      expect(schema.parse("actual")).toBe("actual")
    })

    it("should apply transform function", () => {
      const schema = password(true, { transform: (val) => val.toLowerCase() })
      expect(schema.parse("HELLO")).toBe("hello")
    })
  })

  describe("length validation", () => {
    it("should fail with string shorter than min", () => {
      const schema = password(true, { min: 8 })
      expect(() => schema.parse("short")).toThrow(messages.min)
    })

    it("should fail with string longer than max", () => {
      const schema = password(true, { max: 20 })
      expect(() => schema.parse("this_is_a_very_long_password_that_exceeds_limit")).toThrow(messages.max)
    })

    it("should pass with valid length", () => {
      const schema = password(true, { min: 5, max: 15 })
      expect(schema.parse("validpassword")).toBe("validpassword")
    })
  })

  describe("character requirements", () => {
    it("should enforce uppercase requirement", () => {
      const schema = password(true, { uppercase: true })
      expect(() => schema.parse("lowercase1!")).toThrow(messages.uppercase)
      expect(schema.parse("Hello1!")).toBe("Hello1!")
    })

    it("should enforce lowercase requirement", () => {
      const schema = password(true, { lowercase: true })
      expect(() => schema.parse("UPPERCASE1!")).toThrow(messages.lowercase)
      expect(schema.parse("Test1!")).toBe("Test1!")
    })

    it("should enforce digit requirement", () => {
      const schema = password(true, { digits: true })
      expect(() => schema.parse("NoDigits!")).toThrow(messages.digits)
      expect(schema.parse("With1!")).toBe("With1!")
    })

    it("should enforce special character requirement", () => {
      const schema = password(true, { special: true })
      expect(() => schema.parse("NoSpecial1")).toThrow(messages.special)
      expect(schema.parse("Valid1!")).toBe("Valid1!")
    })

    it("should enforce multiple requirements", () => {
      const schema = password(true, { uppercase: true, lowercase: true, digits: true, special: true })
      expect(() => schema.parse("nouppercase1!")).toThrow(messages.uppercase)
      expect(() => schema.parse("NOLOWERCASE1!")).toThrow(messages.lowercase)
      expect(() => schema.parse("NoDigits!")).toThrow(messages.digits)
      expect(() => schema.parse("NoSpecial1")).toThrow(messages.special)
      expect(schema.parse("Valid1!")).toBe("Valid1!")
    })
  })

  describe("advanced security features", () => {
    it("should enforce no repeating characters", () => {
      const schema = password(true, { noRepeating: true })
      expect(() => schema.parse("password111")).toThrow(messages.noRepeating)
      expect(() => schema.parse("helllo")).toThrow(messages.noRepeating)
      expect(schema.parse("password")).toBe("password")
    })

    it("should enforce no sequential characters", () => {
      const schema = password(true, { noSequential: true })
      expect(() => schema.parse("abc123")).toThrow(messages.noSequential)
      expect(() => schema.parse("xyz789")).toThrow(messages.noSequential)
      expect(() => schema.parse("password456")).toThrow(messages.noSequential)
      expect(schema.parse("random135")).toBe("random135")
    })

    it("should enforce no common words", () => {
      const schema = password(true, { noCommonWords: true })
      expect(() => schema.parse("password123")).toThrow(messages.noCommonWords)
      expect(() => schema.parse("admin")).toThrow(messages.noCommonWords)
      expect(() => schema.parse("qwerty")).toThrow(messages.noCommonWords)
      expect(schema.parse("randomtext")).toBe("randomtext")
    })

    it("should enforce minimum strength", () => {
      const schema = password(true, { minStrength: "strong" })
      expect(() => schema.parse("weak")).toThrow(messages.minStrength)
      expect(() => schema.parse("123456")).toThrow(messages.minStrength)
      expect(schema.parse("StrongP@ssw0rd")).toBe("StrongP@ssw0rd")
    })
  })

  describe("content validation", () => {
    it("should enforce includes requirement", () => {
      const schema = password(true, { includes: "@" })
      expect(() => schema.parse("password")).toThrow(messages.includes)
      expect(schema.parse("user@pass")).toBe("user@pass")
    })

    it("should enforce excludes requirement with string", () => {
      const schema = password(true, { excludes: "test" })
      expect(() => schema.parse("testpassword")).toThrow(messages.excludes)
      expect(schema.parse("password")).toBe("password")
    })

    it("should enforce excludes requirement with array", () => {
      const schema = password(true, { excludes: ["test", "admin"] })
      expect(() => schema.parse("testpassword")).toThrow()
      expect(() => schema.parse("adminpass")).toThrow()
      expect(schema.parse("password")).toBe("password")
    })

    it("should enforce regex requirement", () => {
      const schema = password(true, { regex: /^[a-zA-Z0-9!@#$%^&*()]+$/ })
      expect(() => schema.parse("invalid-password")).toThrow(messages.invalid)
      expect(schema.parse("Valid123!")).toBe("Valid123!")
    })
  })

  describe("custom i18n messages", () => {
    it("should use custom i18n messages when provided", () => {
      const customMessages = {
        en: {
          required: "Custom required message",
          min: "Custom min ${min} message",
          uppercase: "Custom uppercase message",
        },
        "zh-TW": {
          required: "自訂必填訊息",
          min: "自訂最小長度 ${min} 訊息",
          uppercase: "自訂大寫字母訊息",
        },
      }

      const schema = password(true, {
        min: 8,
        uppercase: true,
        i18n: customMessages,
      })

      if (locale === "en") {
        expect(() => schema.parse("")).toThrow("Custom required message")
        expect(() => schema.parse("short")).toThrow("Custom min 8 message")
        expect(() => schema.parse("nouppercase")).toThrow("Custom uppercase message")
      } else {
        expect(() => schema.parse("")).toThrow("自訂必填訊息")
        expect(() => schema.parse("short")).toThrow("自訂最小長度 8 訊息")
        expect(() => schema.parse("nouppercase")).toThrow("自訂大寫字母訊息")
      }
    })

    it("should fallback to default i18n when custom message not provided", () => {
      const customMessages = {
        en: { required: "Custom required message" },
        "zh-TW": { required: "自訂必填訊息" },
      }

      const schema = password(true, {
        uppercase: true,
        i18n: customMessages,
      })

      if (locale === "en") {
        expect(() => schema.parse("")).toThrow("Custom required message")
        expect(() => schema.parse("nouppercase")).toThrow(messages.uppercase)
      } else {
        expect(() => schema.parse("")).toThrow("自訂必填訊息")
        expect(() => schema.parse("nouppercase")).toThrow(messages.uppercase)
      }
    })
  })

  describe("complex scenarios", () => {
    it("should handle all features combined", () => {
      const schema = password(true, {
        min: 12,
        max: 50,
        uppercase: true,
        lowercase: true,
        digits: true,
        special: true,
        noRepeating: true,
        noSequential: true,
        noCommonWords: true,
        minStrength: "strong",
        includes: "@",
        excludes: ["test", "admin"],
      })

      // Should fail for various reasons
      expect(() => schema.parse("short")).toThrow()
      expect(() => schema.parse("NoLowercase123!@")).toThrow()
      expect(() => schema.parse("nouppercase123!@")).toThrow()
      expect(() => schema.parse("NoDigits!@")).toThrow()
      expect(() => schema.parse("NoSpecial123@")).toThrow()
      expect(() => schema.parse("Repeating111!@")).toThrow()
      expect(() => schema.parse("Sequential123!@")).toThrow()
      expect(() => schema.parse("Password123!@")).toThrow()
      expect(() => schema.parse("Complex123!")).toThrow() // Missing @
      expect(() => schema.parse("TestComplex123!@")).toThrow() // Contains "test"

      // Should pass
      expect(schema.parse("C0mpl3x@P@ssw0rd")).toBe("C0mpl3x@P@ssw0rd")
    })

    it("should work with optional password and all features", () => {
      const schema = password(false, { min: 8, uppercase: true, lowercase: true, digits: true, special: true })

      expect(schema.parse(null)).toBe(null)
      expect(schema.parse("")).toBe(null)
      expect(() => schema.parse("weak")).toThrow()
      expect(schema.parse("Strong1!")).toBe("Strong1!")
    })
  })

  describe("password strength calculation", () => {
    const testStrengthScenarios = [
      { password: "weak", expectedToPass: false, minStrength: "medium" as const },
      { password: "Medium1", expectedToPass: false, minStrength: "strong" as const },
      { password: "Strong1!", expectedToPass: true, minStrength: "medium" as const },
      { password: "VeryStrongP@ssw0rd123", expectedToPass: true, minStrength: "strong" as const },
    ]

    testStrengthScenarios.forEach(({ password: testPassword, expectedToPass, minStrength }) => {
      it(`should ${expectedToPass ? "pass" : "fail"} for password "${testPassword}" with minStrength "${minStrength}"`, () => {
        const schema = password(true, { minStrength })

        if (expectedToPass) {
          expect(schema.parse(testPassword)).toBe(testPassword)
        } else {
          expect(() => schema.parse(testPassword)).toThrow()
        }
      })
    })
  })
})
