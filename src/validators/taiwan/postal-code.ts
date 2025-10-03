/**
 * @fileoverview Taiwan Postal Code validator for Zod Kit
 *
 * Provides comprehensive validation for Taiwan postal codes with support for
 * 3-digit, 5-digit (legacy), and 6-digit (current) formats based on official
 * Chunghwa Post specifications.
 *
 * @author Ong Hoe Yuan
 * @version 0.0.5
 */

import { z, ZodNullable, ZodString } from "zod"
import { t } from "../../i18n"
import { getLocale, type Locale } from "../../config"

/**
 * Type definition for postal code validation error messages
 *
 * @interface PostalCodeMessages
 * @property {string} [required] - Message when field is required but empty
 * @property {string} [invalid] - Message when postal code format is invalid
 * @property {string} [invalidFormat] - Message when format doesn't match expected pattern
 * @property {string} [invalidRange] - Message when postal code is outside valid range
 * @property {string} [legacy5DigitWarning] - Warning message for 5-digit legacy format
 * @property {string} [format3Only] - Message when only 3-digit format is allowed
 * @property {string} [format5Only] - Message when only 5-digit format is allowed
 * @property {string} [format6Only] - Message when only 6-digit format is allowed
 */
export type PostalCodeMessages = {
  required?: string
  invalid?: string
  invalidFormat?: string
  invalidRange?: string
  legacy5DigitWarning?: string
  format3Only?: string
  format5Only?: string
  format6Only?: string
  invalidSuffix?: string
  deprecated5Digit?: string
}

/**
 * Postal code format types supported in Taiwan
 *
 * @typedef {"3" | "5" | "6" | "3+5" | "3+6" | "5+6" | "all"} PostalCodeFormat
 *
 * Available formats:
 * - "3": 3-digit basic postal codes (100-982)
 * - "5": 5-digit postal codes (3+2 format, legacy)
 * - "6": 6-digit postal codes (3+3 format, current standard)
 * - "3+5": Accept both 3-digit and 5-digit formats
 * - "3+6": Accept both 3-digit and 6-digit formats (recommended)
 * - "5+6": Accept both 5-digit and 6-digit formats
 * - "all": Accept all formats (3, 5, and 6 digits)
 */
export type PostalCodeFormat =
  | "3" // 3-digit only
  | "5" // 5-digit only (legacy)
  | "6" // 6-digit only (current)
  | "3+5" // 3-digit or 5-digit
  | "3+6" // 3-digit or 6-digit (recommended)
  | "5+6" // 5-digit or 6-digit
  | "all" // All formats accepted

/**
 * Configuration options for Taiwan postal code validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 *
 * @interface PostalCodeOptions
 * @property {IsRequired} [required=true] - Whether the field is required
 * @property {PostalCodeFormat} [format="3+6"] - Which postal code formats to accept
 * @property {boolean} [strictValidation=true] - Enable strict validation against known postal code ranges
 * @property {boolean} [allowDashes=true] - Whether to allow dashes in postal codes (e.g., "100-01" or "100-001")
 * @property {boolean} [warn5Digit=true] - Whether to show warning for 5-digit legacy format
 * @property {string[]} [allowedPrefixes] - Specific 3-digit prefixes to allow (if strictValidation is true)
 * @property {string[]} [blockedPrefixes] - Specific 3-digit prefixes to block
 * @property {Function} [transform] - Custom transformation function for postal codes
 * @property {string | null} [defaultValue] - Default value when input is empty
 * @property {Record<Locale, PostalCodeMessages>} [i18n] - Custom error messages for different locales
 */
export type PostalCodeOptions<IsRequired extends boolean = true> = {
  format?: PostalCodeFormat
  strictValidation?: boolean
  allowDashes?: boolean
  warn5Digit?: boolean
  allowedPrefixes?: string[]
  blockedPrefixes?: string[]
  transform?: (value: string) => string
  defaultValue?: IsRequired extends true ? string : string | null
  i18n?: Record<Locale, PostalCodeMessages>
  strictSuffixValidation?: boolean
  deprecate5Digit?: boolean
}

