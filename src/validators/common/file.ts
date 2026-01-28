/**
 * @fileoverview File validator for Zod Kit
 *
 * Provides comprehensive file validation with MIME type filtering, size validation,
 * extension validation, and extensive customization options.
 *
 * @author Ong Hoe Yuan
 * @version 0.0.5
 */

import { z, ZodType } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

/**
 * Type definition for file validation error messages
 *
 * @interface FileMessages
 * @property {string} [required] - Message when field is required but empty
 * @property {string} [invalid] - Message when file format is invalid
 * @property {string} [size] - Message when file size exceeds limit
 * @property {string} [minSize] - Message when file size is too small
 * @property {string} [maxSize] - Message when file size exceeds maximum
 * @property {string} [type] - Message when file type is not allowed
 * @property {string} [extension] - Message when file extension is not allowed
 * @property {string} [extensionBlacklist] - Message when file extension is blacklisted
 * @property {string} [name] - Message when file name doesn't match pattern
 * @property {string} [nameBlacklist] - Message when file name matches blacklisted pattern
 * @property {string} [imageOnly] - Message when only image files are allowed
 * @property {string} [documentOnly] - Message when only document files are allowed
 * @property {string} [videoOnly] - Message when only video files are allowed
 * @property {string} [audioOnly] - Message when only audio files are allowed
 * @property {string} [archiveOnly] - Message when only archive files are allowed
 */
export type FileMessages = {
  required?: string
  invalid?: string
  size?: string
  minSize?: string
  maxSize?: string
  type?: string
  extension?: string
  extensionBlacklist?: string
  name?: string
  nameBlacklist?: string
  imageOnly?: string
  documentOnly?: string
  videoOnly?: string
  audioOnly?: string
  archiveOnly?: string
}

/**
 * Configuration options for file validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 *
 * @interface FileOptions
 * @property {IsRequired} [required=true] - Whether the field is required
 * @property {number} [maxSize] - Maximum file size in bytes
 * @property {number} [minSize] - Minimum file size in bytes
 * @property {string | string[]} [type] - Allowed MIME type(s)
 * @property {string[]} [typeBlacklist] - MIME types that are not allowed
 * @property {string | string[]} [extension] - Allowed file extension(s)
 * @property {string[]} [extensionBlacklist] - File extensions that are not allowed
 * @property {RegExp | string} [namePattern] - Pattern that file name must match
 * @property {RegExp | string | Array<RegExp | string>} [nameBlacklist] - Pattern(s) that file name must not match
 * @property {boolean} [imageOnly=false] - If true, only allow image files
 * @property {boolean} [documentOnly=false] - If true, only allow document files
 * @property {boolean} [videoOnly=false] - If true, only allow video files
 * @property {boolean} [audioOnly=false] - If true, only allow audio files
 * @property {boolean} [archiveOnly=false] - If true, only allow archive files
 * @property {boolean} [caseSensitive=false] - Whether extension matching is case-sensitive
 * @property {Function} [transform] - Custom transformation function for File objects
 * @property {File | null} [defaultValue] - Default value when input is empty
 * @property {Record<Locale, FileMessages>} [i18n] - Custom error messages for different locales
 */
export type FileOptions<IsRequired extends boolean = true> = {
  maxSize?: number
  minSize?: number
  type?: string | string[]
  typeBlacklist?: string[]
  extension?: string | string[]
  extensionBlacklist?: string[]
  namePattern?: RegExp | string
  nameBlacklist?: RegExp | string | Array<RegExp | string>
  imageOnly?: boolean
  documentOnly?: boolean
  videoOnly?: boolean
  audioOnly?: boolean
  archiveOnly?: boolean
  caseSensitive?: boolean
  transform?: (value: File) => File
  defaultValue?: IsRequired extends true ? File : File | null
  i18n?: Record<Locale, FileMessages>
}

/**
 * Type alias for file validation schema based on required flag
 *
 * @template IsRequired - Whether the field is required
 * @description Returns ZodType with proper input/output types based on required flag
 */
export type FileSchema<IsRequired extends boolean> = IsRequired extends true ? ZodType<File, File | null> : ZodType<File | null, File | null>

