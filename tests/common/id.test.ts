import { describe, expect, it, beforeEach } from "vitest"
import { Locale, setLocale, id, detectIdType, validateIdType, ID_PATTERNS } from "../../src"

const locales = [
  {
    locale: "en-US",
    messages: {
      required: "Required",
      invalid: "Invalid ID format",
      minLength: "Must be at least 5 characters",
      maxLength: "Must be at most 10 characters",
      numeric: "Must be a numeric ID",
      uuid: "Must be a valid UUID",
      objectId: "Must be a valid MongoDB ObjectId",
      nanoid: "Must be a valid Nano ID",
      snowflake: "Must be a valid Snowflake ID",
      cuid: "Must be a valid CUID",
      ulid: "Must be a valid ULID",
      shortid: "Must be a valid Short ID",
      customFormat: "Invalid ID format",
      includes: "Must include test",
      excludes: "Must not contain bad",
      startsWith: "Must start with id",
      endsWith: "Must end with _end",
    },
  },
  {
    locale: "zh-TW",
    messages: {
      required: "必填",
      invalid: "無效的 ID 格式",
      minLength: "長度至少 5 字元",
      maxLength: "長度最多 10 字元",
      numeric: "必須為數字 ID",
      uuid: "必須為有效的 UUID",
      objectId: "必須為有效的 MongoDB ObjectId",
      nanoid: "必須為有效的 Nano ID",
      snowflake: "必須為有效的 Snowflake ID",
      cuid: "必須為有效的 CUID",
      ulid: "必須為有效的 ULID",
      shortid: "必須為有效的 Short ID",
      customFormat: "無效的 ID 格式",
      includes: "必須包含「test」",
      excludes: "不得包含「bad」",
      startsWith: "必須以「id」開頭",
      endsWith: "必須以「_end」結尾",
    },
  },
] as const

// Valid test IDs for different formats
const validIds = {
  numeric: ["1", "123", "999999", "0"],
  uuid: ["550e8400-e29b-41d4-a716-446655440000", "6ba7b810-9dad-11d1-80b4-00c04fd430c8", "f47ac10b-58cc-4372-a567-0e02b2c3d479"],
  objectId: ["507f1f77bcf86cd799439011", "507f191e810c19729de860ea", "5a9427648b0beebeb69579cc"],
  nanoid: ["V1StGXR8_Z5jdHi6B-myT", "3IBBoOd_b1YSlnKdvQ8fK", "9_xnJ2QZt8vKl3_Kj5f7N"],
  snowflake: ["1234567890123456789", "9876543210987654321", "5555555555555555555"],
  cuid: ["cjld2cjxh0000qzrmn831i7rn", "ckfr9f3rm0000jo082qvo1234", "cl9ebqhxs000109kygp36rup2"],
  ulid: ["01BX5ZZKBKACTAV9WEVGEMMVRY", "01F4A9WRNHXQM6WR0P9T2XKZG4", "01GFQJ8KWT7M9QZRV4S3N2P8X5"],
  shortid: ["S1x8U-213", "B1Ox_-hV2", "rkH-OgHfr", "H1f_-OxBf", "_rJfOgSGr"],
} as const

// Invalid test IDs for different formats
const invalidIds = {
  numeric: ["abc", "12a", ""],
  uuid: [
    "550e8400-e29b-41d4-a716-44665544000", // too short
    "550e8400-e29b-41d4-a716-44665544000g", // too long
    "550e8400-e29b-61d4-a716-446655440000", // wrong version (6 instead of 1-5)
    "550e8400-e29b-41d4-c716-446655440000", // wrong variant (c instead of 8,9,a,b)
    "not-a-uuid-at-all",
  ],
  objectId: [
    "507f1f77bcf86cd79943901", // too short
    "507f1f77bcf86cd799439011g", // invalid character
    "507f1f77bcf86cd799439011aa", // too long
  ],
  nanoid: [
    "V1StGXR8_Z5jdHi6B-myT_", // too long
    "V1StGXR8_Z5jdHi6B-my", // too short
    "V1StGXR8_Z5jdHi6B-my&", // invalid character
  ],
  snowflake: [
    "123456789012345678", // too short
    "12345678901234567890", // too long
    "123456789012345678a", // invalid character
  ],
  cuid: [
    "jld2cjxh0000qzrmn831i7rn", // missing 'c' prefix
    "cjld2cjxh0000qzrmn831i7rn_", // too long
    "cjld2cjxh0000qzrmn831i7r", // too short
  ],
  ulid: [
    "01BX5ZZKBKACTAV9WEVGEMMVR", // too short
    "01BX5ZZKBKACTAV9WEVGEMMVRYX", // too long
    "01BX5ZZKBKACTAV9WEVGEMMVO", // invalid character 'O'
  ],
  shortid: [
    "S1x8U-", // too short
    "S1x8U-213-very-long", // too long
    "S1x8U-213+", // invalid character
  ],
} as const