/**
 * Type alias for postal code validation schema based on required flag
 *
 * @template IsRequired - Whether the field is required
 * @typedef PostalCodeSchema
 * @description Returns ZodString if required, ZodNullable<ZodString> if optional
 */
export type PostalCodeSchema<IsRequired extends boolean> = IsRequired extends true ? ZodString : ZodNullable<ZodString>

/**
 * Valid 3-digit postal code prefixes for Taiwan
 * Based on official Chunghwa Post data (2024)
 */
const VALID_3_DIGIT_PREFIXES = [
  // Taipei City (台北市) - 100-116
  "100",
  "103",
  "104",
  "105",
  "106",
  "108",
  "110",
  "111",
  "112",
  "114",
  "115",
  "116",

  // New Taipei City (新北市) - 200-253
  "200",
  "201",
  "202",
  "203",
  "204",
  "205",
  "206",
  "207",
  "208",
  "220",
  "221",
  "222",
  "223",
  "224",
  "226",
  "227",
  "228",
  "231",
  "232",
  "233",
  "234",
  "235",
  "236",
  "237",
  "238",
  "239",
  "241",
  "242",
  "243",
  "244",
  "247",
  "248",
  "249",
  "251",
  "252",
  "253",

  // Keelung City (基隆市) - 200-206
  "200",
  "201",
  "202",
  "203",
  "204",
  "205",
  "206",

  // Taoyuan City (桃園市) - 300-338
  "300",
  "302",
  "303",
  "304",
  "305",
  "306",
  "307",
  "308",
  "310",
  "311",
  "312",
  "313",
  "314",
  "315",
  "316",
  "317",
  "318",
  "320",
  "324",
  "325",
  "326",
  "327",
  "328",
  "330",
  "333",
  "334",
  "335",
  "336",
  "337",
  "338",

  // Hsinchu County (新竹縣) - 300-315
  "300",
  "302",
  "303",
  "304",
  "305",
  "306",
  "307",
  "308",
  "310",
  "311",
  "312",
  "313",
  "314",
  "315",

  // Hsinchu City (新竹市) - 300
  "300",

  // Miaoli County (苗栗縣) - 350-369
  "350",
  "351",
  "352",
  "353",
  "354",
  "356",
  "357",
  "358",
  "360",
  "361",
  "362",
  "363",
  "364",
  "365",
  "366",
  "367",
  "368",
  "369",

  // Taichung City (台中市) - 400-439
  "400",
  "401",
  "402",
  "403",
  "404",
  "406",
  "407",
  "408",
  "411",
  "412",
  "413",
  "414",
  "420",
  "421",
  "422",
  "423",
  "424",
  "426",
  "427",
  "428",
  "429",
  "432",
  "433",
  "434",
  "435",
  "436",
  "437",
  "438",
  "439",

  // Changhua County (彰化縣) - 500-530
  "500",
  "502",
  "503",
  "504",
  "505",
  "506",
  "507",
  "508",
  "509",
  "510",
  "511",
  "512",
  "513",
  "514",
  "515",
  "516",
  "520",
  "521",
  "522",
  "523",
  "524",
  "525",
  "526",
  "527",
  "528",
  "530",

  // Nantou County (南投縣) - 540-558
  "540",
  "541",
  "542",
  "544",
  "545",
  "546",
  "551",
  "552",
  "553",
  "555",
  "556",
  "557",
  "558",

  // Yunlin County (雲林縣) - 630-655
  "630",
  "631",
  "632",
  "633",
  "634",
  "635",
  "636",
  "637",
  "638",
  "640",
  "643",
  "646",
  "647",
  "648",
  "649",
  "651",
  "652",
  "653",
  "654",
  "655",

  // Chiayi County (嘉義縣) - 600-625
  "600",
  "602",
  "603",
  "604",
  "605",
  "606",
  "607",
  "608",
  "611",
  "612",
  "613",
  "614",
  "615",
  "616",
  "621",
  "622",
  "623",
  "624",
  "625",

  // Chiayi City (嘉義市) - 600
  "600",

  // Tainan City (台南市) - 700-745
  "700",
  "701",
  "702",
  "704",
  "708",
  "709",
  "710",
  "711",
  "712",
  "713",
  "714",
  "715",
  "716",
  "717",
  "718",
  "719",
  "720",
  "721",
  "722",
  "723",
  "724",
  "725",
  "726",
  "727",
  "730",
  "731",
  "732",
  "733",
  "734",
  "735",
  "736",
  "737",
  "741",
  "742",
  "743",
  "744",
  "745",

  // Kaohsiung City (高雄市) - 800-852
  "800",
  "801",
  "802",
  "803",
  "804",
  "805",
  "806",
  "807",
  "811",
  "812",
  "813",
  "814",
  "815",
  "820",
  "821",
  "822",
  "823",
  "824",
  "825",
  "826",
  "827",
  "828",
  "829",
  "830",
  "831",
  "832",
  "833",
  "840",
  "842",
  "843",
  "844",
  "845",
  "846",
  "847",
  "848",
  "849",
  "851",
  "852",

  // Pingtung County (屏東縣) - 900-947
  "900",
  "901",
  "902",
  "903",
  "904",
  "905",
  "906",
  "907",
  "908",
  "909",
  "911",
  "912",
  "913",
  "920",
  "921",
  "922",
  "923",
  "924",
  "925",
  "926",
  "927",
  "928",
  "929",
  "931",
  "932",
  "940",
  "941",
  "942",
  "943",
  "944",
  "945",
  "946",
  "947",

  // Yilan County (宜蘭縣) - 260-269
  "260",
  "261",
  "262",
  "263",
  "264",
  "265",
  "266",
  "267",
  "268",
  "269",

  // Hualien County (花蓮縣) - 970-983
  "970",
  "971",
  "972",
  "973",
  "974",
  "975",
  "976",
  "977",
  "978",
  "979",
  "981",
  "982",
  "983",

  // Taitung County (台東縣) - 950-966
  "950",
  "951",
  "952",
  "953",
  "954",
  "955",
  "956",
  "957",
  "958",
  "959",
  "961",
  "962",
  "963",
  "964",
  "965",
  "966",

  // Penghu County (澎湖縣) - 880-885
  "880",
  "881",
  "882",
  "883",
  "884",
  "885",

  // Kinmen County (金門縣) - 890-896
  "890",
  "891",
  "892",
  "893",
  "894",
  "895",
  "896",

  // Lienchiang County (連江縣/馬祖) - 209-212
  "209",
  "210",
  "211",
  "212",
]

