import zhTW from "./locales/zh-TW.json"
import en from "./locales/en.json"
import { getLocale } from "../config"

const dicts = {
  "zh-TW": zhTW,
  en,
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