describe.each(locales)("id(true) locale: $locale", ({ locale, messages }) => {
  beforeEach(() => setLocale(locale as Locale))

  describe("basic functionality", () => {
    it("should pass with valid ID", () => {
      const schema = id(true)
      expect(schema.parse("123")).toBe("123")
      expect(schema.parse("550e8400-e29b-41d4-a716-446655440000")).toBe("550e8400-e29b-41d4-a716-446655440000")
    })

    it("should fail with empty string when required", () => {
      const schema = id(true)
      expect(() => schema.parse("")).toThrow(messages.required)
      expect(() => schema.parse(null)).toThrow(messages.required)
      expect(() => schema.parse(undefined)).toThrow(messages.required)
    })

    it("should pass with null when not required", () => {
      const schema = id(false)
      expect(schema.parse("")).toBe(null)
      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
    })

    it("should handle default values", () => {
      const schema = id(false, { defaultValue: "123" })
      expect(schema.parse("")).toBe("123")
      expect(schema.parse(null)).toBe("123")
      expect(schema.parse(undefined)).toBe("123")
      expect(schema.parse("456")).toBe("456")
    })

    it("should apply transform function", () => {
      const schema = id(true, { type: "uuid", transform: (val) => val.toUpperCase() })
      expect(schema.parse("550e8400-e29b-41d4-a716-446655440000")).toBe("550E8400-E29B-41D4-A716-446655440000")
    })
  })

  describe("length validation", () => {
    it("should fail with string shorter than minLength", () => {
      const schema = id(true, { minLength: 5 })
      expect(() => schema.parse("123")).toThrow(messages.minLength)
    })

    it("should fail with string longer than maxLength", () => {
      const schema = id(true, { maxLength: 10 })
      expect(() => schema.parse("12345678901")).toThrow(messages.maxLength)
    })

    it("should pass with valid length", () => {
      const schema = id(true, { minLength: 3, maxLength: 10 })
      expect(schema.parse("12345")).toBe("12345")
    })
  })

  describe("ID type validation", () => {
    describe("numeric IDs", () => {
      it("should accept valid numeric IDs", () => {
        const schema = id(true, { type: "numeric" })
        validIds.numeric.forEach((validId) => {
          const result = schema.parse(validId)
          expect(typeof result).toBe("number")
          expect(result).toBe(Number(validId))
        })
      })

      it("should reject invalid numeric IDs", () => {
        const schema = id(true, { type: "numeric" })
        invalidIds.numeric.forEach((invalidId) => {
          expect(() => schema.parse(invalidId)).toThrow()
        })
      })
    })

    describe("UUID validation", () => {
      it("should accept valid UUIDs", () => {
        const schema = id(true, { type: "uuid" })
        validIds.uuid.forEach((validUuid) => {
          expect(schema.parse(validUuid)).toBe(validUuid)
        })
      })

      it("should reject invalid UUIDs", () => {
        const schema = id(true, { type: "uuid" })
        invalidIds.uuid.forEach((invalidUuid) => {
          expect(() => schema.parse(invalidUuid)).toThrow(messages.uuid)
        })
      })
    })

    describe("ObjectId validation", () => {
      it("should accept valid ObjectIds", () => {
        const schema = id(true, { type: "objectId" })
        validIds.objectId.forEach((validObjectId) => {
          expect(schema.parse(validObjectId)).toBe(validObjectId)
        })
      })

      it("should reject invalid ObjectIds", () => {
        const schema = id(true, { type: "objectId" })
        invalidIds.objectId.forEach((invalidObjectId) => {
          expect(() => schema.parse(invalidObjectId)).toThrow(messages.objectId)
        })
      })
    })

    describe("Nanoid validation", () => {
      it("should accept valid Nanoids", () => {
        const schema = id(true, { type: "nanoid" })
        validIds.nanoid.forEach((validNanoid) => {
          expect(schema.parse(validNanoid)).toBe(validNanoid)
        })
      })

      it("should reject invalid Nanoids", () => {
        const schema = id(true, { type: "nanoid" })
        invalidIds.nanoid.forEach((invalidNanoid) => {
          expect(() => schema.parse(invalidNanoid)).toThrow(messages.nanoid)
        })
      })
    })

    describe("Snowflake validation", () => {
      it("should accept valid Snowflake IDs", () => {
        const schema = id(true, { type: "snowflake" })
        validIds.snowflake.forEach((validSnowflake) => {
          expect(schema.parse(validSnowflake)).toBe(validSnowflake)
        })
      })

      it("should reject invalid Snowflake IDs", () => {
        const schema = id(true, { type: "snowflake" })
        invalidIds.snowflake.forEach((invalidSnowflake) => {
          expect(() => schema.parse(invalidSnowflake)).toThrow(messages.snowflake)
        })
      })
    })

    describe("CUID validation", () => {
      it("should accept valid CUIDs", () => {
        const schema = id(true, { type: "cuid" })
        validIds.cuid.forEach((validCuid) => {
          expect(schema.parse(validCuid)).toBe(validCuid)
        })
      })

      it("should reject invalid CUIDs", () => {
        const schema = id(true, { type: "cuid" })
        invalidIds.cuid.forEach((invalidCuid) => {
          expect(() => schema.parse(invalidCuid)).toThrow(messages.cuid)
        })
      })
    })

    describe("ULID validation", () => {
      it("should accept valid ULIDs", () => {
        const schema = id(true, { type: "ulid" })
        validIds.ulid.forEach((validUlid) => {
          expect(schema.parse(validUlid)).toBe(validUlid)
        })
      })

      it("should reject invalid ULIDs", () => {
        const schema = id(true, { type: "ulid" })
        invalidIds.ulid.forEach((invalidUlid) => {
          expect(() => schema.parse(invalidUlid)).toThrow(messages.ulid)
        })
      })
    })

    describe("ShortId validation", () => {
      it("should accept valid ShortIds", () => {
        const schema = id(true, { type: "shortid" })
        validIds.shortid.forEach((validShortid) => {
          expect(schema.parse(validShortid)).toBe(validShortid)
        })
      })

      it("should reject invalid ShortIds", () => {
        const schema = id(true, { type: "shortid" })
        invalidIds.shortid.forEach((invalidShortid) => {
          expect(() => schema.parse(invalidShortid)).toThrow(messages.shortid)
        })
      })
    })

    describe("auto detection", () => {
      it("should accept any valid ID format when type is auto", () => {
        const schema = id(true, { type: "auto" })

        Object.values(validIds)
          .flat()
          .forEach((validId) => {
            expect(schema.parse(validId)).toBe(validId)
          })
      })

      it("should reject invalid ID formats when type is auto", () => {
        const schema = id(true, { type: "auto" })

        expect(() => schema.parse("bad-id")).toThrow(messages.invalid)
        expect(() => schema.parse("abc")).toThrow(messages.invalid)
        expect(() => schema.parse("!@#$%")).toThrow(messages.invalid)
      })
    })

    describe("allowedTypes", () => {
      it("should accept IDs that match any allowed type", () => {
        const schema = id(true, { allowedTypes: ["numeric", "uuid"] })

        expect(schema.parse("123")).toBe("123")
        expect(schema.parse("550e8400-e29b-41d4-a716-446655440000")).toBe("550e8400-e29b-41d4-a716-446655440000")
      })

      it("should reject IDs that don't match allowed types", () => {
        const schema = id(true, { allowedTypes: ["numeric", "uuid"] })

        expect(() => schema.parse("507f1f77bcf86cd799439011")).toThrow() // ObjectId
        expect(() => schema.parse("V1StGXR8_Z5jdHi6B-myT")).toThrow() // Nanoid
      })
    })
  })

  describe("content validation", () => {
    it("should enforce includes requirement", () => {
      const schema = id(true, { includes: "test" })
      expect(() => schema.parse("123")).toThrow(messages.includes)
      expect(schema.parse("test123")).toBe("test123")
    })

    it("should enforce excludes requirement with string", () => {
      const schema = id(true, { excludes: "bad" })
      expect(() => schema.parse("bad123")).toThrow(messages.excludes)
      expect(schema.parse("good123")).toBe("good123")
    })

    it("should enforce excludes requirement with array", () => {
      const schema = id(true, { excludes: ["bad", "evil"] })
      expect(() => schema.parse("bad123")).toThrow()
      expect(() => schema.parse("evil123")).toThrow()
      expect(schema.parse("good123")).toBe("good123")
    })

    it("should enforce startsWith requirement", () => {
      const schema = id(true, { startsWith: "id" })
      expect(() => schema.parse("123")).toThrow(messages.startsWith)
      expect(schema.parse("id123")).toBe("id123")
    })

    it("should enforce endsWith requirement", () => {
      const schema = id(true, { endsWith: "_end" })
      expect(() => schema.parse("123")).toThrow(messages.endsWith)
      expect(schema.parse("123_end")).toBe("123_end")
    })

    it("should enforce custom regex requirement", () => {
      const schema = id(true, { customRegex: /^[A-Z]{2}\d{4}$/ })
      expect(() => schema.parse("ab1234")).toThrow(messages.customFormat)
      expect(() => schema.parse("AB123")).toThrow(messages.customFormat)
      expect(schema.parse("AB1234")).toBe("AB1234")
    })
  })

  describe("case sensitivity", () => {
    it("should be case sensitive by default", () => {
      const schema = id(true, { startsWith: "ID" })
      expect(() => schema.parse("id123")).toThrow()
      expect(schema.parse("ID123")).toBe("ID123")
    })

    it("should be case insensitive when configured", () => {
      const schema = id(true, { startsWith: "id", caseSensitive: false })
      expect(schema.parse("id123")).toBe("id123")
      expect(schema.parse("ID123")).toBe("id123") // transformed to lowercase
    })

    it("should preserve case for UUID and ObjectId even when case insensitive", () => {
      const schema = id(true, { type: "uuid", caseSensitive: false })
      const uuid = "550E8400-E29B-41D4-A716-446655440000"
      expect(schema.parse(uuid)).toBe(uuid) // case preserved for UUID
    })
  })

  describe("custom i18n messages", () => {
    it("should use custom i18n messages when provided", () => {
      const customMessages = {
        "en-US": {
          required: "Custom required message",
          invalid: "Custom invalid message",
          numeric: "Custom numeric message",
        },
        "zh-TW": {
          required: "自訂必填訊息",
          invalid: "自訂無效訊息",
          numeric: "自訂數字訊息",
        },
      }

      const schema = id(true, {
        type: "numeric",
        i18n: customMessages,
      })

      if (locale === "en-US") {
        expect(() => schema.parse("")).toThrow("Custom required message")
        expect(() => schema.parse("abc")).toThrow("Custom numeric message")
      } else {
        expect(() => schema.parse("")).toThrow("自訂必填訊息")
        expect(() => schema.parse("abc")).toThrow("自訂數字訊息")
      }
    })

    it("should fallback to default i18n when custom message not provided", () => {
      const customMessages = {
        "en-US": { required: "Custom required message" },
        "zh-TW": { required: "自訂必填訊息" },
      }

      const schema = id(true, {
        type: "numeric",
        i18n: customMessages,
      })

      if (locale === "en-US") {
        expect(() => schema.parse("")).toThrow("Custom required message")
        expect(() => schema.parse("abc")).toThrow(messages.numeric)
      } else {
        expect(() => schema.parse("")).toThrow("自訂必填訊息")
        expect(() => schema.parse("abc")).toThrow(messages.numeric)
      }
    })
  })

  describe("complex scenarios", () => {
    it("should handle all features combined", () => {
      const schema = id(true, {
        type: "uuid",
        minLength: 30,
        maxLength: 50,
        includes: "-",
        excludes: ["test", "bad"],
        startsWith: "550e",
        caseSensitive: false,
      })

      // Should fail for various reasons
      expect(() => schema.parse("123")).toThrow() // not UUID
      expect(() => schema.parse("550e8400-e29b-41d4-test-446655440000")).toThrow() // contains "test"
      expect(() => schema.parse("abc-123")).toThrow() // doesn't start with "550e"

      // Should pass (UUID preserves case even with caseSensitive: false)
      expect(schema.parse("550E8400-E29B-41D4-A716-446655440000")).toBe("550E8400-E29B-41D4-A716-446655440000")
    })

    it("should work with optional ID and all features", () => {
      const schema = id(false, { type: "numeric", minLength: 3, maxLength: 10 })

      expect(schema.parse(null)).toBe(null)
      expect(schema.parse("")).toBe(null)
      expect(() => schema.parse("ab")).toThrow() // not numeric
      expect(() => schema.parse("12")).toThrow() // too short
      expect(schema.parse("12345")).toBe(12345) // Returns number for numeric type
      expect(typeof schema.parse("12345")).toBe("number")
    })

    it("should handle multiple allowed types with constraints", () => {
      const schema = id(true, {
        allowedTypes: ["uuid", "objectId"],
        includes: "4",
        minLength: 20,
      })

      expect(schema.parse("550e8400-e29b-41d4-a716-446655440000")).toBe("550e8400-e29b-41d4-a716-446655440000")
      expect(schema.parse("507f1f77bcf86cd799439041")).toBe("507f1f77bcf86cd799439041")
      expect(() => schema.parse("123456")).toThrow() // numeric not allowed
      expect(() => schema.parse("507f1f77bcf86cd799339011")).toThrow() // no "4"
    })
  })

  describe("utility functions", () => {
    it("should expose detectIdType function", () => {
      expect(detectIdType("123")).toBe("numeric")
      expect(detectIdType("550e8400-e29b-41d4-a716-446655440000")).toBe("uuid")
      expect(detectIdType("507f1f77bcf86cd799439011")).toBe("objectId")
      expect(detectIdType("not-id")).toBe(null)
    })

    it("should expose validateIdType function", () => {
      expect(validateIdType("123", "numeric")).toBe(true)
      expect(validateIdType("abc", "numeric")).toBe(false)
      expect(validateIdType("550e8400-e29b-41d4-a716-446655440000", "uuid")).toBe(true)
      expect(validateIdType("invalid-uuid", "uuid")).toBe(false)
    })

    it("should expose ID_PATTERNS constant", () => {
      expect(ID_PATTERNS.numeric.test("123")).toBe(true)
      expect(ID_PATTERNS.uuid.test("550e8400-e29b-41d4-a716-446655440000")).toBe(true)
      expect(ID_PATTERNS.objectId.test("507f1f77bcf86cd799439011")).toBe(true)
    })
  })

  describe("numeric type returns number", () => {
    it("should return number type when type is numeric and required is true", () => {
      const schema = id(true, { type: "numeric" })
      const result = schema.parse("123")
      expect(result).toBe(123)
      expect(typeof result).toBe("number")
    })

    it("should return number | null when type is numeric and required is false", () => {
      const schema = id(false, { type: "numeric" })
      const result = schema.parse("456")
      expect(result).toBe(456)
      expect(typeof result).toBe("number")

      const nullResult = schema.parse(null)
      expect(nullResult).toBe(null)

      const emptyResult = schema.parse("")
      expect(emptyResult).toBe(null)
    })

    it("should use numeric default value for numeric type", () => {
      const schema = id(true, { type: "numeric", defaultValue: 999 })
      const result = schema.parse("")
      expect(result).toBe(999)
      expect(typeof result).toBe("number")
    })

    it("should validate numeric ID constraints", () => {
      const schema = id(true, { type: "numeric", minLength: 3, maxLength: 5 })

      expect(schema.parse("123")).toBe(123)
      expect(schema.parse("12345")).toBe(12345)

      // Too short
      expect(() => schema.parse("12")).toThrow()

      // Too long
      expect(() => schema.parse("123456")).toThrow()

      // Not numeric
      expect(() => schema.parse("abc")).toThrow()
    })

    it("should convert string numbers to number type", () => {
      const schema = id(true, { type: "numeric" })

      expect(schema.parse("0")).toBe(0)
      expect(schema.parse("999999")).toBe(999999)
      expect(schema.parse(123)).toBe(123)

      expect(typeof schema.parse("123")).toBe("number")
    })
  })
})