/**
 * Detailed postal code range mappings for specific validation
 * Based on Taiwan postal system structure and known patterns
 *
 * Structure:
 * - 5-digit codes: Generally use 01-99 for delivery segments
 * - 6-digit codes: Use 001-999 for more precise delivery segments
 * - Some areas may have restricted ranges based on actual usage
 */
const POSTAL_CODE_RANGES: Record<string, { range5: [number, number]; range6: [number, number] }> = {
  // Major cities with extensive postal networks
  "100": { range5: [1, 99], range6: [1, 999] }, // Taipei City - Zhongzheng
  "103": { range5: [1, 99], range6: [1, 999] }, // Taipei City - Datong
  "104": { range5: [1, 99], range6: [1, 999] }, // Taipei City - Zhongshan
  "105": { range5: [1, 99], range6: [1, 999] }, // Taipei City - Songshan
  "106": { range5: [1, 99], range6: [1, 999] }, // Taipei City - Da'an
  "108": { range5: [1, 99], range6: [1, 999] }, // Taipei City - Wanhua
  "110": { range5: [1, 99], range6: [1, 999] }, // Taipei City - Xinyi
  "111": { range5: [1, 99], range6: [1, 999] }, // Taipei City - Shilin
  "112": { range5: [1, 99], range6: [1, 999] }, // Taipei City - Beitou
  "114": { range5: [1, 99], range6: [1, 999] }, // Taipei City - Neihu
  "115": { range5: [1, 99], range6: [1, 999] }, // Taipei City - Nangang
  "116": { range5: [1, 99], range6: [1, 999] }, // Taipei City - Wenshan

  // New Taipei City major areas
  "220": { range5: [1, 99], range6: [1, 999] }, // Banqiao
  "221": { range5: [1, 99], range6: [1, 999] }, // Xizhi
  "222": { range5: [1, 99], range6: [1, 999] }, // Shenkeng
  "223": { range5: [1, 99], range6: [1, 999] }, // Shiding
  "224": { range5: [1, 99], range6: [1, 999] }, // Ruifang

  // Taoyuan City
  "320": { range5: [1, 99], range6: [1, 999] }, // Zhongli
  "324": { range5: [1, 99], range6: [1, 999] }, // Pingzhen
  "330": { range5: [1, 99], range6: [1, 999] }, // Taoyuan

  // Taichung City
  "400": { range5: [1, 99], range6: [1, 999] }, // Central District
  "401": { range5: [1, 99], range6: [1, 999] }, // East District
  "402": { range5: [1, 99], range6: [1, 999] }, // South District
  "403": { range5: [1, 99], range6: [1, 999] }, // West District
  "404": { range5: [1, 99], range6: [1, 999] }, // North District

  // Tainan City
  "700": { range5: [1, 99], range6: [1, 999] }, // Central District
  "701": { range5: [1, 99], range6: [1, 999] }, // East District
  "702": { range5: [1, 99], range6: [1, 999] }, // South District

  // Kaohsiung City
  "800": { range5: [1, 99], range6: [1, 999] }, // Xinxing
  "801": { range5: [1, 99], range6: [1, 999] }, // Qianjin
  "802": { range5: [1, 99], range6: [1, 999] }, // Lingya
  "803": { range5: [1, 99], range6: [1, 999] }, // Yancheng

  // Smaller areas with more limited ranges
  "880": { range5: [1, 50], range6: [1, 500] }, // Penghu (smaller population)
  "890": { range5: [1, 30], range6: [1, 300] }, // Kinmen (smaller population)
  "209": { range5: [1, 20], range6: [1, 200] }, // Lienchiang/Matsu (smallest population)
}

