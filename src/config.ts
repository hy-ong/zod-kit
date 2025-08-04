export type Locale = "zh-TW" | "en"

let currentLocale: Locale = "zh-TW"

export const setLocale = (locale: Locale) => {
  currentLocale = locale
}

export const getLocale = (): Locale => currentLocale
