export type Locale = "zh-TW" | "zh-CN" | "en-US" | "en-GB" | "ja-JP" | "ko-KR" | "ms-MY" | "id-ID" | "th-TH" | "vi-VN"

let currentLocale: Locale = "en-US"

export const setLocale = (locale: Locale) => {
  currentLocale = locale
}

export const getLocale = (): Locale => currentLocale