/**
 * Get valid suffix ranges for a given prefix
 * Returns default ranges if specific mapping not found
 */
const getPostalCodeRanges = (prefix: string): { range5: [number, number]; range6: [number, number] } => {
  return (
    POSTAL_CODE_RANGES[prefix] || {
      range5: [1, 99], // Default range for 5-digit
      range6: [1, 999], // Default range for 6-digit
    }
  )
}

/**
 * Validates 3-digit Taiwan postal code
 *
 * @param {string} value - The 3-digit postal code to validate
 * @param {boolean} strictValidation - Whether to validate against known postal code list
 * @param {string[]} allowedPrefixes - Specific prefixes to allow (overrides strictValidation)
 * @param {string[]} blockedPrefixes - Specific prefixes to block
 * @returns {boolean} True if the postal code is valid
 */
const validate3DigitPostalCode = (value: string, strictValidation: boolean = true, allowedPrefixes?: string[], blockedPrefixes?: string[]): boolean => {
  // Basic format check
  if (!/^\d{3}$/.test(value)) {
    return false
  }

  // Check blocked prefixes first
  if (blockedPrefixes && blockedPrefixes.includes(value)) {
    return false
  }

  // Check allowed prefixes (overrides strict validation)
  if (allowedPrefixes) {
    return allowedPrefixes.includes(value)
  }

  // Strict validation against known postal codes
  if (strictValidation) {
    return VALID_3_DIGIT_PREFIXES.includes(value)
  }

  // Basic range check (100-999)
  const num = parseInt(value, 10)
  return num >= 100 && num <= 999
}