/**
 * Creates a Zod schema for file validation with comprehensive filtering options
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @param {IsRequired} [required=false] - Whether the field is required
 * @param {Omit<FileOptions<IsRequired>, 'required'>} [options] - Configuration options for validation
 * @returns {FileSchema<IsRequired>} Zod schema for file validation
 *
 * @description
 * Creates a comprehensive file validator with MIME type filtering, size validation,
 * extension validation, and extensive customization options.
 *
 * Features:
 * - File size validation (min/max)
 * - MIME type whitelist/blacklist support
 * - File extension whitelist/blacklist support
 * - File name pattern validation
 * - Predefined file category filters (image, document, video, audio, archive)
 * - Case-sensitive/insensitive extension matching
 * - Custom transformation functions
 * - Comprehensive internationalization
 *
 * @example
 * ```typescript
 * // Basic file validation
 * const basicSchema = file() // optional by default
 * basicSchema.parse(new File(["content"], "test.txt"))
 * basicSchema.parse(null) // ✓ Valid (optional)
 *
 * // Required validation
 * const requiredSchema = parse(new File(["content"], "test.txt"))
(true)
 * requiredSchema.parse(null) // ✗ Invalid (required)
 *
 *
 * // Size restrictions
 * const sizeSchema = file(false, {
 *   maxSize: 1024 * 1024, // 1MB
 *   minSize: 1024 // 1KB
 * })
 *
 * // Extension restrictions
 * const imageSchema = file(false, {
 *   extension: [".jpg", ".png", ".gif"],
 *   maxSize: 5 * 1024 * 1024 // 5MB
 * })
 *
 * // MIME type restrictions
 * const documentSchema = file(false, {
 *   type: ["application/pdf", "application/msword"],
 *   maxSize: 10 * 1024 * 1024 // 10MB
 * })
 *
 * // Image files only
 * const imageOnlySchema = file(false, { imageOnly: true })
 *
 * // Document files only
 * const docOnlySchema = file(false, { documentOnly: true })
 *
 * // Name pattern validation
 * const patternSchema = file(false, {
 *   namePattern: /^[a-zA-Z0-9_-]+\.(pdf|doc|docx)$/,
 *   maxSize: 5 * 1024 * 1024
 * })
 *
 * // Optional with default
 * const optionalSchema = file(false, {
 *   defaultValue: null
 * })
 * ```
 *
 * @throws {z.ZodError} When validation fails with specific error messages
 * @see {@link FileOptions} for all available configuration options
 */
