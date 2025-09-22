import { describe, it, expect, beforeEach } from "vitest"
import { file, setLocale } from "../../src"

describe("file() features", () => {
  beforeEach(() => setLocale("en"))

  // Helper function to create mock files for testing
  const createMockFile = (name: string, size: number, type: string, content?: string): File => {
    // For very large sizes, don't actually create large content
    const actualContent = content || (size > 1024 * 1024 ? "x".repeat(1024) : "x".repeat(size))
    const blob = new Blob([actualContent], { type })
    const file = new File([blob], name, { type })

    // Mock the size property since File constructor doesn't always set the exact size
    Object.defineProperty(file, 'size', {
      value: size,
      writable: false,
      enumerable: true,
      configurable: false
    })

    return file
  }

  describe("basic file validation", () => {
    it("should accept valid File objects", () => {
      const schema = file()
      const mockFile = createMockFile("test.txt", 1024, "text/plain")
      expect(schema.parse(mockFile)).toBe(mockFile)
    })

    it("should reject non-File objects", () => {
      const schema = file()
      expect(() => schema.parse("not a file")).toThrow()
      expect(() => schema.parse(123)).toThrow()
      expect(() => schema.parse({})).toThrow()
    })

    it("should handle required validation", () => {
      const schema = file()
      expect(() => schema.parse(null)).toThrow("Required")
      expect(() => schema.parse(undefined)).toThrow("Required")
      expect(() => schema.parse("")).toThrow("Required")
    })

    it("should allow null when not required", () => {
      const schema = file({ required: false })
      expect(schema.parse(null)).toBe(null)
      expect(schema.parse(undefined)).toBe(null)
      expect(schema.parse("")).toBe(null)
    })
  })

  describe("file size validation", () => {
    it("should validate maximum file size", () => {
      const schema = file({ maxSize: 1024 }) // 1KB
      const smallFile = createMockFile("small.txt", 512, "text/plain")
      const largeFile = createMockFile("large.txt", 2048, "text/plain")

      expect(schema.parse(smallFile)).toBe(smallFile)
      expect(() => schema.parse(largeFile)).toThrow("File size must not exceed 1 KB")
    })

    it("should validate minimum file size", () => {
      const schema = file({ minSize: 1024 }) // 1KB
      const smallFile = createMockFile("small.txt", 512, "text/plain")
      const largeFile = createMockFile("large.txt", 2048, "text/plain")

      expect(() => schema.parse(smallFile)).toThrow("File size must be at least 1 KB")
      expect(schema.parse(largeFile)).toBe(largeFile)
    })

    it("should validate both min and max size", () => {
      const schema = file({ minSize: 1024, maxSize: 4096 }) // 1KB - 4KB
      const tooSmall = createMockFile("small.txt", 512, "text/plain")
      const justRight = createMockFile("medium.txt", 2048, "text/plain")
      const tooLarge = createMockFile("large.txt", 8192, "text/plain")

      expect(() => schema.parse(tooSmall)).toThrow("File size must be at least 1 KB")
      expect(schema.parse(justRight)).toBe(justRight)
      expect(() => schema.parse(tooLarge)).toThrow("File size must not exceed 4 KB")
    })
  })

  describe("file type validation", () => {
    it("should accept allowed MIME types", () => {
      const schema = file({ type: "text/plain" })
      const textFile = createMockFile("test.txt", 1024, "text/plain")
      const imageFile = createMockFile("test.jpg", 1024, "image/jpeg")

      expect(schema.parse(textFile)).toBe(textFile)
      expect(() => schema.parse(imageFile)).toThrow("File type must be one of: text/plain")
    })

    it("should accept multiple allowed MIME types", () => {
      const schema = file({ type: ["text/plain", "image/jpeg", "application/pdf"] })
      const textFile = createMockFile("test.txt", 1024, "text/plain")
      const imageFile = createMockFile("test.jpg", 1024, "image/jpeg")
      const pdfFile = createMockFile("test.pdf", 1024, "application/pdf")
      const videoFile = createMockFile("test.mp4", 1024, "video/mp4")

      expect(schema.parse(textFile)).toBe(textFile)
      expect(schema.parse(imageFile)).toBe(imageFile)
      expect(schema.parse(pdfFile)).toBe(pdfFile)
      expect(() => schema.parse(videoFile)).toThrow("File type must be one of: text/plain, image/jpeg, application/pdf")
    })

    it("should reject blacklisted MIME types", () => {
      const schema = file({ typeBlacklist: ["application/x-executable", "application/x-virus"] })
      const textFile = createMockFile("test.txt", 1024, "text/plain")
      const exeFile = createMockFile("test.exe", 1024, "application/x-executable")

      expect(schema.parse(textFile)).toBe(textFile)
      expect(() => schema.parse(exeFile)).toThrow("File type must be one of: application/x-executable, application/x-virus")
    })
  })

  describe("file extension validation", () => {
    it("should validate single file extension", () => {
      const schema = file({ extension: ".txt" })
      const txtFile = createMockFile("test.txt", 1024, "text/plain")
      const jpgFile = createMockFile("test.jpg", 1024, "image/jpeg")

      expect(schema.parse(txtFile)).toBe(txtFile)
      expect(() => schema.parse(jpgFile)).toThrow("File extension must be one of: .txt")
    })

    it("should validate multiple file extensions", () => {
      const schema = file({ extension: [".txt", ".pdf", ".doc"] })
      const txtFile = createMockFile("test.txt", 1024, "text/plain")
      const pdfFile = createMockFile("test.pdf", 1024, "application/pdf")
      const jpgFile = createMockFile("test.jpg", 1024, "image/jpeg")

      expect(schema.parse(txtFile)).toBe(txtFile)
      expect(schema.parse(pdfFile)).toBe(pdfFile)
      expect(() => schema.parse(jpgFile)).toThrow("File extension must be one of: .txt, .pdf, .doc")
    })

    it("should handle extensions without dots", () => {
      const schema = file({ extension: ["txt", "pdf"] })
      const txtFile = createMockFile("test.txt", 1024, "text/plain")
      const pdfFile = createMockFile("test.pdf", 1024, "application/pdf")

      expect(schema.parse(txtFile)).toBe(txtFile)
      expect(schema.parse(pdfFile)).toBe(pdfFile)
    })

    it("should reject blacklisted extensions", () => {
      const schema = file({ extensionBlacklist: [".exe", ".bat", ".cmd"] })
      const txtFile = createMockFile("test.txt", 1024, "text/plain")
      const exeFile = createMockFile("virus.exe", 1024, "application/x-executable")

      expect(schema.parse(txtFile)).toBe(txtFile)
      expect(() => schema.parse(exeFile)).toThrow("File extension .exe, .bat, .cmd is not allowed")
    })

    it("should handle case sensitivity", () => {
      const caseSensitiveSchema = file({ extension: [".txt"], caseSensitive: true })
      const caseInsensitiveSchema = file({ extension: [".txt"], caseSensitive: false })
      const upperCaseFile = createMockFile("test.TXT", 1024, "text/plain")

      expect(() => caseSensitiveSchema.parse(upperCaseFile)).toThrow("File extension must be one of: .txt")
      expect(caseInsensitiveSchema.parse(upperCaseFile)).toBe(upperCaseFile)
    })
  })

  describe("file name validation", () => {
    it("should validate file name patterns", () => {
      const schema = file({ namePattern: /^[a-zA-Z0-9_-]+\.(txt|pdf)$/ })
      const validFile = createMockFile("valid_file-123.txt", 1024, "text/plain")
      const invalidFile = createMockFile("invalid file!.txt", 1024, "text/plain")

      expect(schema.parse(validFile)).toBe(validFile)
      expect(() => schema.parse(invalidFile)).toThrow("File name must match pattern")
    })

    it("should validate file name patterns with strings", () => {
      const schema = file({ namePattern: "^report_\\d{4}\\.pdf$" })
      const validFile = createMockFile("report_2023.pdf", 1024, "application/pdf")
      const invalidFile = createMockFile("report_abc.pdf", 1024, "application/pdf")

      expect(schema.parse(validFile)).toBe(validFile)
      expect(() => schema.parse(invalidFile)).toThrow("File name must match pattern")
    })

    it("should reject blacklisted name patterns", () => {
      const schema = file({ nameBlacklist: [/temp/i, /^test/] })
      const goodFile = createMockFile("document.pdf", 1024, "application/pdf")
      const tempFile = createMockFile("TempFile.txt", 1024, "text/plain")
      const testFile = createMockFile("test_data.csv", 1024, "text/csv")

      expect(schema.parse(goodFile)).toBe(goodFile)
      expect(() => schema.parse(tempFile)).toThrow("File name must not match pattern")
      expect(() => schema.parse(testFile)).toThrow("File name must not match pattern")
    })

    it("should handle multiple blacklist patterns", () => {
      const schema = file({ nameBlacklist: ["virus", /malware/i, /\.(exe|bat)$/] })
      const goodFile = createMockFile("document.pdf", 1024, "application/pdf")
      const virusFile = createMockFile("virus.txt", 1024, "text/plain")
      const malwareFile = createMockFile("MALWARE_test.pdf", 1024, "application/pdf")
      const exeFile = createMockFile("program.exe", 1024, "application/x-executable")

      expect(schema.parse(goodFile)).toBe(goodFile)
      expect(() => schema.parse(virusFile)).toThrow("File name must not match pattern")
      expect(() => schema.parse(malwareFile)).toThrow("File name must not match pattern")
      expect(() => schema.parse(exeFile)).toThrow("File name must not match pattern")
    })
  })

  describe("file category validation", () => {
    it("should validate image files only", () => {
      const schema = file({ imageOnly: true })
      const imageFile = createMockFile("photo.jpg", 1024, "image/jpeg")
      const textFile = createMockFile("document.txt", 1024, "text/plain")

      expect(schema.parse(imageFile)).toBe(imageFile)
      expect(() => schema.parse(textFile)).toThrow("Only image files are allowed")
    })

    it("should validate document files only", () => {
      const schema = file({ documentOnly: true })
      const pdfFile = createMockFile("document.pdf", 1024, "application/pdf")
      const imageFile = createMockFile("photo.jpg", 1024, "image/jpeg")

      expect(schema.parse(pdfFile)).toBe(pdfFile)
      expect(() => schema.parse(imageFile)).toThrow("Only document files are allowed")
    })

    it("should validate video files only", () => {
      const schema = file({ videoOnly: true })
      const videoFile = createMockFile("movie.mp4", 1024, "video/mp4")
      const audioFile = createMockFile("song.mp3", 1024, "audio/mpeg")

      expect(schema.parse(videoFile)).toBe(videoFile)
      expect(() => schema.parse(audioFile)).toThrow("Only video files are allowed")
    })

    it("should validate audio files only", () => {
      const schema = file({ audioOnly: true })
      const audioFile = createMockFile("song.mp3", 1024, "audio/mpeg")
      const videoFile = createMockFile("movie.mp4", 1024, "video/mp4")

      expect(schema.parse(audioFile)).toBe(audioFile)
      expect(() => schema.parse(videoFile)).toThrow("Only audio files are allowed")
    })

    it("should validate archive files only", () => {
      const schema = file({ archiveOnly: true })
      const zipFile = createMockFile("archive.zip", 1024, "application/zip")
      const textFile = createMockFile("document.txt", 1024, "text/plain")

      expect(schema.parse(zipFile)).toBe(zipFile)
      expect(() => schema.parse(textFile)).toThrow("Only archive files are allowed")
    })
  })

  describe("transform functionality", () => {
    it("should apply transform function", () => {
      const schema = file({
        transform: (file) => {
          return new File([file], file.name.toLowerCase(), { type: file.type })
        }
      })
      const originalFile = createMockFile("TEST.TXT", 1024, "text/plain")
      const result = schema.parse(originalFile)

      expect(result.name).toBe("test.txt")
      expect(result.type).toBe("text/plain")
    })
  })

  describe("default value functionality", () => {
    it("should use defaultValue for empty input when required", () => {
      const defaultFile = createMockFile("default.txt", 1024, "text/plain")
      const schema = file({ defaultValue: defaultFile })

      expect(schema.parse("")).toBe(defaultFile)
      expect(schema.parse(null)).toBe(defaultFile)
      expect(schema.parse(undefined)).toBe(defaultFile)
    })

    it("should use defaultValue for empty input when not required", () => {
      const defaultFile = createMockFile("default.txt", 1024, "text/plain")
      const schema = file({ required: false, defaultValue: defaultFile })

      expect(schema.parse("")).toBe(defaultFile)
      expect(schema.parse(null)).toBe(defaultFile)
      expect(schema.parse(undefined)).toBe(defaultFile)
    })
  })

  describe("custom i18n messages", () => {
    it("should use custom messages when provided", () => {
      const schema = file({
        maxSize: 1024,
        extension: [".pdf"],
        imageOnly: true,
        i18n: {
          en: {
            required: "Custom required message",
            maxSize: "Custom size message: ${maxSize}",
            extension: "Custom extension message: ${extension}",
            imageOnly: "Custom image only message",
          },
          "zh-TW": {
            required: "客製化必填訊息",
            maxSize: "客製化大小訊息: ${maxSize}",
            extension: "客製化副檔名訊息: ${extension}",
            imageOnly: "客製化僅限圖片訊息",
          },
        },
      })

      const largeFile = createMockFile("large.txt", 2048, "text/plain")
      const wrongExtFile = createMockFile("test.txt", 512, "text/plain")
      const nonImageFile = createMockFile("test.pdf", 512, "application/pdf")

      expect(() => schema.parse("")).toThrow("Custom required message")
      expect(() => schema.parse(largeFile)).toThrow("Custom size message: 1 KB")
      expect(() => schema.parse(wrongExtFile)).toThrow("Custom extension message: .pdf")
      expect(() => schema.parse(nonImageFile)).toThrow("Custom image only message")
    })

    it("should fallback to default messages when custom not provided", () => {
      const schema = file({
        videoOnly: true,
        i18n: {
          en: {
            required: "Custom required message",
          },
          "zh-TW": {
            required: "客製化必填訊息",
          },
        },
      })

      const nonVideoFile = createMockFile("document.pdf", 1024, "application/pdf")

      expect(() => schema.parse("")).toThrow("Custom required message")
      expect(() => schema.parse(nonVideoFile)).toThrow("Only video files are allowed")
    })

    it("should use correct locale for custom messages", () => {
      setLocale("en")
      const schemaEn = file({
        imageOnly: true,
        i18n: {
          en: {
            imageOnly: "English image message",
          },
          "zh-TW": {
            imageOnly: "繁體中文圖片訊息",
          },
        },
      })
      const nonImageFile = createMockFile("document.pdf", 1024, "application/pdf")
      expect(() => schemaEn.parse(nonImageFile)).toThrow("English image message")

      setLocale("zh-TW")
      const schemaZh = file({
        imageOnly: true,
        i18n: {
          en: {
            imageOnly: "English image message",
          },
          "zh-TW": {
            imageOnly: "繁體中文圖片訊息",
          },
        },
      })
      expect(() => schemaZh.parse(nonImageFile)).toThrow("繁體中文圖片訊息")
    })
  })

  describe("complex scenarios", () => {
    it("should work with multiple validations", () => {
      const schema = file({
        maxSize: 5 * 1024 * 1024, // 5MB
        minSize: 1024, // 1KB
        extension: [".jpg", ".png", ".pdf"],
        namePattern: /^[a-zA-Z0-9_-]+\.(jpg|png|pdf)$/,
        nameBlacklist: [/temp/i, /test/],
      })

      const validFile = createMockFile("document_2023.pdf", 2048, "application/pdf")
      const tooSmallFile = createMockFile("tiny.jpg", 512, "image/jpeg")
      const tooLargeFile = createMockFile("huge.png", 10 * 1024 * 1024, "image/png")
      const wrongExtFile = createMockFile("document.txt", 2048, "text/plain")
      const invalidNameFile = createMockFile("temp_file.pdf", 2048, "application/pdf")

      expect(schema.parse(validFile)).toBe(validFile)
      expect(() => schema.parse(tooSmallFile)).toThrow("File size must be at least 1 KB")
      expect(() => schema.parse(tooLargeFile)).toThrow("File size must not exceed 5 MB")
      expect(() => schema.parse(wrongExtFile)).toThrow("File extension must be one of: .jpg, .png, .pdf")
      expect(() => schema.parse(invalidNameFile)).toThrow("File name must not match pattern")
    })

    it("should handle null values correctly when not required", () => {
      const schema = file({
        required: false,
        maxSize: 1024,
        extension: [".txt"],
      })

      expect(schema.parse(null)).toBe(null)
      expect(schema.parse("")).toBe(null)
      expect(schema.parse(undefined)).toBe(null)

      const validFile = createMockFile("test.txt", 512, "text/plain")
      expect(schema.parse(validFile)).toBe(validFile)
    })

    it("should work with transform and all validations together", () => {
      const schema = file({
        maxSize: 2048,
        extension: [".txt"],
        namePattern: /^[a-z0-9_-]+\.txt$/,
        transform: (file) => {
          return new File([file], file.name.toLowerCase(), { type: file.type })
        },
      })

      const upperCaseFile = createMockFile("TEST_FILE.TXT", 1024, "text/plain")
      const result = schema.parse(upperCaseFile)

      expect(result.name).toBe("test_file.txt")
      expect(result.type).toBe("text/plain")
    })

    it("should validate predefined file categories with specific types", () => {
      const imageSchema = file({ imageOnly: true, extension: [".jpg", ".png"] })
      const jpegFile = createMockFile("photo.jpg", 1024, "image/jpeg")
      const pngFile = createMockFile("image.png", 1024, "image/png")
      const gifFile = createMockFile("animated.gif", 1024, "image/gif") // Valid image type but wrong extension

      expect(imageSchema.parse(jpegFile)).toBe(jpegFile)
      expect(imageSchema.parse(pngFile)).toBe(pngFile)
      expect(() => imageSchema.parse(gifFile)).toThrow("File extension must be one of: .jpg, .png")
    })
  })

  describe("edge cases", () => {
    it("should handle files without extensions", () => {
      const schema = file({ extension: [".txt"] })
      const noExtFile = createMockFile("README", 1024, "text/plain")

      expect(() => schema.parse(noExtFile)).toThrow("File extension must be one of: .txt")
    })

    it("should handle empty file names", () => {
      const schema = file({ namePattern: /^.+$/ }) // Must have at least one character
      const emptyNameFile = createMockFile("", 1024, "text/plain")

      expect(() => schema.parse(emptyNameFile)).toThrow("File name must match pattern")
    })

    it("should handle zero-sized files", () => {
      const schema = file({ minSize: 1 })
      const emptyFile = createMockFile("empty.txt", 0, "text/plain")

      expect(() => schema.parse(emptyFile)).toThrow("File size must be at least 1 B")
    })

    it("should format file sizes correctly", () => {
      const smallSchema = file({ maxSize: 1024 })
      const mediumSchema = file({ maxSize: 1024 * 1024 })
      const largeSchema = file({ maxSize: 1024 * 1024 * 1024 })

      const tooLargeSmall = createMockFile("file.txt", 2048, "text/plain")
      const tooLargeMedium = createMockFile("file.txt", 2 * 1024 * 1024, "text/plain")
      const tooLargeLarge = createMockFile("file.txt", 2 * 1024 * 1024 * 1024, "text/plain")

      expect(() => smallSchema.parse(tooLargeSmall)).toThrow("File size must not exceed 1 KB")
      expect(() => mediumSchema.parse(tooLargeMedium)).toThrow("File size must not exceed 1 MB")
      expect(() => largeSchema.parse(tooLargeLarge)).toThrow("File size must not exceed 1 GB")
    })
  })
})