/**
 * Validates 5-digit Taiwan postal code (legacy format)
 *
 * @param {string} value - The 5-digit postal code to validate
 * @param {boolean} strictValidation - Whether to validate the 3-digit prefix
 * @param {boolean} strictSuffixValidation - Whether to validate the 2-digit suffix
 * @param {string[]} allowedPrefixes - Specific prefixes to allow
 * @param {string[]} blockedPrefixes - Specific prefixes to block
 * @returns {boolean} True if the postal code is valid
 */
const validate5DigitPostalCode = (value: string, strictValidation: boolean = true, strictSuffixValidation: boolean = false, allowedPrefixes?: string[], blockedPrefixes?: string[]): boolean => {
  // Basic format check
  if (!/^\d{5}$/.test(value)) {
    return false
  }

  const prefix = value.substring(0, 3)
  const suffix = value.substring(3, 5)

  // Validate the 3-digit prefix using the same logic
  if (!validate3DigitPostalCode(prefix, strictValidation, allowedPrefixes, blockedPrefixes)) {
    return false
  }

  // Validate the 2-digit suffix if strict suffix validation is enabled
  if (strictSuffixValidation) {
    const suffixNum = parseInt(suffix, 10)
    const ranges = getPostalCodeRanges(prefix)
    // Use specific range for this prefix, or fall back to general rule
    if (suffixNum < ranges.range5[0] || suffixNum > ranges.range5[1]) {
      return false
    }
  }

  return true
}

/**
 * Validates 6-digit Taiwan postal code (current format)
 *
 * @param {string} value - The 6-digit postal code to validate
 * @param {boolean} strictValidation - Whether to validate the 3-digit prefix
 * @param {boolean} strictSuffixValidation - Whether to validate the 3-digit suffix
 * @param {string[]} allowedPrefixes - Specific prefixes to allow
 * @param {string[]} blockedPrefixes - Specific prefixes to block
 * @returns {boolean} True if the postal code is valid
 */
const validate6DigitPostalCode = (value: string, strictValidation: boolean = true, strictSuffixValidation: boolean = false, allowedPrefixes?: string[], blockedPrefixes?: string[]): boolean => {
  // Basic format check
  if (!/^\d{6}$/.test(value)) {
    return false
  }

  const prefix = value.substring(0, 3)
  const suffix = value.substring(3, 6)

  // Validate the 3-digit prefix using the same logic
  if (!validate3DigitPostalCode(prefix, strictValidation, allowedPrefixes, blockedPrefixes)) {
    return false
  }

  // Validate the 3-digit suffix if strict suffix validation is enabled
  if (strictSuffixValidation) {
    const suffixNum = parseInt(suffix, 10)
    const ranges = getPostalCodeRanges(prefix)
    // Use specific range for this prefix, or fall back to general rule
    if (suffixNum < ranges.range6[0] || suffixNum > ranges.range6[1]) {
      return false
    }
  }

  return true
}

/**
 * Main validation function for Taiwan postal codes
 *
 * @param {string} value - The postal code to validate
 * @param {PostalCodeFormat} format - Which formats to accept
 * @param {boolean} strictValidation - Whether to validate against known postal codes
 * @param {boolean} strictSuffixValidation - Whether to validate suffix ranges
 * @param {boolean} allowDashes - Whether dashes/spaces are allowed and should be removed
 * @param {string[]} allowedPrefixes - Specific prefixes to allow
 * @param {string[]} blockedPrefixes - Specific prefixes to block
 * @returns {boolean} True if the postal code is valid
 */