export function file<IsRequired extends boolean = false>(required?: IsRequired, options?: Omit<FileOptions<IsRequired>, "required">): FileSchema<IsRequired> {
  const {
    maxSize,
    minSize,
    type,
    typeBlacklist,
    extension,
    extensionBlacklist,
    namePattern,
    nameBlacklist,
    imageOnly = false,
    documentOnly = false,
    videoOnly = false,
    audioOnly = false,
    archiveOnly = false,
    caseSensitive = false,
    transform,
    defaultValue,
    i18n,
  } = options ?? {}

  const isRequired = required ?? (false as IsRequired)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof FileMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`common.file.${key}`, params)
  }

  // Predefined file type categories
  const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/bmp", "image/tiff"]
  const documentTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
  ]
  const videoTypes = ["video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo", "video/x-ms-wmv", "video/webm", "video/ogg"]
  const audioTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/aac", "audio/webm", "audio/mp3", "audio/x-wav"]
  const archiveTypes = ["application/zip", "application/x-rar-compressed", "application/x-7z-compressed", "application/x-tar", "application/gzip"]

  const actualDefaultValue = defaultValue ?? null

  // Create properly typed base schema for File | null
  const fileOrNullSchema = z.union([z.instanceof(File), z.null()])

  const baseSchema = z.preprocess((val): File | null => {
    if (val === "" || val === null || val === undefined) {
      return actualDefaultValue
    }

    if (!(val instanceof File)) {
      return val as File | null
    }

    let processed = val

    if (transform) {
      processed = transform(processed)
    }

    return processed
  }, fileOrNullSchema)

  const schema = baseSchema
    .refine((val) => !isRequired || val !== null, {
      message: getMessage("required"),
    })
    .refine((val) => val === null || val instanceof File, {
      message: getMessage("invalid"),
    })
    .refine((val) => val === null || minSize === undefined || val.size >= minSize, {
      message: getMessage("minSize", { minSize: formatFileSize(minSize || 0) }),
    })
    .refine((val) => val === null || maxSize === undefined || val.size <= maxSize, {
      message: getMessage("maxSize", { maxSize: formatFileSize(maxSize || 0) }),
    })
    .refine((val) => val === null || !imageOnly || imageTypes.includes(val.type), {
      message: getMessage("imageOnly"),
    })
    .refine((val) => val === null || !documentOnly || documentTypes.includes(val.type), {
      message: getMessage("documentOnly"),
    })
    .refine((val) => val === null || !videoOnly || videoTypes.includes(val.type), {
      message: getMessage("videoOnly"),
    })
    .refine((val) => val === null || !audioOnly || audioTypes.includes(val.type), {
      message: getMessage("audioOnly"),
    })
    .refine((val) => val === null || !archiveOnly || archiveTypes.includes(val.type), {
      message: getMessage("archiveOnly"),
    })
    .refine(
      (val) => {
        if (val === null || !typeBlacklist || typeBlacklist.length === 0) return true
        return !typeBlacklist.includes(val.type)
      },
      {
        message: getMessage("type", { type: typeBlacklist?.join(", ") || "" }),
      }
    )
    .refine(
      (val) => {
        if (val === null || type === undefined) return true
        const allowedTypes = Array.isArray(type) ? type : [type]
        return allowedTypes.includes(val.type)
      },
      {
        message: getMessage("type", { type: Array.isArray(type) ? type.join(", ") : type || "" }),
      }
    )
    .refine(
      (val) => {
        if (val === null || extensionBlacklist === undefined || extensionBlacklist.length === 0) return true
        const fileExtension = getFileExtension(val.name, caseSensitive)
        const normalizedBlacklist = extensionBlacklist.map((ext) => normalizeExtension(ext, caseSensitive))
        return !normalizedBlacklist.includes(fileExtension)
      },
      {
        message: getMessage("extensionBlacklist", { extension: extensionBlacklist?.join(", ") || "" }),
      }
    )
    .refine(
      (val) => {
        if (val === null || extension === undefined) return true
        const fileName = val.name
        const fileExtension = getFileExtension(fileName, caseSensitive)
        const allowedExtensions = Array.isArray(extension) ? extension : [extension]
        const normalizedExtensions = allowedExtensions.map((ext) => normalizeExtension(ext, caseSensitive))
        return normalizedExtensions.includes(fileExtension)
      },
      {
        message: getMessage("extension", { extension: Array.isArray(extension) ? extension.join(", ") : extension || "" }),
      }
    )
    .refine(
      (val) => {
        if (val === null || namePattern === undefined) return true
        const pattern = typeof namePattern === "string" ? new RegExp(namePattern) : namePattern
        return pattern.test(val.name)
      },
      {
        message: getMessage("name", { pattern: namePattern?.toString() || "" }),
      }
    )
    .refine(
      (val) => {
        if (val === null || nameBlacklist === undefined) return true
        const blacklistPatterns = Array.isArray(nameBlacklist) ? nameBlacklist : [nameBlacklist]
        for (const blacklistPattern of blacklistPatterns) {
          const pattern = typeof blacklistPattern === "string" ? new RegExp(blacklistPattern) : blacklistPattern
          if (pattern.test(val.name)) {
            return false
          }
        }
        return true
      },
      {
        message: getMessage("nameBlacklist", { pattern: "" }),
      }
    )

  return schema as unknown as FileSchema<IsRequired>
}

/**
 * Helper function to get file extension
 */
function getFileExtension(fileName: string, caseSensitive: boolean): string {
  const lastDotIndex = fileName.lastIndexOf(".")
  if (lastDotIndex === -1) return ""

  const extension = fileName.substring(lastDotIndex)
  return caseSensitive ? extension : extension.toLowerCase()
}

/**
 * Helper function to normalize extension for comparison
 */
function normalizeExtension(extension: string, caseSensitive: boolean): string {
  const normalized = extension.startsWith(".") ? extension : `.${extension}`
  return caseSensitive ? normalized : normalized.toLowerCase()
}

/**
 * Helper function to format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"]
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${Math.round(size * 100) / 100} ${units[unitIndex]}`
}
