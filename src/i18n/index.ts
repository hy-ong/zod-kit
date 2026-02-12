import zhTW from "./locales/zh-TW.json"
import zhCN from "./locales/zh-CN.json"
import enUS from "./locales/en-US.json"
import enGB from "./locales/en-GB.json"
import jaJP from "./locales/ja-JP.json"
import koKR from "./locales/ko-KR.json"
import msMY from "./locales/ms-MY.json"
import idID from "./locales/id-ID.json"
import thTH from "./locales/th-TH.json"
import viVN from "./locales/vi-VN.json"
import { getLocale } from "../config"

const dicts = {
  "zh-TW": zhTW,
  "zh-CN": zhCN,
  "en-US": enUS,
  "en-GB": enGB,
  "ja-JP": jaJP,
  "ko-KR": koKR,
  "ms-MY": msMY,
  "id-ID": idID,
  "th-TH": thTH,
  "vi-VN": viVN,
} satisfies Record<string, unknown>

export const t = (key: string, params: Record<string, any> = {}): string => {
  const locale = getLocale()
  const dict = dicts[locale] || {}

  const template = getNestedValue(dict, key) ?? key

  return template.replace(/\$\{(\w+)}/g, (_, k) => params[k] ?? "")
}

function getNestedValue(obj: Record<string, any>, path: string): string | undefined {
  const result = path.split(".").reduce((acc: any, part: string) => (acc && typeof acc === "object" ? acc[part] : undefined), obj)
  return typeof result === "string" ? result : undefined
}