const validateTaiwanPostalCode = (
  value: string,
  format: PostalCodeFormat = "3+6",
  strictValidation: boolean = true,
  strictSuffixValidation: boolean = false,
  allowDashes: boolean = true,
  allowedPrefixes?: string[],
  blockedPrefixes?: string[]
): boolean => {
  if (!value || typeof value !== "string") {
    return false
  }

  // Only remove dashes and spaces if they are allowed
  const cleanValue = allowDashes ? value.replace(/[-\s]/g, "") : value

  // If dashes are not allowed and the value contains them, it's invalid
  if (!allowDashes && /[-\s]/.test(value)) {
    return false
  }

  switch (format) {
    case "3":
      return cleanValue.length === 3 && validate3DigitPostalCode(cleanValue, strictValidation, allowedPrefixes, blockedPrefixes)

    case "5":
      return cleanValue.length === 5 && validate5DigitPostalCode(cleanValue, strictValidation, strictSuffixValidation, allowedPrefixes, blockedPrefixes)

    case "6":
      return cleanValue.length === 6 && validate6DigitPostalCode(cleanValue, strictValidation, strictSuffixValidation, allowedPrefixes, blockedPrefixes)

    case "3+5":
      return (
        (cleanValue.length === 3 && validate3DigitPostalCode(cleanValue, strictValidation, allowedPrefixes, blockedPrefixes)) ||
        (cleanValue.length === 5 && validate5DigitPostalCode(cleanValue, strictValidation, strictSuffixValidation, allowedPrefixes, blockedPrefixes))
      )

    case "3+6":
      return (
        (cleanValue.length === 3 && validate3DigitPostalCode(cleanValue, strictValidation, allowedPrefixes, blockedPrefixes)) ||
        (cleanValue.length === 6 && validate6DigitPostalCode(cleanValue, strictValidation, strictSuffixValidation, allowedPrefixes, blockedPrefixes))
      )

    case "5+6":
      return (
        (cleanValue.length === 5 && validate5DigitPostalCode(cleanValue, strictValidation, strictSuffixValidation, allowedPrefixes, blockedPrefixes)) ||
        (cleanValue.length === 6 && validate6DigitPostalCode(cleanValue, strictValidation, strictSuffixValidation, allowedPrefixes, blockedPrefixes))
      )

    case "all":
      return (
        (cleanValue.length === 3 && validate3DigitPostalCode(cleanValue, strictValidation, allowedPrefixes, blockedPrefixes)) ||
        (cleanValue.length === 5 && validate5DigitPostalCode(cleanValue, strictValidation, strictSuffixValidation, allowedPrefixes, blockedPrefixes)) ||
        (cleanValue.length === 6 && validate6DigitPostalCode(cleanValue, strictValidation, strictSuffixValidation, allowedPrefixes, blockedPrefixes))
      )

    default:
      return false
  }
}

/**
 * Creates a Zod schema for Taiwan postal code validation
 *
 * @template IsRequired - Whether the field is required (affects return type)
 * @param {PostalCodeOptions<IsRequired>} [options] - Configuration options for postal code validation
 * @returns {PostalCodeSchema<IsRequired>} Zod schema for postal code validation
 *
 * @description
 * Creates a comprehensive Taiwan postal code validator that supports multiple formats
 * and provides extensive configuration options for different validation scenarios.
 *
 * Features:
 * - 3-digit, 5-digit, and 6-digit postal code format support
 * - Strict validation against official postal code ranges
 * - Legacy 5-digit format with optional warnings
 * - Custom prefix allowlist/blocklist support
 * - Dash and space handling in postal codes
 * - Automatic normalization and formatting
 * - Custom transformation functions
 * - Comprehensive internationalization
 * - Optional field support
 *
 * @example
 * ```typescript
 * // Accept 3-digit or 6-digit formats (recommended)
 * const modernSchema = postalCode()
 * modernSchema.parse("100")     // ✓ Valid 3-digit
 * modernSchema.parse("100001")  // ✓ Valid 6-digit
 * modernSchema.parse("10001")   // ✗ Invalid (5-digit not allowed)
 *
 * // Accept all formats
 * const flexibleSchema = postalCode(false, { format: "all" })
 * flexibleSchema.parse("100")     // ✓ Valid
 * flexibleSchema.parse("10001")   // ✓ Valid
 * flexibleSchema.parse("100001")  // ✓ Valid
 *
 * // Only 6-digit format (current standard)
 * const modernOnlySchema = postalCode(false, { format: "6" })
 * modernOnlySchema.parse("100001") // ✓ Valid
 * modernOnlySchema.parse("100")    // ✗ Invalid
 *
 * // With dashes allowed
 * const dashSchema = postalCode(false, { allowDashes: true })
 * dashSchema.parse("100-001")  // ✓ Valid (normalized to "100001")
 * dashSchema.parse("100-01")   // ✓ Valid if 5-digit format allowed
 *
 * // Specific areas only
 * const taipeiSchema = postalCode(false, {
 *   allowedPrefixes: ["100", "103", "104", "105", "106"]
 * })
 * taipeiSchema.parse("100001") // ✓ Valid (Taipei area)
 * taipeiSchema.parse("200001") // ✗ Invalid (not in allowlist)
 *
 * // Block specific areas
 * const blockedSchema = postalCode(false, {
 *   blockedPrefixes: ["999"] // Block test codes
 * })
 *
 * // With warning for legacy format
 * const warnSchema = postalCode(false, {
 *   format: "all",
 *   warn5Digit: true
 * })
 * // Will validate but may show warning for 5-digit codes
 *
 * // Optional with custom transformation
 * const optionalSchema = postalCode(false, {
 *   transform: (value) => value.replace(/\D/g, '') // Remove non-digits
 * })
 *
 * // Strict suffix validation for real postal codes
 * const strictSchema = postalCode(false, {
 *   format: "6",
 *   strictSuffixValidation: true // Validates suffix range 001-999
 * })
 * strictSchema.parse("100001") // ✓ Valid
 * strictSchema.parse("100000") // ✗ Invalid (suffix 000 not allowed)
 *
 * // Deprecate 5-digit codes entirely
 * const modern2024Schema = postalCode(false, {
 *   format: "all",
 *   deprecate5Digit: true // Throws error for any 5-digit code
 * })
 * modern2024Schema.parse("100001") // ✓ Valid 6-digit
 * modern2024Schema.parse("10001")  // ✗ Error: deprecated format
 * ```
 *
 * @throws {z.ZodError} When validation fails with specific error messages
 * @see {@link PostalCodeOptions} for all available configuration options
 * @see {@link PostalCodeFormat} for supported formats
 * @see {@link validateTaiwanPostalCode} for validation logic details
 */
export function postalCode<IsRequired extends boolean = false>(required?: IsRequired, options?: Omit<PostalCodeOptions<IsRequired>, 'required'>): PostalCodeSchema<IsRequired> {
  const {
    format = "3+6",
    strictValidation = true,
    allowDashes = true,
    warn5Digit = true,
    allowedPrefixes,
    blockedPrefixes,
    transform,
    defaultValue,
    i18n,
    strictSuffixValidation = false,
    deprecate5Digit = false,
  } = options ?? {}

  const isRequired = required ?? false as IsRequired

  // Set appropriate default value based on required flag
  const actualDefaultValue = defaultValue ?? (isRequired ? "" : null)

  // Helper function to get custom message or fallback to default i18n
  const getMessage = (key: keyof PostalCodeMessages, params?: Record<string, any>) => {
    if (i18n) {
      const currentLocale = getLocale()
      const customMessages = i18n[currentLocale]
      if (customMessages && customMessages[key]) {
        const template = customMessages[key]!
        return template.replace(/\$\{(\w+)}/g, (_, k) => params?.[k] ?? "")
      }
    }
    return t(`taiwan.postalCode.${key}`, params)
  }

  // Preprocessing function
  const preprocessFn = (val: unknown) => {
    if (val === "" || val === null || val === undefined) {
      return actualDefaultValue
    }

    let processed = String(val).trim()

    // Remove dashes and spaces if allowDashes is true
    if (allowDashes) {
      processed = processed.replace(/[-\s]/g, "")
    }

    // If after processing we have an empty string and the field is optional, return null
    if (processed === "" && !required) {
      return null
    }

    if (transform) {
      processed = transform(processed)
    }

    return processed
  }

  const baseSchema = isRequired ? z.preprocess(preprocessFn, z.string()) : z.preprocess(preprocessFn, z.string().nullable())

  const schema = baseSchema.superRefine((val, ctx) => {
    if (val === null) return

    // Required check
    if (isRequired && (val === "" || val === "null" || val === "undefined")) {
      ctx.addIssue({ code: "custom", message: getMessage("required") })
      return
    }

    if (val === null) return
    if (!isRequired && val === "") return

    // Format-specific validation
    const cleanValue = val.replace(/[-\s]/g, "")

    // Check if format matches expected pattern
    if (format === "3" && cleanValue.length !== 3) {
      ctx.addIssue({ code: "custom", message: getMessage("format3Only") })
      return
    }
    if (format === "5" && cleanValue.length !== 5) {
      ctx.addIssue({ code: "custom", message: getMessage("format5Only") })
      return
    }
    if (format === "6" && cleanValue.length !== 6) {
      ctx.addIssue({ code: "custom", message: getMessage("format6Only") })
      return
    }

    // Check for deprecated 5-digit format
    if (deprecate5Digit && cleanValue.length === 5) {
      ctx.addIssue({ code: "custom", message: getMessage("deprecated5Digit") })
      return
    }

    // Pre-validate suffix for better error messages before main validation
    if (strictSuffixValidation) {
      if (cleanValue.length === 5) {
        const prefix = cleanValue.substring(0, 3)
        const suffix = cleanValue.substring(3, 5)
        const suffixNum = parseInt(suffix, 10)
        const ranges = getPostalCodeRanges(prefix)
        if (suffixNum < ranges.range5[0] || suffixNum > ranges.range5[1]) {
          ctx.addIssue({ code: "custom", message: getMessage("invalidSuffix") })
          return
        }
      } else if (cleanValue.length === 6) {
        const prefix = cleanValue.substring(0, 3)
        const suffix = cleanValue.substring(3, 6)
        const suffixNum = parseInt(suffix, 10)
        const ranges = getPostalCodeRanges(prefix)
        if (suffixNum < ranges.range6[0] || suffixNum > ranges.range6[1]) {
          ctx.addIssue({ code: "custom", message: getMessage("invalidSuffix") })
          return
        }
      }
    }

    // Main postal code validation (only validates prefix if strictSuffixValidation already passed)
    if (!validateTaiwanPostalCode(val, format, strictValidation, strictSuffixValidation, allowDashes, allowedPrefixes, blockedPrefixes)) {
      ctx.addIssue({ code: "custom", message: getMessage("invalid") })
      return
    }

    // Warning for 5-digit legacy format (doesn't fail validation)
    if (warn5Digit && cleanValue.length === 5 && format !== "5" && !deprecate5Digit) {
      console.warn(getMessage("legacy5DigitWarning"))
    }
  })

  return schema as unknown as PostalCodeSchema<IsRequired>
}

/**
 * Utility functions exported for external use
 *
 * @description
 * These validation functions can be used independently for postal code validation
 * without creating a full Zod schema. Useful for custom validation logic.
 *
 * @example
 * ```typescript
 * import {
 *   validateTaiwanPostalCode,
 *   validate3DigitPostalCode,
 *   validate5DigitPostalCode,
 *   validate6DigitPostalCode,
 *   VALID_3_DIGIT_PREFIXES
 * } from './postal-code'
 *
 * // General validation
 * const isValid = validateTaiwanPostalCode("100001", "6") // boolean
 *
 * // Specific format validation
 * const is3Digit = validate3DigitPostalCode("100") // boolean
 * const is5Digit = validate5DigitPostalCode("10001") // boolean
 * const is6Digit = validate6DigitPostalCode("100001") // boolean
 *
 * // Check if prefix is valid
 * const isValidPrefix = VALID_3_DIGIT_PREFIXES.includes("100") // boolean
 * ```
 */
export { validateTaiwanPostalCode, validate3DigitPostalCode, validate5DigitPostalCode, validate6DigitPostalCode, VALID_3_DIGIT_PREFIXES }
